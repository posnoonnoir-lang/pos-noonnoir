import { getDashboardInitialData } from "@/actions/dashboard-loader"
import { DashboardClient } from "./dashboard-client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
    try {
        const data = await getDashboardInitialData()
        return <DashboardClient initialData={data} />
    } catch (e) {
        console.error("[DashboardPage SSR] Failed:", e)
        return <DashboardClient initialData={{} as any} />
    }
}
