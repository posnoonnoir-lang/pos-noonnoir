"use server"

import {
    getMonthlyRevenue, getCategoryRevenue, getZoneHeatmap,
    getHourlyHeatmap, getStaffLeaderboard, getAnalyticsSummary,
    type AnalyticsSummary,
} from "@/actions/analytics"
import {
    getWeeklyRevenue, getTopProducts, getHourlyData, getPaymentBreakdown,
} from "@/actions/reports"
import type { AnalyticsInitialData } from "@/app/(dashboard)/dashboard/analytics/analytics-client"

/**
 * Consolidated analytics data loader.
 * All 10 queries run in parallel — single call replaces 10 separate API calls.
 */
export async function getAnalyticsInitialData(): Promise<AnalyticsInitialData> {
    const start = Date.now()
    try {
        const [sum, mon, cat, zone, hour, stf, wRev, topP, hData, pay] = await Promise.all([
            getAnalyticsSummary(), getMonthlyRevenue(),
            getCategoryRevenue(), getZoneHeatmap(),
            getHourlyHeatmap(), getStaffLeaderboard(),
            getWeeklyRevenue(), getTopProducts(),
            getHourlyData(), getPaymentBreakdown(),
        ])

        const elapsed = Date.now() - start
        if (elapsed > 3000) {
            console.warn(`[Analytics] Slow load: ${elapsed}ms`)
        }

        return { sum, mon, cat, zone, hour, stf, wRev, topP, hData, pay }
    } catch (error) {
        console.error("[getAnalyticsInitialData] Error:", error)
        return {
            sum: {
                totalRevenue: 0, totalOrders: 0, avgTicket: 0,
                totalCustomers: 0,
                revenueGrowth: 0, ordersGrowth: 0,
                bestDay: "—", bestDayRevenue: 0,
                peakHour: "—", peakHourOrders: 0,
            } as AnalyticsSummary,
            mon: [], cat: [], zone: [], hour: [], stf: [],
            wRev: [], topP: [], hData: [], pay: [],
        }
    }
}
