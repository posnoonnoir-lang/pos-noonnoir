import { getActiveOrders } from "@/actions/orders"
import KitchenClient from "./kitchen-client"

export const dynamic = "force-dynamic"

export default async function KitchenPage() {
    let orders: Awaited<ReturnType<typeof getActiveOrders>> = []
    try {
        orders = await getActiveOrders()
    } catch (e) {
        console.error("[KitchenPage SSR] Failed to fetch orders:", e)
    }
    return <KitchenClient initialOrders={orders} />
}
