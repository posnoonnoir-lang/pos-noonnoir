import { getAllCustomers, getCustomerStats } from "@/actions/customers"
import { CustomersClient } from "./customers-client"

export const dynamic = "force-dynamic"

export default async function CustomersPage() {
    let list: Awaited<ReturnType<typeof getAllCustomers>> = []
    let stats: Awaited<ReturnType<typeof getCustomerStats>> = {
        totalCustomers: 0, byTier: {}, totalRevenue: 0,
        avgSpendPerVisit: 0, monthlyNew: 0, topSpenders: [],
    }

    try {
        const [l, s] = await Promise.all([getAllCustomers(), getCustomerStats()])
        list = l
        stats = s
    } catch (err) {
        console.error("[Customers SSR] Failed:", err)
    }

    return <CustomersClient initialData={{ list, stats }} />
}
