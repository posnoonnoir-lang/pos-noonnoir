import { FinanceClient } from "./finance-client"
import {
    getCOGSRecords,
    getCOGSSummary,
    getFinanceSummary,
    getExpenseBreakdown,
    getCOGSByProduct,
    getDailyRevenueChart,
    getTopProductsRevenue,
} from "@/actions/finance"

export const dynamic = "force-dynamic"

export default async function FinancePage() {
    const [cogsRecords, cogsSummary, financeSummary, expenses, productCOGS, dailyChart, topProducts] = await Promise.all([
        getCOGSRecords(),
        getCOGSSummary(),
        getFinanceSummary(),
        getExpenseBreakdown(),
        getCOGSByProduct(),
        getDailyRevenueChart(30),
        getTopProductsRevenue(10),
    ])

    return (
        <FinanceClient
            initial={{ cogsRecords, cogsSummary, financeSummary, expenses, productCOGS, dailyChart, topProducts }}
        />
    )
}
