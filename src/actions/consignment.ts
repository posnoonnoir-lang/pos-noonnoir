"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type Consignment = {
    id: string; consignmentNo: string; supplierId: string; supplierName: string
    commissionRate: number; status: string
    items: Array<{ id: string; productId: string; productName: string; batchCode: string; costPrice: number; sellPrice: number; status: string; soldAt: Date | null; soldOrderId: string | null }>
    totalItems: number; soldItems: number; totalRevenue: number
    notes: string | null; receivedBy: string; receivedAt: Date; settledAt: Date | null
}

export type ConsignmentSettlement = {
    id: string; consignmentId: string; consignmentNo: string; supplierName: string
    periodStart: Date; periodEnd: Date; totalSoldItems: number; totalRevenue: number
    commissionRate: number; commissionAmount: number; amountDue: number
    status: string; createdAt: Date; confirmedAt: Date | null; paidAt: Date | null
}

// ============================================================
// CONSIGNMENT MODULE (US-2.2)
// Ký gửi NCC — nhận hàng, theo dõi, quyết toán
// ============================================================

export async function getConsignments() {
    const consignments = await prisma.consignment.findMany({
        include: {
            supplier: true,
            bottles: { include: { product: true } },
            settlements: true,
        },
        orderBy: { createdAt: "desc" },
    })

    return consignments.map((c) => ({
        id: c.id,
        consignmentNo: c.consignmentNo,
        supplierId: c.supplierId,
        supplierName: c.supplier.name,
        commissionRate: 30, // Default, could be stored on consignment
        status: c.status,
        items: c.bottles.map((b) => ({
            id: b.id,
            productId: b.productId,
            productName: b.product.name,
            batchCode: b.batchCode ?? "",
            costPrice: Number(b.costPrice ?? 0),
            sellPrice: Number(b.product.sellPrice),
            status: b.status,
            soldAt: b.soldAt,
            soldOrderId: null,
        })),
        totalItems: c.totalBottles,
        soldItems: c.soldBottles,
        totalRevenue: c.bottles
            .filter((b) => b.status === "SOLD")
            .reduce((s, b) => s + Number(b.product.sellPrice), 0),
        notes: null,
        receivedBy: "Owner",
        receivedAt: c.receivedDate,
        settledAt: c.settlements.find((s) => s.status === "PAID")?.createdAt ?? null,
    }))
}

export async function getConsignmentById(id: string) {
    const c = await prisma.consignment.findUnique({
        where: { id },
        include: {
            supplier: true,
            bottles: { include: { product: true } },
            settlements: true,
        },
    })
    if (!c) return null

    return {
        id: c.id,
        consignmentNo: c.consignmentNo,
        supplierId: c.supplierId,
        supplierName: c.supplier.name,
        commissionRate: 30,
        status: c.status,
        items: c.bottles.map((b) => ({
            id: b.id,
            productId: b.productId,
            productName: b.product.name,
            batchCode: b.batchCode ?? "",
            costPrice: Number(b.costPrice ?? 0),
            sellPrice: Number(b.product.sellPrice),
            status: b.status,
            soldAt: b.soldAt,
            soldOrderId: null,
        })),
        totalItems: c.totalBottles,
        soldItems: c.soldBottles,
        totalRevenue: c.bottles
            .filter((b) => b.status === "SOLD")
            .reduce((s, b) => s + Number(b.product.sellPrice), 0),
        notes: null,
        receivedBy: "Owner",
        receivedAt: c.receivedDate,
        settledAt: c.settlements.find((s) => s.status === "PAID")?.createdAt ?? null,
    }
}

export async function createConsignment(params: {
    supplierId: string
    supplierName: string
    commissionRate: number
    items: Array<{
        productId: string
        productName: string
        batchCode: string
        costPrice: number
        sellPrice: number
    }>
    notes?: string
    receivedBy: string
}) {
    try {
        const count = await prisma.consignment.count()
        const consignment = await prisma.consignment.create({
            data: {
                supplierId: params.supplierId,
                consignmentNo: `CSM-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`,
                receivedDate: new Date(),
                totalBottles: params.items.length,
                bottles: {
                    create: params.items.map((item) => ({
                        productId: item.productId,
                        batchCode: item.batchCode,
                        ownershipType: "CONSIGNED" as const,
                        costPrice: item.costPrice,
                        status: "IN_STOCK" as const,
                    })),
                },
            },
            include: { supplier: true, bottles: true },
        })
        revalidatePath("/dashboard/consignment")
        return { success: true, data: consignment }
    } catch {
        return { success: false }
    }
}

export async function returnConsignmentItem(consignmentId: string, itemId: string) {
    try {
        const bottle = await prisma.wineBottle.findFirst({
            where: { id: itemId, consignmentId, status: "IN_STOCK" },
        })
        if (!bottle) return { success: false }

        await prisma.wineBottle.update({
            where: { id: itemId },
            data: { status: "RETURNED" },
        })
        revalidatePath("/dashboard/consignment")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function markConsignmentItemDamaged(consignmentId: string, itemId: string) {
    try {
        await prisma.wineBottle.update({
            where: { id: itemId },
            data: { status: "DAMAGED" },
        })
        revalidatePath("/dashboard/consignment")
        return { success: true }
    } catch {
        return { success: false }
    }
}

// ============================================================
// SETTLEMENT
// ============================================================

export async function getSettlements() {
    const settlements = await prisma.consignmentSettlement.findMany({
        include: { consignment: { include: { supplier: true } } },
        orderBy: { createdAt: "desc" },
    })
    return settlements.map((s) => ({
        id: s.id,
        consignmentId: s.consignmentId,
        consignmentNo: s.consignment.consignmentNo,
        supplierName: s.consignment.supplier.name,
        periodStart: s.periodStart,
        periodEnd: s.periodEnd,
        totalSoldItems: s.totalSold,
        totalRevenue: Number(s.totalRevenue),
        commissionRate: 30,
        commissionAmount: Number(s.commission),
        amountDue: Number(s.amountDue),
        status: s.status,
        createdAt: s.createdAt,
        confirmedAt: null,
        paidAt: null,
    }))
}

export async function createSettlement(params: {
    consignmentId: string
    periodStart: Date
    periodEnd: Date
}) {
    try {
        const csm = await prisma.consignment.findUnique({
            where: { id: params.consignmentId },
            include: {
                bottles: {
                    where: {
                        status: "SOLD",
                        soldAt: { gte: params.periodStart, lte: params.periodEnd },
                    },
                    include: { product: true },
                },
            },
        })
        if (!csm) return { success: false }

        const totalRevenue = csm.bottles.reduce((s, b) => s + Number(b.product.sellPrice), 0)
        const commissionRate = 30
        const commission = Math.round(totalRevenue * (commissionRate / 100))
        const amountDue = totalRevenue - commission

        const settlement = await prisma.consignmentSettlement.create({
            data: {
                consignmentId: params.consignmentId,
                periodStart: params.periodStart,
                periodEnd: params.periodEnd,
                totalSold: csm.bottles.length,
                totalRevenue,
                commission,
                amountDue,
            },
        })
        revalidatePath("/dashboard/consignment")
        return { success: true, data: settlement }
    } catch {
        return { success: false }
    }
}

export async function confirmSettlement(settlementId: string) {
    try {
        await prisma.consignmentSettlement.update({
            where: { id: settlementId },
            data: { status: "CONFIRMED" },
        })
        revalidatePath("/dashboard/consignment")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function markSettlementPaid(settlementId: string) {
    try {
        const stl = await prisma.consignmentSettlement.update({
            where: { id: settlementId },
            data: { status: "PAID" },
        })
        await prisma.consignment.update({
            where: { id: stl.consignmentId },
            data: { status: "SETTLED" },
        })
        revalidatePath("/dashboard/consignment")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function getConsignmentStats() {
    const consignments = await prisma.consignment.findMany({
        include: { bottles: true },
    })
    const active = consignments.filter((c) => c.status === "ACTIVE")

    return {
        totalConsignments: consignments.length,
        activeConsignments: active.length,
        totalItems: consignments.reduce((s, c) => s + c.totalBottles, 0),
        soldItems: consignments.reduce(
            (s, c) => s + c.bottles.filter((b) => b.status === "SOLD").length, 0
        ),
        totalRevenue: 0, // Would need product join
        pendingSettlement: active.filter(
            (c) => c.bottles.some((b) => b.status === "SOLD")
        ).length,
    }
}
