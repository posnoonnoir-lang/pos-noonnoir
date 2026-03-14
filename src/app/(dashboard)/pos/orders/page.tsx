import { getOrders } from "@/actions/orders"
import OrdersClient from "./orders-client"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
    let orders: Awaited<ReturnType<typeof getOrders>> = []
    try {
        orders = await getOrders()
    } catch (e) {
        console.error("[OrdersPage SSR] Failed to fetch orders:", e)
    }
    return <OrdersClient initialOrders={orders} />
}
