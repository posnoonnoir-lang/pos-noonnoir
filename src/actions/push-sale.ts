"use server"

import { prisma } from "@/lib/prisma"

// ============================================================
// PUSH SALE — V2 Feature 6 — Prisma version
// Dynamically detects oxidation, low glasses, slow movers
// ============================================================

export type PushSaleItem = {
    id: string; productId: string; productName: string; reason: string
    reasonType: "OXIDATION" | "LOW_GLASSES" | "SLOW_MOVING" | "NEAR_EXPIRY"
    urgency: "HIGH" | "MEDIUM" | "LOW"; detail: string; suggestedDiscount: number
    currentPrice: number; glassesRemaining?: number; hoursOpened?: number; daysUnsold?: number
}

export async function getPushSaleItems(): Promise<PushSaleItem[]> {
    const items: PushSaleItem[] = []
    const now = new Date()

    // 1. Oxidation risk — opened bottles past oxidation threshold
    const openedBottles = await prisma.wineBottle.findMany({
        where: { status: "OPENED" },
        include: { product: true },
    })

    for (const b of openedBottles) {
        if (!b.openedAt) continue
        const hoursOpened = Math.floor((now.getTime() - b.openedAt.getTime()) / 3600000)
        const threshold = b.product.oxidationHours ?? 48
        if (hoursOpened >= threshold) {
            items.push({
                id: `push-ox-${b.id.slice(0, 8)}`, productId: b.productId, productName: b.product.name,
                reason: "Oxy hóa — quá ngưỡng", reasonType: "OXIDATION", urgency: "HIGH",
                detail: `Mở ${hoursOpened}h trước · Ngưỡng: ${threshold}h · Còn ${b.glassesRemaining ?? 0}/${b.product.glassesPerBottle} ly`,
                suggestedDiscount: 30, currentPrice: Number(b.product.glassPrice ?? b.product.sellPrice),
                glassesRemaining: b.glassesRemaining ?? 0, hoursOpened,
            })
        } else if ((b.glassesRemaining ?? 0) <= 2 && (b.glassesRemaining ?? 0) > 0) {
            items.push({
                id: `push-low-${b.id.slice(0, 8)}`, productId: b.productId, productName: b.product.name,
                reason: "Sắp hết ly", reasonType: "LOW_GLASSES", urgency: "MEDIUM",
                detail: `Còn ${b.glassesRemaining}/${b.product.glassesPerBottle} ly · Chai gần cạn`,
                suggestedDiscount: 15, currentPrice: Number(b.product.glassPrice ?? b.product.sellPrice),
                glassesRemaining: b.glassesRemaining ?? 0, hoursOpened,
            })
        }
    }

    // 2. Slow movers — bottles not sold for 14+ days
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000)
    const slowMovers = await prisma.product.findMany({
        where: {
            isActive: true, type: { in: ["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"] },
            wineBottles: { some: { status: "IN_STOCK", receivedAt: { lt: twoWeeksAgo } } },
        },
        include: { wineBottles: { where: { status: "IN_STOCK" } } },
    })

    for (const p of slowMovers) {
        const oldestBottle = p.wineBottles.sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime())[0]
        if (!oldestBottle) continue
        const daysUnsold = Math.floor((now.getTime() - oldestBottle.receivedAt.getTime()) / 86400000)
        items.push({
            id: `push-slow-${p.id.slice(0, 8)}`, productId: p.id, productName: p.name,
            reason: `Tồn lâu — ${daysUnsold} ngày không bán`, reasonType: "SLOW_MOVING", urgency: "LOW",
            detail: `${daysUnsold} ngày không bán · Tồn: ${p.wineBottles.length} chai`,
            suggestedDiscount: 10, currentPrice: Number(p.sellPrice), daysUnsold,
        })
    }

    return items.sort((a, b) => {
        const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    })
}

export async function applyPushDiscount(
    productId: string, discountPct: number, managerPin: string
): Promise<{ success: boolean; error?: string }> {
    if (!managerPin || managerPin.length < 4) return { success: false, error: "PIN không hợp lệ" }
    if (discountPct < 5 || discountPct > 50) return { success: false, error: "Giảm giá phải từ 5% đến 50%" }

    const manager = await prisma.staff.findFirst({
        where: { pinCode: managerPin, role: { in: ["MANAGER", "OWNER"] }, isActive: true },
    })
    if (!manager) return { success: false, error: "PIN không hợp lệ" }

    await prisma.auditLog.create({
        data: {
            action: "PUSH_DISCOUNT", tableName: "product", recordId: productId,
            newData: { discountPct, approvedBy: manager.fullName }, staffId: manager.id,
        },
    })
    return { success: true }
}
