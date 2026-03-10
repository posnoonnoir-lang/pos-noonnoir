"use server"

/**
 * Phase 8A: Operational Polish — 6 server actions in one file
 * 
 * 1. Table Transfer — chuyển order khi khách đổi bàn
 * 2. 86/Out of Stock — bếp đánh dấu hết → ẩn trên POS
 * 3. Service Charge — phí dịch vụ 5-10%
 * 4. Discount Authorization — giảm giá cần Manager PIN
 * 5. Order Hold/Park — tạm giữ order
 * 6. Quick Cash & Duplicate Receipt — tiện ích thu ngân
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ============================================================
// 1. TABLE TRANSFER
// ============================================================

export type TableTransferLog = {
    id: string
    orderId: string
    orderNumber: string
    fromTableId: string
    fromTableNumber: string
    toTableId: string
    toTableNumber: string
    staffId: string
    staffName: string
    reason: string
    transferredAt: Date
}

const TABLE_TRANSFER_LOG: TableTransferLog[] = []

export async function transferTable(params: {
    orderId: string
    orderNumber: string
    fromTableId: string
    fromTableNumber: string
    toTableId: string
    toTableNumber: string
    staffId: string
    staffName: string
    reason?: string
}): Promise<{ success: boolean; error?: string }> {
    await delay(300)

    if (params.fromTableId === params.toTableId) {
        return { success: false, error: "Bàn đích trùng bàn hiện tại" }
    }

    const log: TableTransferLog = {
        id: `transfer-${Date.now()}`,
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        fromTableId: params.fromTableId,
        fromTableNumber: params.fromTableNumber,
        toTableId: params.toTableId,
        toTableNumber: params.toTableNumber,
        staffId: params.staffId,
        staffName: params.staffName,
        reason: params.reason ?? "Khách yêu cầu đổi bàn",
        transferredAt: new Date(),
    }

    TABLE_TRANSFER_LOG.push(log)
    return { success: true }
}

export async function getTransferHistory(orderId?: string): Promise<TableTransferLog[]> {
    await delay(100)
    if (orderId) return TABLE_TRANSFER_LOG.filter((t) => t.orderId === orderId)
    return [...TABLE_TRANSFER_LOG]
}

// ============================================================
// 2. 86 / OUT OF STOCK
// ============================================================

export type ProductAvailability = {
    productId: string
    productName: string
    isAvailable: boolean
    reason86: string | null // reason for 86-ing
    markedBy: string
    markedByName: string
    markedAt: Date | null
}

// In-memory 86 list — key = productId
const OUT_OF_STOCK_MAP: Map<string, ProductAvailability> = new Map()

export async function markProduct86(params: {
    productId: string
    productName: string
    reason: string
    staffId: string
    staffName: string
}): Promise<{ success: boolean }> {
    await delay(200)

    OUT_OF_STOCK_MAP.set(params.productId, {
        productId: params.productId,
        productName: params.productName,
        isAvailable: false,
        reason86: params.reason,
        markedBy: params.staffId,
        markedByName: params.staffName,
        markedAt: new Date(),
    })

    return { success: true }
}

export async function unmark86(productId: string): Promise<{ success: boolean }> {
    await delay(150)
    OUT_OF_STOCK_MAP.delete(productId)
    return { success: true }
}

export async function get86List(): Promise<ProductAvailability[]> {
    await delay(100)
    return Array.from(OUT_OF_STOCK_MAP.values())
}

export async function isProduct86(productId: string): Promise<boolean> {
    return OUT_OF_STOCK_MAP.has(productId)
}

export async function get86ProductIds(): Promise<string[]> {
    return Array.from(OUT_OF_STOCK_MAP.keys())
}

// ============================================================
// 3. SERVICE CHARGE
// ============================================================

export type ServiceChargeConfig = {
    enabled: boolean
    rate: number // 0.05 = 5%, 0.10 = 10%
    label: string
    applyTo: "ALL" | "DINE_IN_ONLY"
    maxAmount: number | null // cap
}

let SERVICE_CHARGE_CONFIG: ServiceChargeConfig = {
    enabled: true,
    rate: 0.05,
    label: "Phí dịch vụ",
    applyTo: "DINE_IN_ONLY",
    maxAmount: null,
}

export async function getServiceChargeConfig(): Promise<ServiceChargeConfig> {
    await delay(50)
    return { ...SERVICE_CHARGE_CONFIG }
}

export async function updateServiceChargeConfig(
    config: Partial<ServiceChargeConfig>
): Promise<{ success: boolean }> {
    await delay(200)
    SERVICE_CHARGE_CONFIG = { ...SERVICE_CHARGE_CONFIG, ...config }
    return { success: true }
}

export async function calculateServiceCharge(
    subtotal: number,
    orderType: "DINE_IN" | "TAKEAWAY"
): Promise<{ amount: number; rate: number; label: string }> {
    await delay(50)
    const config = SERVICE_CHARGE_CONFIG

    if (!config.enabled) return { amount: 0, rate: 0, label: config.label }
    if (config.applyTo === "DINE_IN_ONLY" && orderType !== "DINE_IN") {
        return { amount: 0, rate: 0, label: config.label }
    }

    let amount = Math.round(subtotal * config.rate)
    if (config.maxAmount && amount > config.maxAmount) {
        amount = config.maxAmount
    }

    return { amount, rate: config.rate, label: config.label }
}

// ============================================================
// 4. DISCOUNT AUTHORIZATION
// ============================================================

export type DiscountAuthLog = {
    id: string
    orderId: string | null
    discountType: "PERCENTAGE" | "FIXED"
    discountValue: number
    originalTotal: number
    discountedTotal: number
    reason: string
    authorizedBy: string
    authorizedByName: string
    requestedBy: string
    requestedByName: string
    authorizedAt: Date
}

const DISCOUNT_AUTH_LOG: DiscountAuthLog[] = []

// Manager PINs — hardcoded mock
const MANAGER_PINS: Record<string, { name: string; role: string }> = {
    "1234": { name: "Ngọc Anh", role: "MANAGER" },
    "0000": { name: "Chủ quán", role: "OWNER" },
    "9999": { name: "Manager Tú", role: "MANAGER" },
}

export type DiscountAuthResult = {
    success: boolean
    authorized: boolean
    managerName?: string
    error?: string
}

export async function authorizeDiscount(params: {
    managerPin: string
    orderId: string | null
    discountType: "PERCENTAGE" | "FIXED"
    discountValue: number
    originalTotal: number
    reason: string
    requestedBy: string
    requestedByName: string
}): Promise<DiscountAuthResult> {
    await delay(300)

    const manager = MANAGER_PINS[params.managerPin]
    if (!manager) {
        return { success: false, authorized: false, error: "PIN không hợp lệ hoặc không có quyền" }
    }

    // Business rule: > 20% needs OWNER
    if (params.discountType === "PERCENTAGE" && params.discountValue > 20 && manager.role !== "OWNER") {
        return { success: false, authorized: false, error: "Giảm giá > 20% cần xác nhận của Chủ quán" }
    }

    // Calculate discounted total
    let discountedTotal: number
    if (params.discountType === "PERCENTAGE") {
        discountedTotal = Math.round(params.originalTotal * (1 - params.discountValue / 100))
    } else {
        discountedTotal = params.originalTotal - params.discountValue
    }

    const log: DiscountAuthLog = {
        id: `disc-${Date.now()}`,
        orderId: params.orderId,
        discountType: params.discountType,
        discountValue: params.discountValue,
        originalTotal: params.originalTotal,
        discountedTotal: Math.max(0, discountedTotal),
        reason: params.reason,
        authorizedBy: params.managerPin,
        authorizedByName: manager.name,
        requestedBy: params.requestedBy,
        requestedByName: params.requestedByName,
        authorizedAt: new Date(),
    }

    DISCOUNT_AUTH_LOG.push(log)

    return {
        success: true,
        authorized: true,
        managerName: manager.name,
    }
}

export async function getDiscountLogs(): Promise<DiscountAuthLog[]> {
    await delay(100)
    return [...DISCOUNT_AUTH_LOG].reverse()
}

// Max discount % without auth
export async function getDiscountThreshold(): Promise<number> {
    return 10 // 10% — anything above needs Manager PIN
}

// ============================================================
// 5. ORDER HOLD / PARK
// ============================================================

export type HeldOrder = {
    id: string
    tableId: string | null
    tableNumber: string | null
    orderType: "DINE_IN" | "TAKEAWAY"
    items: {
        productId: string
        productName: string
        quantity: number
        unitPrice: number
        note?: string
    }[]
    subtotal: number
    heldBy: string
    heldByName: string
    heldAt: Date
    label: string // "Bàn T05" or "Khách chờ lấy" etc.
}

const HELD_ORDERS: HeldOrder[] = []

export async function holdOrder(params: {
    tableId: string | null
    tableNumber: string | null
    orderType: "DINE_IN" | "TAKEAWAY"
    items: {
        productId: string
        productName: string
        quantity: number
        unitPrice: number
        note?: string
    }[]
    subtotal: number
    staffId: string
    staffName: string
    label?: string
}): Promise<{ success: boolean; heldOrder?: HeldOrder; error?: string }> {
    await delay(200)

    if (params.items.length === 0) {
        return { success: false, error: "Không có sản phẩm để giữ" }
    }

    const held: HeldOrder = {
        id: `hold-${Date.now()}`,
        tableId: params.tableId,
        tableNumber: params.tableNumber,
        orderType: params.orderType,
        items: params.items,
        subtotal: params.subtotal,
        heldBy: params.staffId,
        heldByName: params.staffName,
        heldAt: new Date(),
        label: params.label ?? params.tableNumber ?? `Order #${HELD_ORDERS.length + 1}`,
    }

    HELD_ORDERS.push(held)
    return { success: true, heldOrder: held }
}

export async function getHeldOrders(): Promise<HeldOrder[]> {
    await delay(100)
    return [...HELD_ORDERS]
}

export async function recallHeldOrder(id: string): Promise<{ success: boolean; order?: HeldOrder; error?: string }> {
    await delay(150)
    const idx = HELD_ORDERS.findIndex((h) => h.id === id)
    if (idx === -1) return { success: false, error: "Không tìm thấy đơn tạm giữ" }

    const [order] = HELD_ORDERS.splice(idx, 1)
    return { success: true, order }
}

export async function deleteHeldOrder(id: string): Promise<{ success: boolean }> {
    await delay(150)
    const idx = HELD_ORDERS.findIndex((h) => h.id === id)
    if (idx === -1) return { success: false }
    HELD_ORDERS.splice(idx, 1)
    return { success: true }
}

// ============================================================
// 6. RECEIPT RE-PRINT
// ============================================================

export type ReceiptRecord = {
    id: string
    orderId: string
    orderNumber: string
    tableNumber: string | null
    total: number
    paymentMethod: string
    staffName: string
    printedAt: Date
    reprintCount: number
}

const RECEIPT_RECORDS: ReceiptRecord[] = []

export async function saveReceiptRecord(params: {
    orderId: string
    orderNumber: string
    tableNumber: string | null
    total: number
    paymentMethod: string
    staffName: string
}): Promise<{ success: boolean; receipt?: ReceiptRecord }> {
    await delay(100)
    const receipt: ReceiptRecord = {
        id: `rcpt-${Date.now()}`,
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        tableNumber: params.tableNumber,
        total: params.total,
        paymentMethod: params.paymentMethod,
        staffName: params.staffName,
        printedAt: new Date(),
        reprintCount: 0,
    }
    RECEIPT_RECORDS.push(receipt)
    return { success: true, receipt }
}

export async function getRecentReceipts(limit: number = 20): Promise<ReceiptRecord[]> {
    await delay(100)
    return [...RECEIPT_RECORDS].reverse().slice(0, limit)
}

export async function reprintReceipt(receiptId: string): Promise<{ success: boolean; receipt?: ReceiptRecord; error?: string }> {
    await delay(150)
    const receipt = RECEIPT_RECORDS.find((r) => r.id === receiptId)
    if (!receipt) return { success: false, error: "Không tìm thấy hóa đơn" }
    receipt.reprintCount += 1
    return { success: true, receipt }
}
