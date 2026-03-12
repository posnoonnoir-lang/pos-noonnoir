import {
    getMonthlyRevenue, getCategoryRevenue, getZoneHeatmap,
    getHourlyHeatmap, getStaffLeaderboard, getAnalyticsSummary,
} from "@/actions/analytics"
import {
    getWeeklyRevenue, getTopProducts, getHourlyData, getPaymentBreakdown,
} from "@/actions/reports"
import { AnalyticsClient } from "./analytics-client"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
    try {
        const [sum, mon] = await Promise.all([getAnalyticsSummary(), getMonthlyRevenue()])
        const [cat, zone] = await Promise.all([getCategoryRevenue(), getZoneHeatmap()])
        const [hour, stf] = await Promise.all([getHourlyHeatmap(), getStaffLeaderboard()])
        const [wRev, topP] = await Promise.all([getWeeklyRevenue(), getTopProducts()])
        const [hData, pay] = await Promise.all([getHourlyData(), getPaymentBreakdown()])

        return (
            <AnalyticsClient
                initialData={{ sum, mon, cat, zone, hour, stf, wRev, topP, hData, pay }}
            />
        )
    } catch (e) {
        console.error("[AnalyticsPage SSR] Failed:", e)
        return (
            <AnalyticsClient
                initialData={{ sum: {} as any, mon: [], cat: [], zone: [], hour: [], stf: [], wRev: [], topP: [], hData: [], pay: [] }}
            />
        )
    }
}
