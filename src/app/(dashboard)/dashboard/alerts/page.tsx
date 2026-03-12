import { getInventoryAlerts } from "@/actions/inventory-alerts"
import AlertsClient from "./alerts-client"

export const dynamic = "force-dynamic"

export default async function AlertsPage() {
    const alerts = await getInventoryAlerts()
    return <AlertsClient initial={alerts} />
}
