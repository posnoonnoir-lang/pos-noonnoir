"use server"

// ============================================================
// SHIFT MANAGEMENT (US-4.1)
// Quản lý ca làm — mở ca, đóng ca, đối soát tiền mặt
// ============================================================

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

type ShiftStatus = "OPEN" | "CLOSED"
type TransactionType = "SALE" | "EXPENSE" | "ADJUSTMENT" | "TIP"

export type ShiftTransaction = {
    id: string
    type: TransactionType
    description: string
    amount: number
    paymentMethod: "CASH" | "CARD" | "QR" | "MIXED"
    orderId: string | null
    staffName: string
    createdAt: Date
}

export type Shift = {
    id: string
    shiftNumber: string
    staffId: string
    staffName: string
    staffRole: string
    status: ShiftStatus
    openingCash: number
    closingCash: number | null
    expectedCash: number
    cashDifference: number | null
    totalSales: number
    totalCash: number
    totalCard: number
    totalQR: number
    orderCount: number
    itemsSold: number
    transactions: ShiftTransaction[]
    notes: string | null
    openedAt: Date
    closedAt: Date | null
}

export type ShiftSummary = {
    todayShifts: number
    currentOpen: Shift | null
    totalRevenue: number
    totalCash: number
    totalCard: number
    totalQR: number
    orderCount: number
    avgOrderValue: number
}

// ============================================================
// MOCK SHIFT DATA
// ============================================================

const SHIFTS: Shift[] = [
    {
        id: "shift-1",
        shiftNumber: "SM-100310-01",
        staffId: "staff-1",
        staffName: "Chien (Owner)",
        staffRole: "OWNER",
        status: "CLOSED",
        openingCash: 2000000,
        closingCash: 5850000,
        expectedCash: 5920000,
        cashDifference: -70000,
        totalSales: 8450000,
        totalCash: 3920000,
        totalCard: 3200000,
        totalQR: 1330000,
        orderCount: 12,
        itemsSold: 28,
        transactions: [
            { id: "tx-1", type: "SALE", description: "ORD-001 · Bàn VIP-1", amount: 1250000, paymentMethod: "CASH", orderId: "ord-1", staffName: "Chien", createdAt: new Date("2026-03-10T08:30:00") },
            { id: "tx-2", type: "SALE", description: "ORD-002 · Bàn BAR-2", amount: 780000, paymentMethod: "CARD", orderId: "ord-2", staffName: "Chien", createdAt: new Date("2026-03-10T09:15:00") },
            { id: "tx-3", type: "EXPENSE", description: "Mua đá lạnh, chanh", amount: -180000, paymentMethod: "CASH", orderId: null, staffName: "Chien", createdAt: new Date("2026-03-10T10:00:00") },
            { id: "tx-4", type: "SALE", description: "ORD-003 · Takeaway", amount: 2100000, paymentMethod: "QR", orderId: "ord-3", staffName: "Chien", createdAt: new Date("2026-03-10T10:45:00") },
            { id: "tx-5", type: "SALE", description: "ORD-004 · Bàn GAR-3", amount: 3500000, paymentMethod: "CASH", orderId: "ord-4", staffName: "Chien", createdAt: new Date("2026-03-10T11:30:00") },
            { id: "tx-6", type: "TIP", description: "Tip khách VIP", amount: 200000, paymentMethod: "CASH", orderId: null, staffName: "Chien", createdAt: new Date("2026-03-10T12:00:00") },
            { id: "tx-7", type: "SALE", description: "ORD-005 · Bàn VIP-2", amount: 820000, paymentMethod: "CARD", orderId: "ord-5", staffName: "Chien", createdAt: new Date("2026-03-10T13:00:00") },
        ],
        notes: "Ca sáng — doanh thu tốt, chênh lệch nhỏ do trả tiền thừa",
        openedAt: new Date("2026-03-10T08:00:00"),
        closedAt: new Date("2026-03-10T14:00:00"),
    },
    {
        id: "shift-2",
        shiftNumber: "SM-100310-02",
        staffId: "staff-1",
        staffName: "Chien (Owner)",
        staffRole: "OWNER",
        status: "OPEN",
        openingCash: 3000000,
        closingCash: null,
        expectedCash: 9150000,
        cashDifference: null,
        totalSales: 12350000,
        totalCash: 6150000,
        totalCard: 4200000,
        totalQR: 2000000,
        orderCount: 18,
        itemsSold: 42,
        transactions: [
            { id: "tx-8", type: "SALE", description: "ORD-010 · Bàn VIP-1", amount: 2800000, paymentMethod: "CASH", orderId: "ord-10", staffName: "Chien", createdAt: new Date("2026-03-10T14:30:00") },
            { id: "tx-9", type: "SALE", description: "ORD-011 · Bàn BAR-1", amount: 450000, paymentMethod: "QR", orderId: "ord-11", staffName: "Chien", createdAt: new Date("2026-03-10T14:45:00") },
            { id: "tx-10", type: "EXPENSE", description: "Mua hoa trang trí", amount: -350000, paymentMethod: "CASH", orderId: null, staffName: "Chien", createdAt: new Date("2026-03-10T15:00:00") },
            { id: "tx-11", type: "SALE", description: "ORD-012 · Bàn GAR-2", amount: 1900000, paymentMethod: "CARD", orderId: "ord-12", staffName: "Chien", createdAt: new Date("2026-03-10T15:20:00") },
            { id: "tx-12", type: "SALE", description: "ORD-013 · Bàn VIP-3", amount: 5200000, paymentMethod: "MIXED", orderId: "ord-13", staffName: "Chien", createdAt: new Date("2026-03-10T15:45:00") },
            { id: "tx-13", type: "SALE", description: "ORD-014 · Takeaway", amount: 680000, paymentMethod: "CASH", orderId: "ord-14", staffName: "Chien", createdAt: new Date("2026-03-10T16:10:00") },
            { id: "tx-14", type: "SALE", description: "ORD-015 · Bàn BAR-3", amount: 1320000, paymentMethod: "CARD", orderId: "ord-15", staffName: "Chien", createdAt: new Date("2026-03-10T16:30:00") },
        ],
        notes: null,
        openedAt: new Date("2026-03-10T14:00:00"),
        closedAt: null,
    },
]

// ============================================================
// SHIFT ACTIONS
// ============================================================

export async function getCurrentShift(): Promise<Shift | null> {
    await delay(80)
    return SHIFTS.find((s) => s.status === "OPEN") ?? null
}

export async function getShiftHistory(): Promise<Shift[]> {
    await delay(100)
    return [...SHIFTS].sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime())
}

export async function getShiftSummary(): Promise<ShiftSummary> {
    await delay(80)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayShifts = SHIFTS.filter((s) => s.openedAt >= today)
    const currentOpen = SHIFTS.find((s) => s.status === "OPEN") ?? null
    const totalRevenue = todayShifts.reduce((s, sh) => s + sh.totalSales, 0)
    const totalCash = todayShifts.reduce((s, sh) => s + sh.totalCash, 0)
    const totalCard = todayShifts.reduce((s, sh) => s + sh.totalCard, 0)
    const totalQR = todayShifts.reduce((s, sh) => s + sh.totalQR, 0)
    const orderCount = todayShifts.reduce((s, sh) => s + sh.orderCount, 0)

    return {
        todayShifts: todayShifts.length,
        currentOpen,
        totalRevenue,
        totalCash,
        totalCard,
        totalQR,
        orderCount,
        avgOrderValue: orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0,
    }
}

export async function openShift(params: {
    staffId: string
    staffName: string
    staffRole: string
    openingCash: number
    notes?: string
}): Promise<{ success: boolean; data?: Shift; error?: string }> {
    await delay(200)

    const existing = SHIFTS.find((s) => s.status === "OPEN")
    if (existing) {
        return { success: false, error: `Ca ${existing.shiftNumber} đang mở. Đóng ca trước!` }
    }

    const today = new Date()
    const dateStr = `${String(today.getDate()).padStart(2, "0")}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getFullYear()).slice(2)}`
    const count = SHIFTS.filter((s) => {
        const d = new Date(s.openedAt)
        return d.toDateString() === today.toDateString()
    }).length + 1

    const shift: Shift = {
        id: `shift-${Date.now()}`,
        shiftNumber: `SM-${dateStr}-${String(count).padStart(2, "0")}`,
        staffId: params.staffId,
        staffName: params.staffName,
        staffRole: params.staffRole,
        status: "OPEN",
        openingCash: params.openingCash,
        closingCash: null,
        expectedCash: params.openingCash,
        cashDifference: null,
        totalSales: 0,
        totalCash: 0,
        totalCard: 0,
        totalQR: 0,
        orderCount: 0,
        itemsSold: 0,
        transactions: [],
        notes: params.notes ?? null,
        openedAt: new Date(),
        closedAt: null,
    }

    SHIFTS.push(shift)
    return { success: true, data: shift }
}

export async function closeShift(params: {
    shiftId: string
    closingCash: number
    notes?: string
}): Promise<{ success: boolean; data?: Shift; error?: string }> {
    await delay(200)

    const shift = SHIFTS.find((s) => s.id === params.shiftId)
    if (!shift) return { success: false, error: "Không tìm thấy ca" }
    if (shift.status !== "OPEN") return { success: false, error: "Ca đã đóng" }

    shift.status = "CLOSED"
    shift.closingCash = params.closingCash
    shift.cashDifference = params.closingCash - shift.expectedCash
    shift.closedAt = new Date()
    if (params.notes) shift.notes = params.notes

    return { success: true, data: shift }
}

export async function addShiftExpense(params: {
    shiftId: string
    description: string
    amount: number
    staffName: string
}): Promise<{ success: boolean }> {
    await delay(100)

    const shift = SHIFTS.find((s) => s.id === params.shiftId)
    if (!shift || shift.status !== "OPEN") return { success: false }

    const tx: ShiftTransaction = {
        id: `tx-${Date.now()}`,
        type: "EXPENSE",
        description: params.description,
        amount: -Math.abs(params.amount),
        paymentMethod: "CASH",
        orderId: null,
        staffName: params.staffName,
        createdAt: new Date(),
    }

    shift.transactions.push(tx)
    shift.expectedCash -= Math.abs(params.amount)
    return { success: true }
}

export async function addShiftTip(params: {
    shiftId: string
    amount: number
    staffName: string
}): Promise<{ success: boolean }> {
    await delay(100)

    const shift = SHIFTS.find((s) => s.id === params.shiftId)
    if (!shift || shift.status !== "OPEN") return { success: false }

    const tx: ShiftTransaction = {
        id: `tx-${Date.now()}`,
        type: "TIP",
        description: "Tip khách",
        amount: params.amount,
        paymentMethod: "CASH",
        orderId: null,
        staffName: params.staffName,
        createdAt: new Date(),
    }

    shift.transactions.push(tx)
    shift.totalCash += params.amount
    shift.expectedCash += params.amount
    return { success: true }
}
