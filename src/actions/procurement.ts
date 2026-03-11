"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ============================================================
// PROCUREMENT — Supplier CRUD + Purchase Orders
// ============================================================

export async function getSuppliers() {
    const suppliers = await prisma.supplier.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: { _count: { select: { consignments: true } } },
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

// Purchase order types for UI (kept as simple helpers)
export type PurchaseOrderStatus = "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED"

export async function getPurchaseOrders() {
    // Purchase orders not in schema yet — return empty
    return []
}

export async function getProcurementStats() {
    const suppliers = await prisma.supplier.count({ where: { isActive: true } })
    const consignments = await prisma.consignment.count({ where: { status: "ACTIVE" } })
    return {
        totalSuppliers: suppliers,
        activeConsignments: consignments,
        pendingOrders: 0,
        totalPurchaseValue: 0,
        totalPOs: 0,
        pendingPOs: 0,
        draftPOs: 0,
        totalSpent: 0,
    }
}

// Types for procurement page
export type Supplier = {
    id: string; name: string; contactName: string | null; contactPerson?: string | null
    phone: string | null; email: string | null; address: string | null
    taxCode?: string; category?: string
    isActive: boolean; status?: string
    totalConsignments: number; totalOrders?: number; totalSpent?: number
    createdAt: Date
}

export type POStatus = "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED" | "SENT" | "PARTIAL"

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

// Stub functions
export async function getGoodsReceipts(): Promise<GoodsReceipt[]> { return [] }
export async function getFIFOBatches(): Promise<FIFOBatch[]> { return [] }
export async function updatePOStatus(_id: string, _status: POStatus) { return { success: true } }
export async function receivePurchaseOrder(_poId: string, _receivedItems?: Array<{ itemId: string; receivedQty: number }>, _staffName?: string) { return { success: true } }
export async function createPurchaseOrder(_data: Partial<PurchaseOrder>) { return { success: true } }
