import { getPnLSummary, getWeeklyPnL } from "@/actions/daily-pnl"
import {
    getCOGSRecords, getCOGSSummary, getFinanceSummary,
    getExpenseBreakdown, getCOGSByProduct,
} from "@/actions/finance"
import { ReportsClient } from "./reports-client"

/**
 * Reports Server Component — pre-fetches P&L and Finance data during SSR.
 * Both sub-views get data embedded in the HTML response.
 */
export default async function ReportsPage() {
    // Fetch P&L data (sequential pairs to limit concurrency)
    const [pnlSummary, weeklyPnl] = await Promise.all([
        getPnLSummary(), getWeeklyPnL(),
    ])

    // Then fetch Finance data
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
}
