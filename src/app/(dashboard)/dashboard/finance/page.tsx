import { FinanceClient } from "./finance-client"
import {
    getCOGSRecords,
    getCOGSSummary,
    getFinanceSummary,
    getExpenseBreakdown,
    getCOGSByProduct,
} from "@/actions/finance"

export const dynamic = "force-dynamic"

export default async function FinancePage() {
    const [cogsRecords, cogsSummary, financeSummary, expenses, productCOGS] = await Promise.all([
        getCOGSRecords(),
        getCOGSSummary(),
        getFinanceSummary(),
        getExpenseBreakdown(),
        getCOGSByProduct(),
    ])

    return (
        <FinanceClient
            initial={{ cogsRecords, cogsSummary, financeSummary, expenses, productCOGS }}
        />
    )
}
