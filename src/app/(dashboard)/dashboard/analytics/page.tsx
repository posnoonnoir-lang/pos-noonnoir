import { getAnalyticsInitialData } from "@/actions/analytics-loader"
import { AnalyticsClient } from "./analytics-client"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
    try {
        const data = await getAnalyticsInitialData()
        return <AnalyticsClient initialData={data} />
    } catch (e) {
        console.error("[AnalyticsPage SSR] Failed:", e)
        return (
            <AnalyticsClient
                initialData={{ sum: {} as any, mon: [], cat: [], zone: [], hour: [], stf: [], wRev: [], topP: [], hData: [], pay: [] }}
            />
        )
    }
}
