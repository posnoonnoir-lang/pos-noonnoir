"use server"

// ============================================================
// CONSIGNMENT MODULE (US-2.2)
// Ký gửi NCC — nhận hàng, theo dõi, quyết toán
// ============================================================

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

type ConsignmentStatus = "ACTIVE" | "SETTLED" | "RETURNED"
type ConsignmentItemStatus = "IN_STOCK" | "SOLD" | "RETURNED" | "DAMAGED"
type SettlementStatus = "DRAFT" | "CONFIRMED" | "PAID"

export type ConsignmentItem = {
    id: string
    productId: string
    productName: string
    batchCode: string
    costPrice: number
    sellPrice: number
    status: ConsignmentItemStatus
    soldAt: Date | null
    soldOrderId: string | null
}

export type Consignment = {
    id: string
    consignmentNo: string
    supplierId: string
    supplierName: string
    commissionRate: number
    status: ConsignmentStatus
    items: ConsignmentItem[]
    totalItems: number
    soldItems: number
    totalRevenue: number
    notes: string | null
    receivedBy: string
    receivedAt: Date
    settledAt: Date | null
}

export type ConsignmentSettlement = {
    id: string
    consignmentId: string
    consignmentNo: string
    supplierName: string
    periodStart: Date
    periodEnd: Date
    totalSoldItems: number
    totalRevenue: number
    commissionRate: number
    commissionAmount: number
    amountDue: number
    status: SettlementStatus
    createdAt: Date
    confirmedAt: Date | null
    paidAt: Date | null
}

// ============================================================
// MOCK DATA
// ============================================================

const CONSIGNMENTS: Consignment[] = [
    {
        id: "csm-1",
        consignmentNo: "CSM-2026-001",
        supplierId: "sup-1",
        supplierName: "Wine Importers Co.",
        commissionRate: 30,
        status: "ACTIVE",
        items: [
            { id: "ci-1", productId: "prod-4", productName: "Cabernet Sauvignon (Ký gửi)", batchCode: "CS-2024-003", costPrice: 380000, sellPrice: 720000, status: "IN_STOCK", soldAt: null, soldOrderId: null },
            { id: "ci-2", productId: "prod-4", productName: "Cabernet Sauvignon (Ký gửi)", batchCode: "CS-2024-004", costPrice: 380000, sellPrice: 720000, status: "SOLD", soldAt: new Date("2026-03-05"), soldOrderId: "order-15" },
            { id: "ci-3", productId: "prod-5", productName: "Pinot Noir (Ký gửi)", batchCode: "PN-2024-003", costPrice: 450000, sellPrice: 960000, status: "SOLD", soldAt: new Date("2026-03-07"), soldOrderId: "order-22" },
            { id: "ci-4", productId: "prod-5", productName: "Pinot Noir (Ký gửi)", batchCode: "PN-2024-004", costPrice: 450000, sellPrice: 960000, status: "IN_STOCK", soldAt: null, soldOrderId: null },
            { id: "ci-5", productId: "prod-1", productName: "Château Margaux 2018 (Ký gửi)", batchCode: "CM-2018-003", costPrice: 3200000, sellPrice: 5900000, status: "IN_STOCK", soldAt: null, soldOrderId: null },
        ],
        totalItems: 5,
        soldItems: 2,
        totalRevenue: 1680000,
        notes: "Đợt ký gửi đầu tháng 3 — đa dạng rượu vang",
        receivedBy: "Chien (Owner)",
        receivedAt: new Date("2026-03-01"),
        settledAt: null,
    },
    {
        id: "csm-2",
        consignmentNo: "CSM-2026-002",
        supplierId: "sup-2",
        supplierName: "Vino Distribution",
        commissionRate: 25,
        status: "ACTIVE",
        items: [
            { id: "ci-6", productId: "prod-6", productName: "Chardonnay (Ký gửi)", batchCode: "CH-2024-002", costPrice: 320000, sellPrice: 680000, status: "IN_STOCK", soldAt: null, soldOrderId: null },
            { id: "ci-7", productId: "prod-6", productName: "Chardonnay (Ký gửi)", batchCode: "CH-2024-003", costPrice: 320000, sellPrice: 680000, status: "SOLD", soldAt: new Date("2026-03-08"), soldOrderId: "order-28" },
            { id: "ci-8", productId: "prod-6", productName: "Chardonnay (Ký gửi)", batchCode: "CH-2024-004", costPrice: 320000, sellPrice: 680000, status: "SOLD", soldAt: new Date("2026-03-09"), soldOrderId: "order-31" },
        ],
        totalItems: 3,
        soldItems: 2,
        totalRevenue: 1360000,
        notes: "Chardonnay selection — Vino Distribution",
        receivedBy: "Chien (Owner)",
        receivedAt: new Date("2026-03-05"),
        settledAt: null,
    },
    {
        id: "csm-3",
        consignmentNo: "CSM-2026-003",
        supplierId: "sup-1",
        supplierName: "Wine Importers Co.",
        commissionRate: 30,
        status: "SETTLED",
        items: [
            { id: "ci-9", productId: "prod-4", productName: "Cabernet Sauvignon", batchCode: "CS-2024-OLD", costPrice: 380000, sellPrice: 720000, status: "SOLD", soldAt: new Date("2026-02-20"), soldOrderId: "order-05" },
            { id: "ci-10", productId: "prod-5", productName: "Pinot Noir", batchCode: "PN-2024-OLD", costPrice: 450000, sellPrice: 960000, status: "RETURNED", soldAt: null, soldOrderId: null },
        ],
        totalItems: 2,
        soldItems: 1,
        totalRevenue: 720000,
        notes: "Đợt tháng 2 — đã quyết toán",
        receivedBy: "Chien (Owner)",
        receivedAt: new Date("2026-02-10"),
        settledAt: new Date("2026-03-01"),
    },
]

const SETTLEMENTS: ConsignmentSettlement[] = [
    {
        id: "stl-1",
        consignmentId: "csm-3",
        consignmentNo: "CSM-2026-003",
        supplierName: "Wine Importers Co.",
        periodStart: new Date("2026-02-01"),
        periodEnd: new Date("2026-02-28"),
        totalSoldItems: 1,
        totalRevenue: 720000,
        commissionRate: 30,
        commissionAmount: 216000,
        amountDue: 504000,
        status: "PAID",
        createdAt: new Date("2026-03-01"),
        confirmedAt: new Date("2026-03-02"),
        paidAt: new Date("2026-03-03"),
    },
]

// ============================================================
// CONSIGNMENT CRUD
// ============================================================

export async function getConsignments(): Promise<Consignment[]> {
    await delay(100)
    return [...CONSIGNMENTS].sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
}

export async function getConsignmentById(id: string): Promise<Consignment | null> {
    await delay(80)
    return CONSIGNMENTS.find((c) => c.id === id) ?? null
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
}): Promise<{ success: boolean; data?: Consignment }> {
    await delay(200)

    const consignment: Consignment = {
        id: `csm-${Date.now()}`,
        consignmentNo: `CSM-2026-${String(CONSIGNMENTS.length + 1).padStart(3, "0")}`,
        supplierId: params.supplierId,
        supplierName: params.supplierName,
        commissionRate: params.commissionRate,
        status: "ACTIVE",
        items: params.items.map((item, i) => ({
            id: `ci-${Date.now()}-${i}`,
            ...item,
            status: "IN_STOCK" as ConsignmentItemStatus,
            soldAt: null,
            soldOrderId: null,
        })),
        totalItems: params.items.length,
        soldItems: 0,
        totalRevenue: 0,
        notes: params.notes ?? null,
        receivedBy: params.receivedBy,
        receivedAt: new Date(),
        settledAt: null,
    }

    CONSIGNMENTS.push(consignment)
    return { success: true, data: consignment }
}

export async function returnConsignmentItem(consignmentId: string, itemId: string): Promise<{ success: boolean }> {
    await delay(100)
    const csm = CONSIGNMENTS.find((c) => c.id === consignmentId)
    if (!csm) return { success: false }

    const item = csm.items.find((i) => i.id === itemId)
    if (!item || item.status !== "IN_STOCK") return { success: false }

    item.status = "RETURNED"
    return { success: true }
}

export async function markConsignmentItemDamaged(consignmentId: string, itemId: string): Promise<{ success: boolean }> {
    await delay(100)
    const csm = CONSIGNMENTS.find((c) => c.id === consignmentId)
    if (!csm) return { success: false }

    const item = csm.items.find((i) => i.id === itemId)
    if (!item || item.status !== "IN_STOCK") return { success: false }

    item.status = "DAMAGED"
    return { success: true }
}

// ============================================================
// SETTLEMENT
// ============================================================

export async function getSettlements(): Promise<ConsignmentSettlement[]> {
    await delay(100)
    return [...SETTLEMENTS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function createSettlement(params: {
    consignmentId: string
    periodStart: Date
    periodEnd: Date
}): Promise<{ success: boolean; data?: ConsignmentSettlement }> {
    await delay(200)

    const csm = CONSIGNMENTS.find((c) => c.id === params.consignmentId)
    if (!csm) return { success: false }

    const soldInPeriod = csm.items.filter(
        (i) => i.status === "SOLD" && i.soldAt &&
            i.soldAt >= params.periodStart && i.soldAt <= params.periodEnd
    )

    const totalRevenue = soldInPeriod.reduce((s, i) => s + i.sellPrice, 0)
    const commissionAmount = Math.round(totalRevenue * (csm.commissionRate / 100))
    const amountDue = totalRevenue - commissionAmount

    const settlement: ConsignmentSettlement = {
        id: `stl-${Date.now()}`,
        consignmentId: params.consignmentId,
        consignmentNo: csm.consignmentNo,
        supplierName: csm.supplierName,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        totalSoldItems: soldInPeriod.length,
        totalRevenue,
        commissionRate: csm.commissionRate,
        commissionAmount,
        amountDue,
        status: "DRAFT",
        createdAt: new Date(),
        confirmedAt: null,
        paidAt: null,
    }

    SETTLEMENTS.push(settlement)
    return { success: true, data: settlement }
}

export async function confirmSettlement(settlementId: string): Promise<{ success: boolean }> {
    await delay(100)
    const stl = SETTLEMENTS.find((s) => s.id === settlementId)
    if (!stl || stl.status !== "DRAFT") return { success: false }

    stl.status = "CONFIRMED"
    stl.confirmedAt = new Date()
    return { success: true }
}

export async function markSettlementPaid(settlementId: string): Promise<{ success: boolean }> {
    await delay(100)
    const stl = SETTLEMENTS.find((s) => s.id === settlementId)
    if (!stl || stl.status !== "CONFIRMED") return { success: false }

    stl.status = "PAID"
    stl.paidAt = new Date()

    // Mark consignment as settled
    const csm = CONSIGNMENTS.find((c) => c.id === stl.consignmentId)
    if (csm) csm.settledAt = new Date()

    return { success: true }
}

export async function getConsignmentStats(): Promise<{
    totalConsignments: number
    activeConsignments: number
    totalItems: number
    soldItems: number
    totalRevenue: number
    pendingSettlement: number
}> {
    await delay(50)
    const active = CONSIGNMENTS.filter((c) => c.status === "ACTIVE")
    return {
        totalConsignments: CONSIGNMENTS.length,
        activeConsignments: active.length,
        totalItems: CONSIGNMENTS.reduce((s, c) => s + c.totalItems, 0),
        soldItems: CONSIGNMENTS.reduce((s, c) => s + c.items.filter((i) => i.status === "SOLD").length, 0),
        totalRevenue: CONSIGNMENTS.reduce((s, c) => s + c.items.filter((i) => i.status === "SOLD").reduce((r, i) => r + i.sellPrice, 0), 0),
        pendingSettlement: active.filter((c) => c.items.some((i) => i.status === "SOLD")).length,
    }
}
