import { getTablesPageData } from "@/actions/tables-loader"
import { TablesClient } from "./tables-client"

export default async function TablesPage() {
    const data = await getTablesPageData()
    return <TablesClient initialData={data} />
}
