import { getActiveOrders } from "@/actions/orders"
import KitchenClient from "./kitchen-client"

export const dynamic = "force-dynamic"

export default async function KitchenPage() {
    const orders = await getActiveOrders()
    return <KitchenClient initialOrders={orders} />
}
