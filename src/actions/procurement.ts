"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ============================================================
// PROCUREMENT — Supplier CRUD + Purchase Receipts (Nhập hàng)
// ============================================================

// ─── SUPPLIERS ───

export async function getSuppliers() {
    const suppliers = await prisma.supplier.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
            _count: { select: { consignments: true, stockMovements: true } },
        },
    })
    return suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        contactName: s.contactName,
        phone: s.phone,
        email: s.email,
        address: s.address,
        isActive: s.isActive,
        totalConsignments: s._count.consignments,
        totalPurchases: s._count.stockMovements,
        createdAt: s.createdAt,
    }))
}

export async function createSupplier(data: {
    name: string
    contactName?: string
    contactPerson?: string
    phone?: string
    email?: string
    address?: string
    taxCode?: string
    category?: string
}) {
    try {
        const supplier = await prisma.supplier.create({
            data: { ...data, contactName: data.contactName ?? data.contactPerson },
        })
        revalidatePath("/dashboard/procurement")
        return { success: true, data: supplier }
    } catch {
        return { success: false }
    }
}

export async function updateSupplier(id: string, data: Partial<{
    name: string; contactName: string; phone: string; email: string; address: string
}>) {
    try {
        await prisma.supplier.update({ where: { id }, data })
        revalidatePath("/dashboard/procurement")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function deleteSupplier(id: string) {
    const hasConsignments = await prisma.consignment.count({ where: { supplierId: id } })
    if (hasConsignments > 0) return { success: false, error: "NCC có lô ký gửi, không thể xóa" }
    try {
        await prisma.supplier.update({ where: { id }, data: { isActive: false } })
        revalidatePath("/dashboard/procurement")
        return { success: true }
    } catch {
        return { success: false, error: "Không tìm thấy" }
    }
}

// ─── PURCHASE RECEIPT (NHẬP HÀNG) — Weighted Average Cost ───

export type PurchaseReceiptItem = {
    ingredientId: string
    quantity: number      // in BASE unit (ml, g, pcs)
    unitCost: number      // cost per base unit
}

/**
 * Create a purchase receipt (phiếu nhập hàng)
 * - Records StockMovement for each item
 * - Updates Ingredient.currentStock
 * - Recalculates Ingredient.costPerUnit using WEIGHTED AVERAGE
 *
 * Formula: new_cost = (old_stock × old_cost + new_qty × new_cost) / (old_stock + new_qty)
 */
export async function createPurchaseReceipt(data: {
    supplierId: string
    items: PurchaseReceiptItem[]
    notes?: string
}) {
    if (!data.items.length) return { success: false, error: "Không có sản phẩm" }

    // Generate receipt number
    const today = new Date()
    const dateStr = `${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`
    const count = await prisma.stockMovement.count({
        where: { type: "PURCHASE", createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } },
    })
    const receiptNo = `PN-${dateStr}-${String(count + 1).padStart(3, "0")}`

    try {
        const results: Array<{ ingredientName: string; oldCost: number; newCost: number; qty: number }> = []

        for (const item of data.items) {
            // 1. Get current ingredient state
            const ingredient = await prisma.ingredient.findUnique({ where: { id: item.ingredientId } })
            if (!ingredient) continue

            const oldStock = Number(ingredient.currentStock)
            const oldCostPerUnit = Number(ingredient.costPerUnit)
            const baseQty = Number(ingredient.baseQuantity)

            // item.quantity is in BASE unit (ml, g, pcs)
            const newQty = item.quantity
            // item.unitCost is cost per BASE unit
            const importCostPerBase = item.unitCost

            // 2. Calculate WEIGHTED AVERAGE COST (per display unit)
            //    costPerUnit stored in DB = cost per display unit (e.g. cost per "chai", per "kg")
            //    We convert: old cost per base = oldCostPerUnit / baseQty
            const oldCostPerBase = baseQty > 0 ? oldCostPerUnit / baseQty : oldCostPerUnit
            const totalOldValue = oldStock * oldCostPerBase    // oldStock is in base unit
            const totalNewValue = newQty * importCostPerBase
            const totalStock = oldStock + newQty

            let newCostPerBase: number
            if (totalStock > 0) {
                newCostPerBase = (totalOldValue + totalNewValue) / totalStock
            } else {
                newCostPerBase = importCostPerBase
            }

            // Convert back to cost per display unit
            const newCostPerDisplayUnit = newCostPerBase * (baseQty > 0 ? baseQty : 1)

            // 3. Update Ingredient — stock + weighted average cost
            await prisma.ingredient.update({
                where: { id: item.ingredientId },
                data: {
                    currentStock: { increment: newQty },
                    costPerUnit: Math.round(newCostPerDisplayUnit),
                },
            })

            // 4. Record StockMovement
            await prisma.stockMovement.create({
                data: {
                    type: "PURCHASE",
                    ingredientId: item.ingredientId,
                    supplierId: data.supplierId,
                    receiptNo,
                    quantity: newQty,
                    unitCost: newCostPerBase,
                    totalCost: Math.round(newQty * newCostPerBase),
                    balanceQty: totalStock,
                    balanceCost: Math.round(newCostPerDisplayUnit),
                    reason: data.notes ?? `Nhập hàng ${receiptNo}`,
                },
            })

            results.push({
                ingredientName: ingredient.name,
                oldCost: Math.round(oldCostPerUnit),
                newCost: Math.round(newCostPerDisplayUnit),
                qty: newQty,
            })
        }

        revalidatePath("/dashboard/procurement")
        revalidatePath("/dashboard/inventory")
        return { success: true, receiptNo, results }
    } catch (err) {
        console.error("createPurchaseReceipt error:", err)
        return { success: false, error: "Lỗi tạo phiếu nhập" }
    }
}

// ─── PURCHASE HISTORY ─── 

export type PurchaseReceipt = {
    receiptNo: string
    supplierName: string
    supplierId: string
    date: Date
    items: Array<{
        ingredientId: string
        ingredientName: string
        quantity: number
        unit: string
        unitCost: number
        totalCost: number
        balanceCost: number | null
    }>
    totalAmount: number
}

export async function getPurchaseReceipts(): Promise<PurchaseReceipt[]> {
    const movements = await prisma.stockMovement.findMany({
        where: { type: "PURCHASE", ingredientId: { not: null } },
        include: {
            ingredient: true,
            supplier: true,
        },
        orderBy: { createdAt: "desc" },
        take: 200,
    })

    // Group by receiptNo
    const receiptMap = new Map<string, PurchaseReceipt>()
    for (const m of movements) {
        const key = m.receiptNo ?? m.id
        const existing = receiptMap.get(key)
        const item = {
            ingredientId: m.ingredientId!,
            ingredientName: m.ingredient?.name ?? "Unknown",
            quantity: Number(m.quantity),
            unit: m.ingredient?.baseUnit ?? "",
            unitCost: Number(m.unitCost ?? 0),
            totalCost: Number(m.totalCost ?? 0),
            balanceCost: m.balanceCost ? Number(m.balanceCost) : null,
        }
        if (existing) {
            existing.items.push(item)
            existing.totalAmount += item.totalCost
        } else {
            receiptMap.set(key, {
                receiptNo: m.receiptNo ?? m.id,
                supplierName: m.supplier?.name ?? "Unknown",
                supplierId: m.supplierId ?? "",
                date: m.createdAt,
                items: [item],
                totalAmount: item.totalCost,
            })
        }
    }

    return Array.from(receiptMap.values())
}

/**
 * Get import history for a specific ingredient (lịch sử nhập)
 */
export async function getIngredientPurchaseHistory(ingredientId: string) {
    const movements = await prisma.stockMovement.findMany({
        where: { type: "PURCHASE", ingredientId },
        include: { supplier: true },
        orderBy: { createdAt: "desc" },
        take: 50,
    })
    return movements.map((m) => ({
        id: m.id,
        receiptNo: m.receiptNo,
        supplierName: m.supplier?.name ?? "N/A",
        quantity: Number(m.quantity),
        unitCost: Number(m.unitCost ?? 0),
        totalCost: Number(m.totalCost ?? 0),
        balanceQty: Number(m.balanceQty ?? 0),
        balanceCost: Number(m.balanceCost ?? 0),
        date: m.createdAt,
    }))
}

// ─── STATS ───

export async function getProcurementStats() {
    const [suppliers, consignments, purchaseCount, purchaseTotal] = await Promise.all([
        prisma.supplier.count({ where: { isActive: true } }),
        prisma.consignment.count({ where: { status: "ACTIVE" } }),
        prisma.stockMovement.count({ where: { type: "PURCHASE" } }),
        prisma.stockMovement.aggregate({
            where: { type: "PURCHASE" },
            _sum: { totalCost: true },
        }),
    ])
    return {
        totalSuppliers: suppliers,
        activeConsignments: consignments,
        totalPurchases: purchaseCount,
        totalPurchaseValue: Number(purchaseTotal._sum.totalCost ?? 0),
        // Legacy fields
        pendingOrders: 0,
        totalPOs: purchaseCount,
        pendingPOs: 0,
        draftPOs: 0,
        totalSpent: Number(purchaseTotal._sum.totalCost ?? 0),
    }
}

// ─── TYPES (legacy compatibility) ───

export type Supplier = {
    id: string; name: string; contactName: string | null; contactPerson?: string | null
    phone: string | null; email: string | null; address: string | null
    taxCode?: string; category?: string
    isActive: boolean; status?: string
    totalConsignments: number; totalPurchases?: number; totalOrders?: number; totalSpent?: number
    createdAt: Date
}

export type POStatus = "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED" | "SENT" | "PARTIAL"
export type PurchaseOrderStatus = POStatus

export type PurchaseOrder = {
    id: string; poNumber: string; supplierId: string; supplierName: string
    status: POStatus
    items: Array<{
        id?: string; productName: string; sku?: string; qty: number; quantity?: number
        unitCost: number; unitPrice?: number; totalPrice?: number; unit?: string
        category?: string; receivedQty?: number
    }>
    subtotal?: number; tax?: number; notes?: string
    totalAmount: number; createdBy?: string; expectedDate?: Date | null; createdAt: Date
}

export type GoodsReceipt = {
    id: string; poId: string; poNumber?: string; supplierName?: string
    receivedAt: Date; receivedBy?: string; totalAmount?: number
    items: Array<{ productName: string; qty: number }>
    receivedItems?: Array<Record<string, unknown>>
}

export type FIFOBatch = {
    id: string; productId: string; productName: string; supplierName?: string
    sku?: string; poNumber?: string; batchDate?: Date
    batchNo: string; qty: number; initialQty?: number
    unitCost: number; remainingQty: number; createdAt: Date
}

// Legacy stubs
export async function getPurchaseOrders() { return [] }
export async function getGoodsReceipts(): Promise<GoodsReceipt[]> { return [] }
export async function getFIFOBatches(): Promise<FIFOBatch[]> { return [] }
export async function updatePOStatus(_id: string, _status: POStatus) { return { success: true } }
export async function receivePurchaseOrder(_poId: string, _receivedItems?: Array<{ itemId: string; receivedQty: number }>, _staffName?: string) { return { success: true } }
export async function createPurchaseOrder(_data: Partial<PurchaseOrder>) { return { success: true } }
