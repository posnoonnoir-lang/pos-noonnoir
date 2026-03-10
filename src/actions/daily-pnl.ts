"use server"

// ============================================================
// DAILY P&L REPORT (US-4.4)
// Auto-generate P&L, revenue vs expenses, trend comparison
// ============================================================

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type DailyPnL = {
    date: string
    revenue: number
    costOfGoods: number
    grossProfit: number
    grossMargin: number
    expenses: PnLExpenseGroup[]
    totalExpenses: number
    netProfit: number
    netMargin: number
    orderCount: number
    avgOrderValue: number
    topProducts: Array<{ name: string; qty: number; revenue: number }>
    paymentBreakdown: { cash: number; card: number; qr: number }
    wasteAndSpoilage: number
}

export type PnLExpenseGroup = {
    category: string
    amount: number
    items: Array<{ description: string; amount: number }>
}

export type PnLTrend = {
    date: string
    revenue: number
    profit: number
    orders: number
}

export type PnLSummary = {
    today: DailyPnL
    weekAvg: { revenue: number; profit: number; orders: number }
    monthAvg: { revenue: number; profit: number; orders: number }
    revenueChangeVsYesterday: number
    profitChangeVsYesterday: number
    weeklyTrend: PnLTrend[]
}

// ============================================================
// MOCK DATA — 7 days of P&L
// ============================================================

const DAILY_DATA: DailyPnL[] = [
    {
        date: "2026-03-10",
        revenue: 20800000,
        costOfGoods: 8320000,
        grossProfit: 12480000,
        grossMargin: 60.0,
        expenses: [
            { category: "Nhân sự", amount: 2450000, items: [{ description: "Lương ca sáng (2 người)", amount: 1400000 }, { description: "Lương ca tối (3 người)", amount: 1050000 }] },
            { category: "Vận hành", amount: 580000, items: [{ description: "Đá lạnh, chanh, garnish", amount: 180000 }, { description: "Hoa trang trí", amount: 350000 }, { description: "Khăn giấy, ly dùng 1 lần", amount: 50000 }] },
            { category: "Hao hụt", amount: 320000, items: [{ description: "Rượu hỏng (1 chai Pinot Noir)", amount: 320000 }] },
        ],
        totalExpenses: 3350000,
        netProfit: 9130000,
        netMargin: 43.9,
        orderCount: 30,
        avgOrderValue: 693000,
        topProducts: [
            { name: "Château Margaux 2018 (chai)", qty: 2, revenue: 11800000 },
            { name: "Cabernet Sauvignon Glass", qty: 18, revenue: 2160000 },
            { name: "Cheese Board", qty: 8, revenue: 1440000 },
            { name: "Aperol Spritz", qty: 12, revenue: 1080000 },
            { name: "Wine Tasting Flight", qty: 6, revenue: 930000 },
        ],
        paymentBreakdown: { cash: 10150000, card: 7400000, qr: 3250000 },
        wasteAndSpoilage: 320000,
    },
    {
        date: "2026-03-09",
        revenue: 18500000,
        costOfGoods: 7400000,
        grossProfit: 11100000,
        grossMargin: 60.0,
        expenses: [
            { category: "Nhân sự", amount: 2450000, items: [{ description: "Lương ca sáng", amount: 1200000 }, { description: "Lương ca tối", amount: 1250000 }] },
            { category: "Vận hành", amount: 420000, items: [{ description: "Vật phẩm vận hành", amount: 420000 }] },
            { category: "Hao hụt", amount: 0, items: [] },
        ],
        totalExpenses: 2870000,
        netProfit: 8230000,
        netMargin: 44.5,
        orderCount: 26,
        avgOrderValue: 712000,
        topProducts: [
            { name: "Wine Tasting Flight", qty: 10, revenue: 1550000 },
            { name: "Champagne Dom Pérignon", qty: 1, revenue: 15200000 },
        ],
        paymentBreakdown: { cash: 8800000, card: 6200000, qr: 3500000 },
        wasteAndSpoilage: 0,
    },
    {
        date: "2026-03-08",
        revenue: 15200000,
        costOfGoods: 6080000,
        grossProfit: 9120000,
        grossMargin: 60.0,
        expenses: [
            { category: "Nhân sự", amount: 2100000, items: [{ description: "Lương nhân viên", amount: 2100000 }] },
            { category: "Vận hành", amount: 350000, items: [{ description: "Chi phí hàng ngày", amount: 350000 }] },
            { category: "Hao hụt", amount: 150000, items: [{ description: "Rượu bị lỗi cork", amount: 150000 }] },
        ],
        totalExpenses: 2600000,
        netProfit: 6520000,
        netMargin: 42.9,
        orderCount: 22,
        avgOrderValue: 691000,
        topProducts: [{ name: "Rosé Champagne", qty: 3, revenue: 5400000 }],
        paymentBreakdown: { cash: 7200000, card: 5000000, qr: 3000000 },
        wasteAndSpoilage: 150000,
    },
    {
        date: "2026-03-07",
        revenue: 22100000,
        costOfGoods: 8840000,
        grossProfit: 13260000,
        grossMargin: 60.0,
        expenses: [
            { category: "Nhân sự", amount: 2800000, items: [{ description: "Lương + OT tối T6", amount: 2800000 }] },
            { category: "Vận hành", amount: 650000, items: [{ description: "Chi phí T6 peak", amount: 650000 }] },
            { category: "Hao hụt", amount: 0, items: [] },
        ],
        totalExpenses: 3450000,
        netProfit: 9810000,
        netMargin: 44.4,
        orderCount: 35,
        avgOrderValue: 631000,
        topProducts: [{ name: "Barolo 2019", qty: 4, revenue: 8400000 }],
        paymentBreakdown: { cash: 11050000, card: 7700000, qr: 3350000 },
        wasteAndSpoilage: 0,
    },
    {
        date: "2026-03-06",
        revenue: 12800000,
        costOfGoods: 5120000,
        grossProfit: 7680000,
        grossMargin: 60.0,
        expenses: [
            { category: "Nhân sự", amount: 2100000, items: [{ description: "Lương", amount: 2100000 }] },
            { category: "Vận hành", amount: 280000, items: [{ description: "Chi phí", amount: 280000 }] },
            { category: "Hao hụt", amount: 0, items: [] },
        ],
        totalExpenses: 2380000,
        netProfit: 5300000,
        netMargin: 41.4,
        orderCount: 18,
        avgOrderValue: 711000,
        topProducts: [{ name: "Chianti Classico", qty: 6, revenue: 3600000 }],
        paymentBreakdown: { cash: 6400000, card: 4000000, qr: 2400000 },
        wasteAndSpoilage: 0,
    },
    {
        date: "2026-03-05",
        revenue: 16400000,
        costOfGoods: 6560000,
        grossProfit: 9840000,
        grossMargin: 60.0,
        expenses: [
            { category: "Nhân sự", amount: 2300000, items: [{ description: "Lương", amount: 2300000 }] },
            { category: "Vận hành", amount: 380000, items: [{ description: "Chi phí", amount: 380000 }] },
            { category: "Hao hụt", amount: 200000, items: [{ description: "Hao hụt rượu", amount: 200000 }] },
        ],
        totalExpenses: 2880000,
        netProfit: 6960000,
        netMargin: 42.4,
        orderCount: 24,
        avgOrderValue: 683000,
        topProducts: [{ name: "Opus One 2019", qty: 1, revenue: 10120000 }],
        paymentBreakdown: { cash: 8200000, card: 5200000, qr: 3000000 },
        wasteAndSpoilage: 200000,
    },
    {
        date: "2026-03-04",
        revenue: 14600000,
        costOfGoods: 5840000,
        grossProfit: 8760000,
        grossMargin: 60.0,
        expenses: [
            { category: "Nhân sự", amount: 2200000, items: [{ description: "Lương", amount: 2200000 }] },
            { category: "Vận hành", amount: 320000, items: [{ description: "Chi phí", amount: 320000 }] },
            { category: "Hao hụt", amount: 0, items: [] },
        ],
        totalExpenses: 2520000,
        netProfit: 6240000,
        netMargin: 42.7,
        orderCount: 20,
        avgOrderValue: 730000,
        topProducts: [{ name: "Prosecco Glass", qty: 15, revenue: 1500000 }],
        paymentBreakdown: { cash: 7300000, card: 4600000, qr: 2700000 },
        wasteAndSpoilage: 0,
    },
]

// ============================================================
// ACTIONS
// ============================================================

export async function getTodayPnL(): Promise<DailyPnL> {
    await delay(100)
    return DAILY_DATA[0]
}

export async function getPnLByDate(date: string): Promise<DailyPnL | null> {
    await delay(80)
    return DAILY_DATA.find((d) => d.date === date) ?? null
}

export async function getPnLSummary(): Promise<PnLSummary> {
    await delay(120)

    const today = DAILY_DATA[0]
    const yesterday = DAILY_DATA[1]

    const weekData = DAILY_DATA.slice(0, 7)
    const weekAvg = {
        revenue: Math.round(weekData.reduce((s, d) => s + d.revenue, 0) / weekData.length),
        profit: Math.round(weekData.reduce((s, d) => s + d.netProfit, 0) / weekData.length),
        orders: Math.round(weekData.reduce((s, d) => s + d.orderCount, 0) / weekData.length),
    }

    const revenueChange = yesterday.revenue > 0 ? ((today.revenue - yesterday.revenue) / yesterday.revenue) * 100 : 0
    const profitChange = yesterday.netProfit > 0 ? ((today.netProfit - yesterday.netProfit) / yesterday.netProfit) * 100 : 0

    return {
        today,
        weekAvg,
        monthAvg: { revenue: weekAvg.revenue, profit: weekAvg.profit, orders: weekAvg.orders },
        revenueChangeVsYesterday: Math.round(revenueChange * 10) / 10,
        profitChangeVsYesterday: Math.round(profitChange * 10) / 10,
        weeklyTrend: [...DAILY_DATA].reverse().map((d) => ({
            date: d.date,
            revenue: d.revenue,
            profit: d.netProfit,
            orders: d.orderCount,
        })),
    }
}

export async function getWeeklyPnL(): Promise<DailyPnL[]> {
    await delay(100)
    return [...DAILY_DATA]
}
