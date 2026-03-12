import { getAllOpenedBottles, getBottleHistory, getByGlassDashboardStats } from "@/actions/wine"
import { BottleTrackingClient } from "./bottle-tracking-client"

export const dynamic = "force-dynamic"

export default async function BottleTrackingPage() {
    const [openedBottles, history, stats] = await Promise.all([
        getAllOpenedBottles(),
        getBottleHistory({ days: 7 }),
        getByGlassDashboardStats(),
    ])
    return <BottleTrackingClient initial={{ openedBottles, history, stats }} />
}
