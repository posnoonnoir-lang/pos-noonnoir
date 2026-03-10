"use server"

// ============================================================
// PROMOTIONS & HAPPY HOUR (US-6.1)
// Khuyến mãi, giảm giá theo giờ, combo deals, auto-apply
// ============================================================

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

type PromoType = "HAPPY_HOUR" | "PERCENT_OFF" | "COMBO" | "FIXED_AMOUNT"
type PromoStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED"
type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"

export type Promotion = {
    id: string
    name: string
    description: string
    type: PromoType
    status: PromoStatus
    discountPercent: number | null
    discountAmount: number | null
    minOrderAmount: number | null
    maxDiscount: number | null
    applicableCategories: string[]
    applicableProducts: string[]
    startTime: string | null
    endTime: string | null
    activeDays: DayOfWeek[]
    startDate: Date
    endDate: Date | null
    maxUsage: number | null
    currentUsage: number
    comboRequirement: string | null
    comboReward: string | null
    priority: number
    createdAt: Date
}

export type AppliedPromo = {
    id: string
    name: string
    type: PromoType
    discountAmount: number
    description: string
}

export type PromoStats = {
    totalPromotions: number
    activeNow: number
    totalDiscountGiven: number
    mostUsedPromo: string
    todayDiscounts: number
}

// ============================================================
// MOCK PROMOTIONS
// ============================================================

const PROMOTIONS: Promotion[] = [
    {
        id: "promo-1",
        name: "🌅 Happy Hour — Rượu vang by Glass",
        description: "Giảm 15% tất cả rượu by-glass từ 17h-19h, T2-T6",
        type: "HAPPY_HOUR",
        status: "ACTIVE",
        discountPercent: 15,
        discountAmount: null,
        minOrderAmount: null,
        maxDiscount: 200000,
        applicableCategories: ["wine-by-glass"],
        applicableProducts: [],
        startTime: "17:00",
        endTime: "19:00",
        activeDays: ["MON", "TUE", "WED", "THU", "FRI"],
        startDate: new Date("2026-01-01"),
        endDate: null,
        maxUsage: null,
        currentUsage: 342,
        comboRequirement: null,
        comboReward: null,
        priority: 10,
        createdAt: new Date("2026-01-01"),
    },
    {
        id: "promo-2",
        name: "🥂 Ladies Night",
        description: "Giảm 20% Rosé & Champagne, thứ 4 & 5 từ 19h-22h",
        type: "PERCENT_OFF",
        status: "ACTIVE",
        discountPercent: 20,
        discountAmount: null,
        minOrderAmount: 200000,
        maxDiscount: 500000,
        applicableCategories: [],
        applicableProducts: ["champagne-rose", "champagne-brut", "rose-wine"],
        startTime: "19:00",
        endTime: "22:00",
        activeDays: ["WED", "THU"],
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-06-30"),
        maxUsage: 500,
        currentUsage: 89,
        comboRequirement: null,
        comboReward: null,
        priority: 8,
        createdAt: new Date("2026-02-01"),
    },
    {
        id: "promo-3",
        name: "🍷 Wine & Cheese Combo",
        description: "Mua 1 chai rượu, tặng Cheese Board (₫180.000)",
        type: "COMBO",
        status: "ACTIVE",
        discountPercent: null,
        discountAmount: 180000,
        minOrderAmount: 500000,
        maxDiscount: 180000,
        applicableCategories: ["wine-bottle"],
        applicableProducts: [],
        startTime: null,
        endTime: null,
        activeDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-31"),
        maxUsage: 100,
        currentUsage: 23,
        comboRequirement: "Mua ≥ 1 chai rượu (≥ ₫500K)",
        comboReward: "Tặng Cheese Board trị giá ₫180.000",
        priority: 5,
        createdAt: new Date("2026-03-01"),
    },
    {
        id: "promo-4",
        name: "🎉 Weekend Special — Giảm ₫50K",
        description: "Giảm ₫50.000 cho đơn từ ₫300.000, T7 & CN cả ngày",
        type: "FIXED_AMOUNT",
        status: "ACTIVE",
        discountPercent: null,
        discountAmount: 50000,
        minOrderAmount: 300000,
        maxDiscount: 50000,
        applicableCategories: [],
        applicableProducts: [],
        startTime: null,
        endTime: null,
        activeDays: ["SAT", "SUN"],
        startDate: new Date("2026-03-01"),
        endDate: null,
        maxUsage: null,
        currentUsage: 156,
        comboRequirement: null,
        comboReward: null,
        priority: 3,
        createdAt: new Date("2026-03-01"),
    },
    {
        id: "promo-5",
        name: "🌙 Late Night 10%",
        description: "Giảm 10% sau 22h mỗi ngày",
        type: "HAPPY_HOUR",
        status: "ACTIVE",
        discountPercent: 10,
        discountAmount: null,
        minOrderAmount: null,
        maxDiscount: 300000,
        applicableCategories: [],
        applicableProducts: [],
        startTime: "22:00",
        endTime: "23:59",
        activeDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        startDate: new Date("2026-01-15"),
        endDate: null,
        maxUsage: null,
        currentUsage: 210,
        comboRequirement: null,
        comboReward: null,
        priority: 2,
        createdAt: new Date("2026-01-15"),
    },
    {
        id: "promo-6",
        name: "🎄 Christmas Special",
        description: "Giảm 25% tất cả — chỉ ngày 24-25/12",
        type: "PERCENT_OFF",
        status: "EXPIRED",
        discountPercent: 25,
        discountAmount: null,
        minOrderAmount: null,
        maxDiscount: 1000000,
        applicableCategories: [],
        applicableProducts: [],
        startTime: null,
        endTime: null,
        activeDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        startDate: new Date("2025-12-24"),
        endDate: new Date("2025-12-25"),
        maxUsage: null,
        currentUsage: 67,
        comboRequirement: null,
        comboReward: null,
        priority: 1,
        createdAt: new Date("2025-12-20"),
    },
]

// ============================================================
// ACTIONS
// ============================================================

export async function getAllPromotions(): Promise<Promotion[]> {
    await delay(100)
    return [...PROMOTIONS].sort((a, b) => b.priority - a.priority)
}

export async function getActivePromotions(): Promise<Promotion[]> {
    await delay(80)
    const now = new Date()
    const dayMap: Record<number, DayOfWeek> = { 0: "SUN", 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT" }
    const today = dayMap[now.getDay()]
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    return PROMOTIONS.filter((p) => {
        if (p.status !== "ACTIVE") return false
        if (p.endDate && now > p.endDate) return false
        if (now < p.startDate) return false
        if (!p.activeDays.includes(today)) return false
        if (p.startTime && p.endTime && (timeStr < p.startTime || timeStr > p.endTime)) return false
        if (p.maxUsage && p.currentUsage >= p.maxUsage) return false
        return true
    })
}

export async function checkPromotions(params: {
    orderTotal: number
    items: Array<{ productId: string; categorySlug: string; quantity: number; unitPrice: number }>
}): Promise<AppliedPromo[]> {
    await delay(50)

    const active = await getActivePromotions()
    const applied: AppliedPromo[] = []

    for (const promo of active) {
        if (promo.minOrderAmount && params.orderTotal < promo.minOrderAmount) continue

        let discount = 0

        if (promo.type === "HAPPY_HOUR" || promo.type === "PERCENT_OFF") {
            const rate = promo.discountPercent ?? 0
            const applicableItems = params.items.filter((item) => {
                if (promo.applicableCategories.length > 0 && !promo.applicableCategories.includes(item.categorySlug)) return false
                if (promo.applicableProducts.length > 0 && !promo.applicableProducts.includes(item.productId)) return false
                return true
            })

            if (promo.applicableCategories.length === 0 && promo.applicableProducts.length === 0) {
                discount = Math.round(params.orderTotal * rate / 100)
            } else if (applicableItems.length > 0) {
                const subtotal = applicableItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
                discount = Math.round(subtotal * rate / 100)
            }
        } else if (promo.type === "FIXED_AMOUNT") {
            discount = promo.discountAmount ?? 0
        } else if (promo.type === "COMBO") {
            const hasQualifyingItem = params.items.some((item) =>
                promo.applicableCategories.includes(item.categorySlug) && item.unitPrice * item.quantity >= (promo.minOrderAmount ?? 0)
            )
            if (hasQualifyingItem) {
                discount = promo.discountAmount ?? 0
            }
        }

        if (discount > 0) {
            if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount)
            applied.push({
                id: promo.id,
                name: promo.name,
                type: promo.type,
                discountAmount: discount,
                description: promo.description,
            })
        }
    }

    return applied
}

export async function createPromotion(params: {
    name: string
    description: string
    type: PromoType
    discountPercent?: number
    discountAmount?: number
    minOrderAmount?: number
    maxDiscount?: number
    applicableCategories?: string[]
    startTime?: string
    endTime?: string
    activeDays: DayOfWeek[]
    startDate: string
    endDate?: string
    maxUsage?: number
}): Promise<{ success: boolean; data?: Promotion }> {
    await delay(200)

    const promo: Promotion = {
        id: `promo-${Date.now()}`,
        name: params.name,
        description: params.description,
        type: params.type,
        status: "ACTIVE",
        discountPercent: params.discountPercent ?? null,
        discountAmount: params.discountAmount ?? null,
        minOrderAmount: params.minOrderAmount ?? null,
        maxDiscount: params.maxDiscount ?? null,
        applicableCategories: params.applicableCategories ?? [],
        applicableProducts: [],
        startTime: params.startTime ?? null,
        endTime: params.endTime ?? null,
        activeDays: params.activeDays,
        startDate: new Date(params.startDate),
        endDate: params.endDate ? new Date(params.endDate) : null,
        maxUsage: params.maxUsage ?? null,
        currentUsage: 0,
        comboRequirement: null,
        comboReward: null,
        priority: PROMOTIONS.length + 1,
        createdAt: new Date(),
    }

    PROMOTIONS.push(promo)
    return { success: true, data: promo }
}

export async function togglePromoStatus(id: string): Promise<{ success: boolean }> {
    await delay(100)
    const promo = PROMOTIONS.find((p) => p.id === id)
    if (!promo) return { success: false }
    promo.status = promo.status === "ACTIVE" ? "DISABLED" : "ACTIVE"
    return { success: true }
}

export async function updatePromotion(
    id: string,
    data: Partial<{
        name: string
        description: string
        type: PromoType
        discountPercent: number | null
        discountAmount: number | null
        minOrderAmount: number | null
        maxDiscount: number | null
        startTime: string | null
        endTime: string | null
        activeDays: DayOfWeek[]
        startDate: string
        endDate: string | null
        maxUsage: number | null
    }>
): Promise<{ success: boolean }> {
    await delay(150)
    const promo = PROMOTIONS.find((p) => p.id === id)
    if (!promo) return { success: false }
    Object.assign(promo, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : promo.startDate,
        endDate: data.endDate ? new Date(data.endDate) : data.endDate === null ? null : promo.endDate,
    })
    return { success: true }
}

export async function deletePromotion(id: string): Promise<{ success: boolean }> {
    await delay(100)
    const idx = PROMOTIONS.findIndex((p) => p.id === id)
    if (idx === -1) return { success: false }
    PROMOTIONS.splice(idx, 1)
    return { success: true }
}

export async function getPromoStats(): Promise<PromoStats> {
    await delay(80)
    const active = PROMOTIONS.filter((p) => p.status === "ACTIVE")
    const totalDiscount = PROMOTIONS.reduce((s, p) => s + p.currentUsage * (p.discountAmount ?? p.discountPercent ?? 0) * 100, 0)
    const mostUsed = [...PROMOTIONS].sort((a, b) => b.currentUsage - a.currentUsage)[0]

    return {
        totalPromotions: PROMOTIONS.length,
        activeNow: active.length,
        totalDiscountGiven: totalDiscount,
        mostUsedPromo: mostUsed?.name ?? "—",
        todayDiscounts: Math.round(totalDiscount * 0.03),
    }
}
