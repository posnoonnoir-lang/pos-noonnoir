"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ============================================================
// INVENTORY — Stock movements, ingredients, wine bottles
// ============================================================

export async function getInventoryItems() {
    const [products, bottles, ingredients] = await Promise.all([
        prisma.product.findMany({
            where: { isActive: true, trackInventory: true },
            include: { category: true },
        }),
        prisma.wineBottle.findMany({
            include: { product: true, consignment: true },
            orderBy: { receivedAt: "desc" },
        }),
        prisma.ingredient.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        }),
    ])

    return {
        products: products.map((p) => ({
            id: p.id, name: p.name, type: p.type,
            categoryName: p.category.name,
            costPrice: Number(p.costPrice),
            sellPrice: Number(p.sellPrice),
            lowStockAlert: p.lowStockAlert,
        })),
        bottles: bottles.map((b) => ({
            id: b.id,
            productName: b.product.name,
            batchCode: b.batchCode,
            ownership: b.ownershipType,
            status: b.status,
            glassesRemaining: b.glassesRemaining,
            openedAt: b.openedAt,
            costPrice: Number(b.costPrice ?? 0),
            receivedAt: b.receivedAt,
            consignmentNo: b.consignment?.consignmentNo ?? null,
        })),
        ingredients: ingredients.map((i) => ({
            id: i.id, name: i.name, unit: i.unit,
            currentStock: Number(i.currentStock),
            minStock: Number(i.minStock),
            costPerUnit: Number(i.costPerUnit),
            isLowStock: Number(i.currentStock) <= Number(i.minStock),
        })),
    }
}

export async function getStockMovements(params?: { limit?: number }) {
    const movements = await prisma.stockMovement.findMany({
        orderBy: { createdAt: "desc" },
        take: params?.limit ?? 50,
    })
    return movements.map((m) => ({
        id: m.id, type: m.type,
        productId: m.productId,
        quantity: Number(m.quantity),
        unitCost: m.unitCost ? Number(m.unitCost) : null,
        reason: m.reason,
        createdAt: m.createdAt,
    }))
}

export async function createStockMovement(data: {
    type: "PURCHASE" | "WASTE" | "ADJUSTMENT" | "RETURN"
    productId?: string
    bottleId?: string
    quantity: number
    unitCost?: number
    reason?: string
    createdBy?: string
}) {
    try {
        await prisma.stockMovement.create({
            data: {
                type: data.type,
                productId: data.productId,
                bottleId: data.bottleId,
                quantity: data.quantity,
                unitCost: data.unitCost,
                reason: data.reason,
                createdBy: data.createdBy,
            },
        })
        revalidatePath("/dashboard/inventory")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function createIngredient(data: {
    name: string; unit: string; currentStock: number; minStock: number; costPerUnit: number
}) {
    try {
        const ingredient = await prisma.ingredient.create({ data })
        revalidatePath("/dashboard/inventory")
        return { success: true, data: ingredient }
    } catch {
        return { success: false }
    }
}

export async function updateIngredientStock(id: string, newStock: number) {
    try {
        await prisma.ingredient.update({ where: { id }, data: { currentStock: newStock } })
        revalidatePath("/dashboard/inventory")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function getInventoryStats() {
    const [bottleCount, ingredients] = await Promise.all([
        prisma.wineBottle.groupBy({
            by: ["status"],
            _count: true,
        }),
        prisma.ingredient.findMany({ where: { isActive: true } }),
    ])

    const lowStockIngredients = ingredients.filter((i) => Number(i.currentStock) <= Number(i.minStock))

    return {
        totalBottles: bottleCount.reduce((s, b) => s + b._count, 0),
        inStockBottles: bottleCount.find((b) => b.status === "IN_STOCK")?._count ?? 0,
        openedBottles: bottleCount.find((b) => b.status === "OPENED")?._count ?? 0,
        totalIngredients: ingredients.length,
        lowStockAlerts: lowStockIngredients.length,
        // backward compat aliases
        totalItems: bottleCount.reduce((s, b) => s + b._count, 0) + ingredients.length,
        inStock: bottleCount.find((b) => b.status === "IN_STOCK")?._count ?? 0,
        lowStock: lowStockIngredients.length,
        outOfStock: 0,
        totalValue: 0,
        expiringSoon: 0,
    }
}

// Fixed assets / depreciation stubs
export async function getFixedAssets() { return [] }
export async function calculateDepreciation() { return { success: true, processed: 0 } }

// Types for inventory page
export type InventoryItem = {
    id: string; name: string; productName?: string; type: string; categoryName: string
    sku?: string; category?: string; unit?: string
    costPrice: number; sellPrice: number; currentStock: number
    lowStockAlert: number; minStock?: number; maxStock?: number
    expiryDate?: Date | null; status: InventoryStatus
}

export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"

export type StockMovement = {
    id: string; type: string; productId: string | null; productName?: string
    quantity: number; unitCost: number | null; reason: string | null
    staffName?: string; previousStock?: number; newStock?: number
    createdAt: Date
}

// Alias functions for backward compat
export async function getInventory() {
    const data = await getInventoryItems()
    return data.products.map((p) => ({
        ...p, currentStock: 0, status: "IN_STOCK" as InventoryStatus,
    }))
}

export async function adjustStock(productId: string, typeOrAdjustment: string | number, quantityOrReason?: number | string, reason?: string, _staffName?: string) {
    // Accept both (id, adjustment, reason?) and (id, type, qty, reason, staffName)
    let type: string
    let quantity: number
    let reasonStr: string | undefined
    if (typeof typeOrAdjustment === "number") {
        type = typeOrAdjustment >= 0 ? "PURCHASE" : "ADJUSTMENT"
        quantity = Math.abs(typeOrAdjustment)
        reasonStr = quantityOrReason as string | undefined
    } else {
        type = typeOrAdjustment as string
        quantity = quantityOrReason as number
        reasonStr = reason
    }
    const result = await createStockMovement({ type: type as any, productId, quantity, reason: reasonStr })
    return { ...result, error: result.success ? undefined : "Lỗi" }
}

