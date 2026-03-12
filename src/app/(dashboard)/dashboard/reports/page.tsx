import { getPnLSummary, getWeeklyPnL } from "@/actions/daily-pnl"
import {
    getCOGSRecords, getCOGSSummary, getFinanceSummary,
    getExpenseBreakdown, getCOGSByProduct,
} from "@/actions/finance"
import { ReportsClient } from "./reports-client"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
    try {
        const [pnlSummary, weeklyPnl] = await Promise.all([
            getPnLSummary(), getWeeklyPnL(),
        ])
        const [records, cogsSummary, finance] = await Promise.all([
            getCOGSRecords(), getCOGSSummary(), getFinanceSummary(),
        ])
        const [exp, products] = await Promise.all([
            getExpenseBreakdown(), getCOGSByProduct(),
        ])

        return (
            <ReportsClient
                initialPnlData={{ s: pnlSummary, w: weeklyPnl }}
                initialFinanceData={{ records, summary: cogsSummary, finance, exp, products }}
            />
        )
    } catch (e) {
        console.error("[ReportsPage SSR] Failed:", e)
        // Fallback with empty data — client can retry via Refresh
        const emptyPnl = { s: await getPnLSummary().catch(() => null as any), w: [] as any }
        const emptyFin = { records: [] as any, summary: {} as any, finance: {} as any, exp: [] as any, products: [] as any }
        return <ReportsClient initialPnlData={emptyPnl} initialFinanceData={emptyFin} />
    }
}
