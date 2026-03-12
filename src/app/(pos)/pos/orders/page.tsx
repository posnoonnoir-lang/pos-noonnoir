import { getOrders } from "@/actions/orders"
import OrdersClient from "./orders-client"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
    const orders = await getOrders()
    return <OrdersClient initialOrders={orders} />
}
