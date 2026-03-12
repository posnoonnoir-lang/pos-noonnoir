import { getTablesPageData } from "@/actions/tables-loader"
import { TablesClient } from "./tables-client"

export const dynamic = "force-dynamic"

export default async function TablesPage() {
    try {
        const data = await getTablesPageData()
        return <TablesClient initialData={data} />
    } catch (e) {
        console.error("[TablesPage SSR] Failed:", e)
        return <TablesClient initialData={{ zones: [], tables: [], stats: { total: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0 }, activeOrderMap: {} }} />
    }
}
