"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { withRbac } from "@/lib/with-rbac"

// ============================================================
// WASTE / SPOILAGE TRACKING — FR-3.7
// Record, report, and analyze waste for wine & ingredients
// ============================================================

export type WasteType = "WASTE" | "SPOILAGE" | "BREAKAGE"

export type WasteRecord = {
    id: string
    type: WasteType
    productId: string | null
    productName: string | null
    ingredientId: string | null
    ingredientName: string | null
    quantity: number
    unitCost: number
    totalCost: number
    reason: string | null
    staffName: string | null
    createdAt: string
}

export type WasteReport = {
    records: WasteRecord[]
    summary: {
        totalRecords: number
        totalCost: number
        byType: { type: WasteType; count: number; cost: number }[]
        byMonth: { month: string; cost: number; count: number }[]
        wastePctOfRevenue: number
    }
}

// Record new waste/spoilage/breakage
export async function recordWaste(params: {
    type: WasteType
    productId?: string
    ingredientId?: string
    quantity: number
    reason: string
    staffId: string
}): Promise<{ success: boolean; error?: string }> {
    const guard = await withRbac("inventory", "create")
    if (!guard.ok) return { success: false, error: guard.error }

    try {
        let unitCost = 0
        let productName: string | null = null
        let ingredientName: string | null = null

        if (params.productId) {
            // Wine/product waste — mark bottle as DAMAGED
            const product = await prisma.product.findUnique({ where: { id: params.productId } })
            if (!product) return { success: false, error: "Sản phẩm không tồn tại" }
            unitCost = Number(product.costPrice)
            productName = product.name

            // If wine, try to mark bottles as DAMAGED
            if (["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"].includes(product.type)) {
                const bottles = await prisma.wineBottle.findMany({
                    where: { productId: params.productId, status: { in: ["IN_STOCK", "OPENED"] } },
                    orderBy: { receivedAt: "asc" },
                    take: Math.ceil(params.quantity),
                })
                for (const bottle of bottles.slice(0, Math.ceil(params.quantity))) {
                    await prisma.wineBottle.update({
                        where: { id: bottle.id },
                        data: { status: "DAMAGED" },
                    })
                    if (bottle.costPrice) unitCost = Number(bottle.costPrice)
                }
            }
        }

        if (params.ingredientId) {
            const ingredient = await prisma.ingredient.findUnique({ where: { id: params.ingredientId } })
            if (!ingredient) return { success: false, error: "Nguyên liệu không tồn tại" }
            unitCost = Number(ingredient.costPerUnit)
            ingredientName = ingredient.name

            // Deduct from stock
            await prisma.ingredient.update({
                where: { id: params.ingredientId },
                data: { currentStock: { decrement: params.quantity } },
            })
        }

        const totalCost = unitCost * params.quantity

        // Create stock movement
        await prisma.stockMovement.create({
            data: {
                type: params.type,
                productId: params.productId ?? null,
                ingredientId: params.ingredientId ?? null,
                quantity: params.quantity,
                unitCost,
                totalCost,
                reason: params.reason,
                createdBy: params.staffId,
            },
        })

        // Auto-create expense in fund transactions
        await prisma.fundTransaction.create({
            data: {
                transactionType: "EXPENSE",
                category: `${params.type} — ${productName ?? ingredientName ?? "Unknown"}`,
                amount: totalCost,
                description: `${params.type}: ${productName ?? ingredientName} x${params.quantity} — ${params.reason}`,
            },
        })

        revalidatePath("/dashboard/waste")
        revalidatePath("/dashboard/reports")
        return { success: true }
    } catch (err) {
        console.error("[Waste] recordWaste failed:", err)
        return { success: false, error: "Lỗi ghi nhận hao hụt" }
    }
}

// Get waste records with filters
export async function getWasteRecords(params?: {
    dateFrom?: string
    dateTo?: string
    type?: WasteType
}): Promise<WasteRecord[]> {
    const where: Record<string, unknown> = {
        type: { in: ["WASTE", "SPOILAGE", "BREAKAGE"] as const },
    }

    if (params?.type) {
        where.type = params.type
    }

    if (params?.dateFrom || params?.dateTo) {
        const dateFilter: Record<string, Date> = {}
        if (params.dateFrom) dateFilter.gte = new Date(params.dateFrom)
        if (params.dateTo) dateFilter.lte = new Date(params.dateTo + "T23:59:59")
        where.createdAt = dateFilter
    }

    const movements = await prisma.stockMovement.findMany({
        where,
        include: { ingredient: true },
        orderBy: { createdAt: "desc" },
        take: 200,
    })

    // Batch load product names
    const productIds = movements.filter((m) => m.productId).map((m) => m.productId!)
    const products = productIds.length > 0
        ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
        : []
    const productMap = new Map(products.map((p) => [p.id, p.name]))

    // Batch load staff names
    const staffIds = movements.filter((m) => m.createdBy).map((m) => m.createdBy!)
    const staffList = staffIds.length > 0
        ? await prisma.staff.findMany({ where: { id: { in: staffIds } }, select: { id: true, fullName: true } })
        : []
    const staffMap = new Map(staffList.map((s) => [s.id, s.fullName]))

    return movements.map((m) => ({
        id: m.id,
        type: m.type as WasteType,
        productId: m.productId,
        productName: m.productId ? (productMap.get(m.productId) ?? null) : null,
        ingredientId: m.ingredientId,
        ingredientName: m.ingredient?.name ?? null,
        quantity: Number(m.quantity),
        unitCost: Number(m.unitCost ?? 0),
        totalCost: Number(m.totalCost ?? 0),
        reason: m.reason,
        staffName: m.createdBy ? (staffMap.get(m.createdBy) ?? null) : null,
        createdAt: m.createdAt.toISOString(),
    }))
}

// Full waste report with analytics
export async function getWasteReport(params?: {
    dateFrom?: string
    dateTo?: string
}): Promise<WasteReport> {
    const records = await getWasteRecords(params)

    const totalCost = records.reduce((s, r) => s + r.totalCost, 0)

    // By type
    const typeMap = new Map<WasteType, { count: number; cost: number }>()
    for (const r of records) {
        const entry = typeMap.get(r.type) ?? { count: 0, cost: 0 }
        entry.count++
        entry.cost += r.totalCost
        typeMap.set(r.type, entry)
    }
    const byType = Array.from(typeMap.entries()).map(([type, data]) => ({ type, ...data }))

    // By month
    const monthMap = new Map<string, { cost: number; count: number }>()
    for (const r of records) {
        const month = r.createdAt.slice(0, 7) // YYYY-MM
        const entry = monthMap.get(month) ?? { cost: 0, count: 0 }
        entry.count++
        entry.cost += r.totalCost
        monthMap.set(month, entry)
    }
    const byMonth = Array.from(monthMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))

    // Waste vs revenue
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
    const revenueAgg = await prisma.order.aggregate({
        where: { status: { in: ["PAID", "COMPLETED"] }, createdAt: { gte: thirtyDaysAgo } },
        _sum: { totalAmount: true },
    })
    const monthRevenue = Number(revenueAgg._sum.totalAmount ?? 0)
    const recentWasteCost = records
        .filter((r) => new Date(r.createdAt) >= thirtyDaysAgo)
        .reduce((s, r) => s + r.totalCost, 0)
    const wastePctOfRevenue = monthRevenue > 0 ? Math.round((recentWasteCost / monthRevenue) * 1000) / 10 : 0

    return {
        records,
        summary: {
            totalRecords: records.length,
            totalCost,
            byType,
            byMonth,
            wastePctOfRevenue,
        },
    }
}

// Get products + ingredients for waste form dropdown
export async function getWasteFormOptions(): Promise<{
    products: { id: string; name: string; type: string; costPrice: number }[]
    ingredients: { id: string; name: string; unit: string; costPerUnit: number }[]
}> {
    const [products, ingredients] = await Promise.all([
        prisma.product.findMany({
            where: { isActive: true },
            select: { id: true, name: true, type: true, costPrice: true },
            orderBy: { name: "asc" },
        }),
        prisma.ingredient.findMany({
            where: { isActive: true },
            select: { id: true, name: true, unit: true, costPerUnit: true },
            orderBy: { name: "asc" },
        }),
    ])

    return {
        products: products.map((p) => ({ id: p.id, name: p.name, type: p.type, costPrice: Number(p.costPrice) })),
        ingredients: ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit, costPerUnit: Number(i.costPerUnit) })),
    }
}
