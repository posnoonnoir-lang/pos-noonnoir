"use server"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type DailyRevenue = { date: string; revenue: number; orders: number }
export type TopProduct = { name: string; quantity: number; revenue: number; category: string }
export type HourlyData = { hour: string; orders: number; revenue: number }
export type PaymentBreakdown = { method: string; count: number; total: number; percentage: number }
export type StaffPerformance = { name: string; orders: number; revenue: number; avgTime: number }

export async function getDashboardStats() {
    await delay(150)
    return {
        todayRevenue: 12_850_000,
        yesterdayRevenue: 10_230_000,
        revenueChange: 25.6,
        todayOrders: 34,
        yesterdayOrders: 28,
        ordersChange: 21.4,
        avgOrderValue: 378_000,
        avgTimeMinutes: 42,
        tableOccupancy: 67,
        topSellingProduct: "Château Margaux 2018",
    }
}

export async function getWeeklyRevenue(): Promise<DailyRevenue[]> {
    await delay(200)
    return [
        { date: "T2", revenue: 8_500_000, orders: 22 },
        { date: "T3", revenue: 9_200_000, orders: 25 },
        { date: "T4", revenue: 7_800_000, orders: 20 },
        { date: "T5", revenue: 11_400_000, orders: 30 },
        { date: "T6", revenue: 15_200_000, orders: 42 },
        { date: "T7", revenue: 18_600_000, orders: 51 },
        { date: "CN", revenue: 12_850_000, orders: 34 },
    ]
}

export async function getTopProducts(): Promise<TopProduct[]> {
    await delay(150)
    return [
        { name: "Château Margaux 2018", quantity: 12, revenue: 70_800_000, category: "Wine by Bottle" },
        { name: "Opus One 2019", quantity: 8, revenue: 78_400_000, category: "Wine by Bottle" },
        { name: "Aperol Spritz", quantity: 45, revenue: 5_400_000, category: "No-fuss Drinks" },
        { name: "Cheese Board", quantity: 32, revenue: 8_000_000, category: "Food" },
        { name: "Negroni", quantity: 28, revenue: 4_200_000, category: "No-fuss Drinks" },
        { name: "Truffle Fries", quantity: 25, revenue: 3_750_000, category: "Food" },
        { name: "Pinot Noir Glass", quantity: 22, revenue: 2_640_000, category: "Wine by Glass" },
        { name: "Tiramisu", quantity: 18, revenue: 2_340_000, category: "Dessert" },
    ]
}

export async function getHourlyData(): Promise<HourlyData[]> {
    await delay(150)
    return [
        { hour: "10h", orders: 2, revenue: 580_000 },
        { hour: "11h", orders: 5, revenue: 1_200_000 },
        { hour: "12h", orders: 8, revenue: 2_800_000 },
        { hour: "13h", orders: 6, revenue: 1_900_000 },
        { hour: "14h", orders: 3, revenue: 950_000 },
        { hour: "15h", orders: 2, revenue: 620_000 },
        { hour: "16h", orders: 4, revenue: 1_100_000 },
        { hour: "17h", orders: 7, revenue: 2_400_000 },
        { hour: "18h", orders: 12, revenue: 4_500_000 },
        { hour: "19h", orders: 15, revenue: 6_200_000 },
        { hour: "20h", orders: 18, revenue: 8_100_000 },
        { hour: "21h", orders: 14, revenue: 5_800_000 },
        { hour: "22h", orders: 8, revenue: 3_200_000 },
    ]
}

export async function getPaymentBreakdown(): Promise<PaymentBreakdown[]> {
    await delay(100)
    const data = [
        { method: "Tiền mặt", count: 14, total: 4_850_000 },
        { method: "Thẻ", count: 12, total: 5_200_000 },
        { method: "QR Pay", count: 8, total: 2_800_000 },
    ]
    const grandTotal = data.reduce((s, d) => s + d.total, 0)
    return data.map((d) => ({ ...d, percentage: Math.round((d.total / grandTotal) * 100) }))
}

export async function getStaffPerformance(): Promise<StaffPerformance[]> {
    await delay(150)
    return [
        { name: "Chien", orders: 15, revenue: 6_200_000, avgTime: 38 },
        { name: "Linh", orders: 12, revenue: 4_800_000, avgTime: 42 },
        { name: "Minh", orders: 7, revenue: 1_850_000, avgTime: 35 },
    ]
}
