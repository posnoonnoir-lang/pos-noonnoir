"use server"

import { prisma } from "@/lib/prisma"
import type { PromoType as PrismaPromoType, PromoStatus as PrismaPromoStatus, DayOfWeek as PrismaDayOfWeek } from "@prisma/client"

// ============================================================
// PROMOTIONS & HAPPY HOUR — Prisma version
// ============================================================

type PromoType = "HAPPY_HOUR" | "PERCENT_OFF" | "COMBO" | "FIXED_AMOUNT"
type PromoStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED"
type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"

export type Promotion = {
    id: string; name: string; description: string; type: PromoType; status: PromoStatus
    discountPercent: number | null; discountAmount: number | null
    minOrderAmount: number | null; maxDiscount: number | null
    applicableCategories: string[]; applicableProducts: string[]
    startTime: string | null; endTime: string | null; activeDays: DayOfWeek[]
    startDate: Date; endDate: Date | null; maxUsage: number | null; currentUsage: number
    comboRequirement: string | null; comboReward: string | null; priority: number; createdAt: Date
}

export type AppliedPromo = { id: string; name: string; type: PromoType; discountAmount: number; description: string }
export type PromoStats = { totalPromotions: number; activeNow: number; totalDiscountGiven: number; mostUsedPromo: string; todayDiscounts: number }

function toPromotion(p: Awaited<ReturnType<typeof prisma.promotion.findFirst>>): Promotion {
    return {
        id: p!.id, name: p!.name, description: p!.description,
        type: p!.type as PromoType, status: p!.status as PromoStatus,
        discountPercent: p!.discountPercent, discountAmount: p!.discountAmount ? Number(p!.discountAmount) : null,
        minOrderAmount: p!.minOrderAmount ? Number(p!.minOrderAmount) : null,
        maxDiscount: p!.maxDiscount ? Number(p!.maxDiscount) : null,
        applicableCategories: p!.applicableCategories, applicableProducts: p!.applicableProducts,
        startTime: p!.startTime, endTime: p!.endTime,
        activeDays: p!.activeDays as DayOfWeek[], startDate: p!.startDate, endDate: p!.endDate,
        maxUsage: p!.maxUsage, currentUsage: p!.currentUsage,
        comboRequirement: p!.comboRequirement, comboReward: p!.comboReward,
        priority: p!.priority, createdAt: p!.createdAt,
    }
}

export async function getAllPromotions(): Promise<Promotion[]> {
    const rows = await prisma.promotion.findMany({ orderBy: { priority: "desc" } })
    return rows.map((r) => toPromotion(r))
}

export async function getActivePromotions(): Promise<Promotion[]> {
    const now = new Date()
    const dayMap: Record<number, DayOfWeek> = { 0: "SUN", 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT" }
    const today = dayMap[now.getDay()]
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    const rows = await prisma.promotion.findMany({
        where: {
            status: "ACTIVE",
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gte: now } }],
            activeDays: { has: today as PrismaDayOfWeek },
        },
        orderBy: { priority: "desc" },
    })

    return rows.filter((p) => {
        if (p.startTime && p.endTime && (timeStr < p.startTime || timeStr > p.endTime)) return false
        if (p.maxUsage && p.currentUsage >= p.maxUsage) return false
        return true
    }).map((r) => toPromotion(r))
}

export async function checkPromotions(params: {
    orderTotal: number
    items: Array<{ productId: string; categorySlug: string; quantity: number; unitPrice: number }>
}): Promise<AppliedPromo[]> {
    const active = await getActivePromotions()
    const applied: AppliedPromo[] = []

    for (const promo of active) {
        if (promo.minOrderAmount && params.orderTotal < promo.minOrderAmount) continue

        let discount = 0

        if (promo.type === "HAPPY_HOUR" || promo.type === "PERCENT_OFF") {
            const rate = promo.discountPercent ?? 0
            const applicableItems = params.items.filter((item) => {
                if (promo.applicableCategories.length > 0 && !promo.applicableCategories.includes(item.categorySlug)) return false
                if (promo.applicableProducts.length > 0 && !promo.applicableProducts.includes(item.productId)) return false
                return true
            })
            if (promo.applicableCategories.length === 0 && promo.applicableProducts.length === 0) {
                discount = Math.round(params.orderTotal * rate / 100)
            } else if (applicableItems.length > 0) {
                const subtotal = applicableItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
                discount = Math.round(subtotal * rate / 100)
            }
        } else if (promo.type === "FIXED_AMOUNT") {
            discount = promo.discountAmount ?? 0
        } else if (promo.type === "COMBO") {
            const hasQualifyingItem = params.items.some((item) =>
                promo.applicableCategories.includes(item.categorySlug) && item.unitPrice * item.quantity >= (promo.minOrderAmount ?? 0)
            )
            if (hasQualifyingItem) discount = promo.discountAmount ?? 0
        }

        if (discount > 0) {
            if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount)
            applied.push({ id: promo.id, name: promo.name, type: promo.type, discountAmount: discount, description: promo.description })
        }
    }
    return applied
}

export async function createPromotion(params: {
    name: string; description: string; type: PromoType; discountPercent?: number; discountAmount?: number
    minOrderAmount?: number; maxDiscount?: number; applicableCategories?: string[]
    startTime?: string; endTime?: string; activeDays: DayOfWeek[]; startDate: string; endDate?: string; maxUsage?: number
}): Promise<{ success: boolean; data?: Promotion }> {
    const count = await prisma.promotion.count()
    const row = await prisma.promotion.create({
        data: {
            name: params.name, description: params.description,
            type: params.type as PrismaPromoType, status: "ACTIVE" as PrismaPromoStatus,
            discountPercent: params.discountPercent ?? null, discountAmount: params.discountAmount ?? null,
            minOrderAmount: params.minOrderAmount ?? null, maxDiscount: params.maxDiscount ?? null,
            applicableCategories: params.applicableCategories ?? [],
            startTime: params.startTime ?? null, endTime: params.endTime ?? null,
            activeDays: params.activeDays as PrismaDayOfWeek[],
            startDate: new Date(params.startDate), endDate: params.endDate ? new Date(params.endDate) : null,
            maxUsage: params.maxUsage ?? null, priority: count + 1,
        },
    })
    return { success: true, data: toPromotion(row) }
}

export async function togglePromoStatus(id: string): Promise<{ success: boolean }> {
    const promo = await prisma.promotion.findUnique({ where: { id } })
    if (!promo) return { success: false }
    await prisma.promotion.update({
        where: { id }, data: { status: promo.status === "ACTIVE" ? "DISABLED" : "ACTIVE" },
    })
    return { success: true }
}

export async function updatePromotion(
    id: string,
    data: Partial<{
        name: string; description: string; type: PromoType
        discountPercent: number | null; discountAmount: number | null
        minOrderAmount: number | null; maxDiscount: number | null
        startTime: string | null; endTime: string | null; activeDays: DayOfWeek[]
        startDate: string; endDate: string | null; maxUsage: number | null
    }>
): Promise<{ success: boolean }> {
    try {
        await prisma.promotion.update({
            where: { id },
            data: {
                ...data,
                type: data.type as PrismaPromoType | undefined,
                activeDays: data.activeDays as PrismaDayOfWeek[] | undefined,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : data.endDate === null ? null : undefined,
            },
        })
        return { success: true }
    } catch { return { success: false } }
}

export async function deletePromotion(id: string): Promise<{ success: boolean }> {
    try {
        await prisma.promotion.delete({ where: { id } })
        return { success: true }
    } catch { return { success: false } }
}

export async function getPromoStats(): Promise<PromoStats> {
    const all = await prisma.promotion.findMany()
    const active = all.filter((p) => p.status === "ACTIVE")
    const totalDiscount = all.reduce((s, p) => s + p.currentUsage * Number(p.discountAmount ?? (p.discountPercent ?? 0) * 100), 0)
    const mostUsed = [...all].sort((a, b) => b.currentUsage - a.currentUsage)[0]

    return {
        totalPromotions: all.length, activeNow: active.length, totalDiscountGiven: totalDiscount,
        mostUsedPromo: mostUsed?.name ?? "—", todayDiscounts: Math.round(totalDiscount * 0.03),
    }
}
