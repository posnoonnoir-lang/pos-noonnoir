import { getAllCustomers, getCustomerStats } from "@/actions/customers"
import { CustomersClient } from "./customers-client"

export default async function CustomersPage() {
    const [list, stats] = await Promise.all([getAllCustomers(), getCustomerStats()])
    return <CustomersClient initialData={{ list, stats }} />
}
