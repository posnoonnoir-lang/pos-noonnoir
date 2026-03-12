import { getDashboardInitialData } from "@/actions/dashboard-loader"
import { DashboardClient } from "./dashboard-client"

/**
 * Dashboard Server Component — fetches data during SSR.
 * Data is embedded in HTML, so user sees content on first paint.
 * No loading spinner needed.
 */
export default async function DashboardPage() {
    const data = await getDashboardInitialData()
    return <DashboardClient initialData={data} />
}
