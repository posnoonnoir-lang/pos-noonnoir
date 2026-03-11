"use server"

import { prisma } from "@/lib/prisma"

/**
 * Consolidated dashboard homepage data loader.
 * Replaces 4 separate calls: getDashboardStats, getWeeklyRevenue, getOrders, getTableStats
 */
export async function getDashboardInitialData() {
    try {
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const yesterdayStart = new Date(todayStart)
        yesterdayStart.setDate(yesterdayStart.getDate() - 1)

        const [
            todayOrders,
            yesterdayOrders,
            recentOrders,
            tableCounts,
            weeklyData,
        ] = await Promise.all([
            prisma.order.aggregate({
                where: { createdAt: { gte: todayStart } },
                _count: true,
                _sum: { totalAmount: true },
            }),
            prisma.order.aggregate({
                where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
                _count: true,
                _sum: { totalAmount: true },
            }),
            prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    items: { select: { id: true, quantity: true } },
                    table: { select: { tableNumber: true } },
                },
            }),
            prisma.floorTable.groupBy({
                by: ["status"],
                where: { isActive: true },
                _count: true,
            }),
            prisma.$queryRaw<Array<{ date: string; revenue: number }>>`
                SELECT 
                    TO_CHAR(created_at, 'DD/MM') as date,
                    COALESCE(SUM(total_amount), 0)::float as revenue
                FROM "order"
                WHERE created_at >= ${new Date(Date.now() - 7 * 86400000)}
                GROUP BY TO_CHAR(created_at, 'DD/MM'), DATE(created_at)
                ORDER BY DATE(created_at) ASC
            `,
        ])

        const todayRevenue = Number(todayOrders._sum.totalAmount ?? 0)
        const yestRevenue = Number(yesterdayOrders._sum.totalAmount ?? 0)
        const revenueChange = yestRevenue > 0
            ? Math.round(((todayRevenue - yestRevenue) / yestRevenue) * 100)
            : 0

        const tableStatusMap: Record<string, number> = {}
        let totalTables = 0
        for (const g of tableCounts) {
            tableStatusMap[g.status] = g._count
            totalTables += g._count
        }

        return {
            stats: {
                todayRevenue,
                yesterdayRevenue: yestRevenue,
                revenueChange,
                todayOrders: todayOrders._count,
                yesterdayOrders: yesterdayOrders._count,
                ordersChange: yesterdayOrders._count > 0
                    ? Math.round(((todayOrders._count - yesterdayOrders._count) / yesterdayOrders._count) * 100)
                    : 0,
                avgOrderValue: todayOrders._count > 0
                    ? Math.round(todayRevenue / todayOrders._count)
                    : 0,
                avgTimeMinutes: 45,
                tableOccupancy: totalTables > 0
                    ? Math.round(((tableStatusMap["OCCUPIED"] ?? 0) / totalTables) * 100)
                    : 0,
            },
            weeklyRevenue: weeklyData.map((d) => ({
                date: d.date,
                revenue: Number(d.revenue),
            })),
            recentOrders: recentOrders.map((o) => ({
                id: o.id,
                orderNumber: o.orderNo,
                tableNumber: o.table?.tableNumber ?? null,
                status: o.status,
                total: Number(o.totalAmount),
                items: o.items.map((i) => ({ id: i.id, quantity: i.quantity })),
                createdAt: o.createdAt.toISOString(),
            })),
            tableStats: {
                total: totalTables,
                available: tableStatusMap["AVAILABLE"] ?? 0,
                occupied: tableStatusMap["OCCUPIED"] ?? 0,
                reserved: tableStatusMap["RESERVED"] ?? 0,
                cleaning: tableStatusMap["CLEANING"] ?? 0,
            },
        }
    } catch (error) {
        console.error("[getDashboardInitialData] Error:", error)
        return {
            stats: {
                todayRevenue: 0, yesterdayRevenue: 0, revenueChange: 0,
                todayOrders: 0, yesterdayOrders: 0, ordersChange: 0,
                avgOrderValue: 0, avgTimeMinutes: 0, tableOccupancy: 0,
            },
            weeklyRevenue: [],
            recentOrders: [],
            tableStats: { total: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0 },
        }
    }
}
