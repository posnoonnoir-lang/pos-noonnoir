"use server"

// ============================================================
// CRM & CUSTOMER MANAGEMENT (US-3.1)
// Profile, loyalty, order history, wine preferences
// ============================================================

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

type CustomerTier = "REGULAR" | "SILVER" | "GOLD" | "PLATINUM"

export type CustomerProfile = {
    id: string
    fullName: string
    phone: string
    email: string | null
    birthday: string | null
    tier: CustomerTier
    totalSpent: number
    visitCount: number
    loyaltyPoints: number
    notes: string | null
    winePreferences: string[]
    allergies: string[]
    orderHistory: CustomerOrder[]
    createdAt: Date
    updatedAt: Date
}

export type CustomerOrder = {
    id: string
    orderNumber: string
    date: Date
    items: string[]
    total: number
    paymentMethod: string
    staffName: string
}

export type CustomerStats = {
    totalCustomers: number
    byTier: Record<CustomerTier, number>
    totalRevenue: number
    avgSpendPerVisit: number
    monthlyNew: number
    topSpenders: Array<{ name: string; spent: number; tier: CustomerTier }>
}

// ============================================================
// MOCK DATA
// ============================================================

const CUSTOMERS: CustomerProfile[] = [
    {
        id: "cust-1",
        fullName: "Nguyễn Hoàng Anh",
        phone: "0901234567",
        email: "anh@gmail.com",
        birthday: "1990-05-15",
        tier: "GOLD",
        totalSpent: 45000000,
        visitCount: 32,
        loyaltyPoints: 4500,
        notes: "Thích Cabernet Sauvignon, thường đến vào tối T6-T7. VIP regular.",
        winePreferences: ["Cabernet Sauvignon", "Bordeaux", "Full-body reds"],
        allergies: [],
        orderHistory: [
            { id: "oh-1", orderNumber: "ORD-001", date: new Date("2026-03-10T19:30:00"), items: ["Château Margaux 2018 (chai)", "Cheese Board"], total: 6150000, paymentMethod: "CARD", staffName: "Chien" },
            { id: "oh-2", orderNumber: "ORD-042", date: new Date("2026-03-08T20:15:00"), items: ["Cabernet Glass x3", "Bruschetta"], total: 390000, paymentMethod: "CASH", staffName: "Linh" },
            { id: "oh-3", orderNumber: "ORD-035", date: new Date("2026-03-05T21:00:00"), items: ["Opus One 2019 (chai)", "Cold Cut Board"], total: 10120000, paymentMethod: "QR", staffName: "Chien" },
        ],
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2026-03-10"),
    },
    {
        id: "cust-2",
        fullName: "Trần Minh Đức",
        phone: "0912345678",
        email: "duc.tran@company.com",
        birthday: "1985-11-22",
        tier: "PLATINUM",
        totalSpent: 120000000,
        visitCount: 85,
        loyaltyPoints: 12000,
        notes: "Khách VIP. Luôn đặt bàn VIP-1. Thích rượu Pháp, đặc biệt Burgundy.",
        winePreferences: ["Pinot Noir", "Burgundy", "Champagne", "Light-body reds"],
        allergies: ["Nuts"],
        orderHistory: [
            { id: "oh-4", orderNumber: "ORD-050", date: new Date("2026-03-09T20:00:00"), items: ["Wine Tasting (5 loại)", "Truffle Fries"], total: 2150000, paymentMethod: "CARD", staffName: "Chien" },
            { id: "oh-5", orderNumber: "ORD-040", date: new Date("2026-03-07T19:30:00"), items: ["Champagne Dom Pérignon", "Oyster Platter"], total: 15200000, paymentMethod: "CARD", staffName: "Linh" },
        ],
        createdAt: new Date("2024-06-10"),
        updatedAt: new Date("2026-03-09"),
    },
    {
        id: "cust-3",
        fullName: "Lê Thị Hồng",
        phone: "0923456789",
        email: "hong.le@email.com",
        birthday: "1995-03-08",
        tier: "SILVER",
        totalSpent: 18500000,
        visitCount: 15,
        loyaltyPoints: 1850,
        notes: "Thích rượu trắng. Hay đến với bạn bè chiều cuối tuần.",
        winePreferences: ["Chardonnay", "Sauvignon Blanc", "Rosé"],
        allergies: [],
        orderHistory: [
            { id: "oh-6", orderNumber: "ORD-048", date: new Date("2026-03-09T16:00:00"), items: ["Chardonnay Glass x2", "Aperol Spritz x2"], total: 410000, paymentMethod: "QR", staffName: "Hao" },
        ],
        createdAt: new Date("2025-08-20"),
        updatedAt: new Date("2026-03-09"),
    },
    {
        id: "cust-4",
        fullName: "Phạm Văn Tùng",
        phone: "0934567890",
        email: null,
        birthday: null,
        tier: "REGULAR",
        totalSpent: 5200000,
        visitCount: 5,
        loyaltyPoints: 520,
        notes: "Khách mới. Thử wine flight lần đầu.",
        winePreferences: [],
        allergies: [],
        orderHistory: [
            { id: "oh-7", orderNumber: "ORD-045", date: new Date("2026-03-08T18:00:00"), items: ["Wine Flight", "Gin & Tonic"], total: 350000, paymentMethod: "CASH", staffName: "Hao" },
        ],
        createdAt: new Date("2026-02-01"),
        updatedAt: new Date("2026-03-08"),
    },
    {
        id: "cust-5",
        fullName: "Vũ Thị Mai Hương",
        phone: "0945678901",
        email: "huong.vu@email.com",
        birthday: "1988-12-25",
        tier: "GOLD",
        totalSpent: 38000000,
        visitCount: 28,
        loyaltyPoints: 3800,
        notes: "Thích Champagne, đặc biệt Rosé. Sinh nhật sắp tới!",
        winePreferences: ["Champagne", "Rosé", "Prosecco"],
        allergies: ["Gluten"],
        orderHistory: [
            { id: "oh-8", orderNumber: "ORD-044", date: new Date("2026-03-08T19:00:00"), items: ["Rosé Champagne (chai)", "Tiramisu x2"], total: 3560000, paymentMethod: "CARD", staffName: "Chien" },
            { id: "oh-9", orderNumber: "ORD-033", date: new Date("2026-03-04T20:30:00"), items: ["Prosecco Glass x4", "Cheese Board"], total: 780000, paymentMethod: "CASH", staffName: "Linh" },
        ],
        createdAt: new Date("2025-03-10"),
        updatedAt: new Date("2026-03-08"),
    },
    {
        id: "cust-6",
        fullName: "Đỗ Quang Hải",
        phone: "0956789012",
        email: "hai.do@business.vn",
        birthday: "1978-07-04",
        tier: "SILVER",
        totalSpent: 22000000,
        visitCount: 18,
        loyaltyPoints: 2200,
        notes: "Doanh nhân. Thường đặt bàn cho 6-8 người. Thích rượu Italia.",
        winePreferences: ["Barolo", "Chianti", "Super Tuscan"],
        allergies: [],
        orderHistory: [
            { id: "oh-10", orderNumber: "ORD-038", date: new Date("2026-03-06T19:00:00"), items: ["Barolo 2019 x2 (chai)", "Cold Cut Board x2", "Bruschetta x3"], total: 8950000, paymentMethod: "CARD", staffName: "Chien" },
        ],
        createdAt: new Date("2025-05-15"),
        updatedAt: new Date("2026-03-06"),
    },
]

// ============================================================
// TIER THRESHOLDS
// ============================================================

const TIER_THRESHOLDS: Record<CustomerTier, { min: number; color: string; label: string }> = {
    REGULAR: { min: 0, color: "cream", label: "Regular" },
    SILVER: { min: 10000000, color: "silver", label: "Silver" },
    GOLD: { min: 30000000, color: "gold", label: "Gold" },
    PLATINUM: { min: 80000000, color: "platinum", label: "Platinum" },
}

function calculateTier(totalSpent: number): CustomerTier {
    if (totalSpent >= TIER_THRESHOLDS.PLATINUM.min) return "PLATINUM"
    if (totalSpent >= TIER_THRESHOLDS.GOLD.min) return "GOLD"
    if (totalSpent >= TIER_THRESHOLDS.SILVER.min) return "SILVER"
    return "REGULAR"
}

// ============================================================
// ACTIONS
// ============================================================

export async function getAllCustomers(): Promise<CustomerProfile[]> {
    await delay(100)
    return [...CUSTOMERS].sort((a, b) => b.totalSpent - a.totalSpent)
}

export async function getCustomerProfile(id: string): Promise<CustomerProfile | null> {
    await delay(80)
    return CUSTOMERS.find((c) => c.id === id) ?? null
}

export async function searchCRMCustomers(query: string): Promise<CustomerProfile[]> {
    await delay(100)
    if (!query) return [...CUSTOMERS].sort((a, b) => b.totalSpent - a.totalSpent)
    const q = query.toLowerCase()
    return CUSTOMERS.filter(
        (c) => c.fullName.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            (c.email?.toLowerCase().includes(q))
    )
}

export async function createCustomer(params: {
    fullName: string
    phone: string
    email?: string
    birthday?: string
    notes?: string
    winePreferences?: string[]
}): Promise<{ success: boolean; data?: CustomerProfile }> {
    await delay(200)

    const customer: CustomerProfile = {
        id: `cust-${Date.now()}`,
        fullName: params.fullName,
        phone: params.phone,
        email: params.email ?? null,
        birthday: params.birthday ?? null,
        tier: "REGULAR",
        totalSpent: 0,
        visitCount: 0,
        loyaltyPoints: 0,
        notes: params.notes ?? null,
        winePreferences: params.winePreferences ?? [],
        allergies: [],
        orderHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    CUSTOMERS.push(customer)
    return { success: true, data: customer }
}

export async function updateCustomerNotes(id: string, notes: string): Promise<{ success: boolean }> {
    await delay(100)
    const customer = CUSTOMERS.find((c) => c.id === id)
    if (!customer) return { success: false }
    customer.notes = notes
    customer.updatedAt = new Date()
    return { success: true }
}

export async function updateWinePreferences(id: string, preferences: string[]): Promise<{ success: boolean }> {
    await delay(100)
    const customer = CUSTOMERS.find((c) => c.id === id)
    if (!customer) return { success: false }
    customer.winePreferences = preferences
    customer.updatedAt = new Date()
    return { success: true }
}

export async function getCustomerStats(): Promise<CustomerStats> {
    await delay(80)

    const byTier: Record<CustomerTier, number> = { REGULAR: 0, SILVER: 0, GOLD: 0, PLATINUM: 0 }
    CUSTOMERS.forEach((c) => { byTier[c.tier]++ })

    const totalRevenue = CUSTOMERS.reduce((s, c) => s + c.totalSpent, 0)
    const totalVisits = CUSTOMERS.reduce((s, c) => s + c.visitCount, 0)

    const now = new Date()
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const monthlyNew = CUSTOMERS.filter((c) => c.createdAt >= monthAgo).length

    const topSpenders = [...CUSTOMERS]
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5)
        .map((c) => ({ name: c.fullName, spent: c.totalSpent, tier: c.tier }))

    return {
        totalCustomers: CUSTOMERS.length,
        byTier,
        totalRevenue,
        avgSpendPerVisit: totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0,
        monthlyNew,
        topSpenders,
    }
}

// Used internally only - not exported from "use server" file
