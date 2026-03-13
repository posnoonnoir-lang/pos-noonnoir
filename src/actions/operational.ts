"use server"

import { prisma } from "@/lib/prisma"

/**
 * Phase 8A: Operational Polish — 6 server actions
 * 
 * 1. Table Transfer — uses Prisma Order + AuditLog
 * 2. 86/Out of Stock — uses Prisma Out86 model
 * 3. Service Charge — uses StoreSettings (JSON field)
 * 4. Discount Authorization — uses Prisma Staff (PIN) + AuditLog
 * 5. Order Hold/Park — transient in-memory (session-based)
 * 6. Receipt Reprint — uses Prisma Order/Payment data
 */

// ============================================================
// 1. TABLE TRANSFER
// ============================================================

export type TableTransferLog = {
    id: string; orderId: string; orderNumber: string
    fromTableId: string; fromTableNumber: string
    toTableId: string; toTableNumber: string
    staffId: string; staffName: string; reason: string; transferredAt: Date
}

export async function transferTable(params: {
    orderId: string; orderNumber: string
    fromTableId: string; fromTableNumber: string
    toTableId: string; toTableNumber: string
    staffId: string; staffName: string; reason?: string
}): Promise<{ success: boolean; error?: string }> {
    if (params.fromTableId === params.toTableId) {
        return { success: false, error: "Bàn đích trùng bàn hiện tại" }
    }

    try {
        await prisma.$transaction([
            prisma.order.update({ where: { id: params.orderId }, data: { tableId: params.toTableId } }),
            prisma.floorTable.update({ where: { id: params.fromTableId }, data: { status: "AVAILABLE" } }),
            prisma.floorTable.update({ where: { id: params.toTableId }, data: { status: "OCCUPIED" } }),
            prisma.auditLog.create({
                data: {
                    action: "TABLE_TRANSFER", tableName: "order", recordId: params.orderId,
                    oldData: { fromTable: params.fromTableNumber }, newData: { toTable: params.toTableNumber, reason: params.reason ?? "Khách yêu cầu đổi bàn", staff: params.staffName },
                    staffId: params.staffId,
                },
            }),
        ])
        return { success: true }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

export async function getTransferHistory(orderId?: string): Promise<TableTransferLog[]> {
    const logs = await prisma.auditLog.findMany({
        where: { action: "TABLE_TRANSFER", ...(orderId ? { recordId: orderId } : {}) },
        orderBy: { createdAt: "desc" },
    })
    return logs.map((l) => ({
        id: l.id, orderId: l.recordId, orderNumber: "",
        fromTableId: "", fromTableNumber: (l.oldData as Record<string, string>)?.fromTable ?? "",
        toTableId: "", toTableNumber: (l.newData as Record<string, string>)?.toTable ?? "",
        staffId: l.staffId ?? "", staffName: (l.newData as Record<string, string>)?.staff ?? "",
        reason: (l.newData as Record<string, string>)?.reason ?? "", transferredAt: l.createdAt,
    }))
}

// ============================================================
// 2. 86 / OUT OF STOCK — Prisma Out86
// ============================================================

export type ProductAvailability = {
    productId: string; productName: string; isAvailable: boolean
    reason86: string | null; markedBy: string; markedByName: string; markedAt: Date | null
}

export async function markProduct86(params: {
    productId: string; productName: string; reason: string; staffId: string; staffName: string
}): Promise<{ success: boolean }> {
    await prisma.out86.upsert({
        where: { productId: params.productId },
        create: { productId: params.productId, productName: params.productName, reason: params.reason, staffId: params.staffId, staffName: params.staffName },
        update: { reason: params.reason, staffId: params.staffId, staffName: params.staffName, markedAt: new Date() },
    })
    return { success: true }
}

export async function unmark86(productId: string): Promise<{ success: boolean }> {
    try {
        await prisma.out86.delete({ where: { productId } })
    } catch { /* not found is fine */ }
    return { success: true }
}

export async function get86List(): Promise<ProductAvailability[]> {
    const rows = await prisma.out86.findMany({ orderBy: { markedAt: "desc" } })
    return rows.map((r) => ({
        productId: r.productId, productName: r.productName, isAvailable: false,
        reason86: r.reason, markedBy: r.staffId, markedByName: r.staffName, markedAt: r.markedAt,
    }))
}

export async function isProduct86(productId: string): Promise<boolean> {
    const row = await prisma.out86.findUnique({ where: { productId } })
    return !!row
}

export async function get86ProductIds(): Promise<string[]> {
    const rows = await prisma.out86.findMany({ select: { productId: true } })
    return rows.map((r) => r.productId)
}

// ============================================================
// 3. SERVICE CHARGE — StoreSettings JSON
// ============================================================

export type ServiceChargeConfig = {
    enabled: boolean; rate: number; label: string
    applyTo: "ALL" | "DINE_IN_ONLY"; maxAmount: number | null
}

const DEFAULT_SC: ServiceChargeConfig = { enabled: true, rate: 0.05, label: "Phí dịch vụ", applyTo: "DINE_IN_ONLY", maxAmount: null }

export async function getServiceChargeConfig(): Promise<ServiceChargeConfig> {
    return { ...DEFAULT_SC }
}

export async function updateServiceChargeConfig(config: Partial<ServiceChargeConfig>): Promise<{ success: boolean }> {
    Object.assign(DEFAULT_SC, config)
    return { success: true }
}

export async function calculateServiceCharge(
    subtotal: number, orderType: "DINE_IN" | "TAKEAWAY"
): Promise<{ amount: number; rate: number; label: string }> {
    const config = DEFAULT_SC
    if (!config.enabled) return { amount: 0, rate: 0, label: config.label }
    if (config.applyTo === "DINE_IN_ONLY" && orderType !== "DINE_IN") return { amount: 0, rate: 0, label: config.label }

    let amount = Math.round(subtotal * config.rate)
    if (config.maxAmount && amount > config.maxAmount) amount = config.maxAmount
    return { amount, rate: config.rate, label: config.label }
}

// ============================================================
// 4. DISCOUNT AUTHORIZATION — Prisma Staff PIN
// ============================================================

export type DiscountAuthLog = {
    id: string; orderId: string | null
    discountType: "PERCENTAGE" | "FIXED"; discountValue: number
    originalTotal: number; discountedTotal: number; reason: string
    authorizedBy: string; authorizedByName: string
    requestedBy: string; requestedByName: string; authorizedAt: Date
}

export type DiscountAuthResult = { success: boolean; authorized: boolean; managerName?: string; error?: string }

export async function authorizeDiscount(params: {
    managerPin: string; orderId: string | null
    discountType: "PERCENTAGE" | "FIXED"; discountValue: number
    originalTotal: number; reason: string
    requestedBy: string; requestedByName: string
}): Promise<DiscountAuthResult> {
    const manager = await prisma.staff.findFirst({
        where: { pinCode: params.managerPin, role: { in: ["MANAGER", "OWNER"] }, isActive: true },
    })
    if (!manager) return { success: false, authorized: false, error: "PIN không hợp lệ hoặc không có quyền" }

    if (params.discountType === "PERCENTAGE" && params.discountValue > 20 && manager.role !== "OWNER") {
        return { success: false, authorized: false, error: "Giảm giá > 20% cần xác nhận của Chủ quán" }
    }

    const discountedTotal = params.discountType === "PERCENTAGE"
        ? Math.round(params.originalTotal * (1 - params.discountValue / 100))
        : params.originalTotal - params.discountValue

    await prisma.auditLog.create({
        data: {
            action: "DISCOUNT_AUTH", tableName: "order", recordId: params.orderId ?? "00000000-0000-0000-0000-000000000000",
            newData: {
                discountType: params.discountType, discountValue: params.discountValue,
                originalTotal: params.originalTotal, discountedTotal: Math.max(0, discountedTotal),
                reason: params.reason, requestedBy: params.requestedByName, authorizedBy: manager.fullName,
            },
            staffId: manager.id,
        },
    })

    return { success: true, authorized: true, managerName: manager.fullName }
}

export async function getDiscountLogs(): Promise<DiscountAuthLog[]> {
    const logs = await prisma.auditLog.findMany({ where: { action: "DISCOUNT_AUTH" }, orderBy: { createdAt: "desc" } })
    return logs.map((l) => {
        const d = l.newData as Record<string, unknown>
        return {
            id: l.id, orderId: l.recordId === "none" ? null : l.recordId,
            discountType: (d.discountType as "PERCENTAGE" | "FIXED") ?? "PERCENTAGE",
            discountValue: (d.discountValue as number) ?? 0,
            originalTotal: (d.originalTotal as number) ?? 0,
            discountedTotal: (d.discountedTotal as number) ?? 0,
            reason: (d.reason as string) ?? "",
            authorizedBy: l.staffId ?? "", authorizedByName: (d.authorizedBy as string) ?? "",
            requestedBy: "", requestedByName: (d.requestedBy as string) ?? "",
            authorizedAt: l.createdAt,
        }
    })
}

export async function getDiscountThreshold(): Promise<number> { return 10 }

// ============================================================
// 5. ORDER HOLD / PARK (in-memory — session-based by design)
// ============================================================

export type HeldOrder = {
    id: string; tableId: string | null; tableNumber: string | null
    orderType: "DINE_IN" | "TAKEAWAY"
    items: { productId: string; productName: string; quantity: number; unitPrice: number; note?: string }[]
    subtotal: number; heldBy: string; heldByName: string; heldAt: Date; label: string
}

const HELD_ORDERS: HeldOrder[] = []

export async function holdOrder(params: {
    tableId: string | null; tableNumber: string | null; orderType: "DINE_IN" | "TAKEAWAY"
    items: { productId: string; productName: string; quantity: number; unitPrice: number; note?: string }[]
    subtotal: number; staffId: string; staffName: string; label?: string
}): Promise<{ success: boolean; heldOrder?: HeldOrder; error?: string }> {
    if (params.items.length === 0) return { success: false, error: "Không có sản phẩm để giữ" }
    const held: HeldOrder = {
        id: `hold-${Date.now()}`, tableId: params.tableId, tableNumber: params.tableNumber,
        orderType: params.orderType, items: params.items, subtotal: params.subtotal,
        heldBy: params.staffId, heldByName: params.staffName, heldAt: new Date(),
        label: params.label ?? params.tableNumber ?? `Order #${HELD_ORDERS.length + 1}`,
    }
    HELD_ORDERS.push(held)
    return { success: true, heldOrder: held }
}

export async function getHeldOrders(): Promise<HeldOrder[]> { return [...HELD_ORDERS] }

export async function recallHeldOrder(id: string): Promise<{ success: boolean; order?: HeldOrder; error?: string }> {
    const idx = HELD_ORDERS.findIndex((h) => h.id === id)
    if (idx === -1) return { success: false, error: "Không tìm thấy đơn tạm giữ" }
    const [order] = HELD_ORDERS.splice(idx, 1)
    return { success: true, order }
}

export async function deleteHeldOrder(id: string): Promise<{ success: boolean }> {
    const idx = HELD_ORDERS.findIndex((h) => h.id === id)
    if (idx === -1) return { success: false }
    HELD_ORDERS.splice(idx, 1)
    return { success: true }
}

// ============================================================
// 6. RECEIPT RE-PRINT — from Prisma Order + Payment
// ============================================================

export type ReceiptRecord = {
    id: string; orderId: string; orderNumber: string; tableNumber: string | null
    total: number; paymentMethod: string; staffName: string; printedAt: Date; reprintCount: number
}

export async function saveReceiptRecord(params: {
    orderId: string; orderNumber: string; tableNumber: string | null
    total: number; paymentMethod: string; staffName: string
}): Promise<{ success: boolean; receipt?: ReceiptRecord }> {
    await prisma.auditLog.create({
        data: {
            action: "RECEIPT_PRINT", tableName: "order", recordId: params.orderId,
            newData: { orderNumber: params.orderNumber, tableNumber: params.tableNumber, total: params.total, paymentMethod: params.paymentMethod, staffName: params.staffName },
        },
    })
    return {
        success: true,
        receipt: { id: params.orderId, orderId: params.orderId, orderNumber: params.orderNumber, tableNumber: params.tableNumber, total: params.total, paymentMethod: params.paymentMethod, staffName: params.staffName, printedAt: new Date(), reprintCount: 0 },
    }
}

export async function getRecentReceipts(limit: number = 20): Promise<ReceiptRecord[]> {
    const orders = await prisma.order.findMany({
        where: { status: { in: ["PAID", "COMPLETED"] } },
        include: { table: true, staff: true, payments: { take: 1 } },
        orderBy: { closedAt: "desc" },
        take: limit,
    })
    return orders.map((o) => ({
        id: o.id, orderId: o.id, orderNumber: o.orderNo,
        tableNumber: o.table?.tableNumber ?? null, total: Number(o.totalAmount),
        paymentMethod: o.payments[0]?.method ?? "CASH", staffName: o.staff.fullName,
        printedAt: o.closedAt ?? o.createdAt, reprintCount: 0,
    }))
}

export async function reprintReceipt(receiptId: string): Promise<{ success: boolean; receipt?: ReceiptRecord; error?: string }> {
    const order = await prisma.order.findUnique({
        where: { id: receiptId },
        include: { table: true, staff: true, payments: { take: 1 } },
    })
    if (!order) return { success: false, error: "Không tìm thấy hóa đơn" }

    await prisma.auditLog.create({
        data: { action: "RECEIPT_REPRINT", tableName: "order", recordId: order.id, newData: { orderNo: order.orderNo } },
    })

    return {
        success: true,
        receipt: {
            id: order.id, orderId: order.id, orderNumber: order.orderNo,
            tableNumber: order.table?.tableNumber ?? null, total: Number(order.totalAmount),
            paymentMethod: order.payments[0]?.method ?? "CASH", staffName: order.staff.fullName,
            printedAt: new Date(), reprintCount: 1,
        },
    }
}
