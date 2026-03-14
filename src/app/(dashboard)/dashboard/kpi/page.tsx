import { getKpiMetrics, getKpiOverview, isKpiEnabled } from "@/actions/kpi"
import KpiClient from "./kpi-client"

export const dynamic = "force-dynamic"

export default async function KpiPage() {
    const [enabled, metrics, overview] = await Promise.all([
        isKpiEnabled(),
        getKpiMetrics(),
        getKpiOverview(new Date().getFullYear(), new Date().getMonth() + 1),
    ])

    return (
        <KpiClient
            initialEnabled={enabled}
            initialMetrics={metrics}
            initialOverview={overview}
        />
    )
}
