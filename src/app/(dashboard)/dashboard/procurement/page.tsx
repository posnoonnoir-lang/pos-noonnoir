import { ProcurementClient } from "./procurement-client"
import {
    getPurchaseOrders,
    getSuppliers,
    getGoodsReceipts,
    getFIFOBatches,
    getProcurementStats,
} from "@/actions/procurement"
import {
    getConsignments,
    getSettlements,
    getConsignmentStats,
} from "@/actions/consignment"

export const dynamic = "force-dynamic"

export default async function ProcurementPage() {
    const [orders, suppliers, receipts, fifoBatches, stats, consignments, settlements, csmStats] = await Promise.all([
        getPurchaseOrders(),
        getSuppliers(),
        getGoodsReceipts(),
        getFIFOBatches(),
        getProcurementStats(),
        getConsignments(),
        getSettlements(),
        getConsignmentStats(),
    ])

    return (
        <ProcurementClient
            initial={{ orders, suppliers, receipts, fifoBatches, stats, consignments, settlements, csmStats }}
        />
    )
}
