import { ProcurementClient } from "./procurement-client"
import {
    getPurchaseOrders,
    getSuppliers,
    getGoodsReceipts,
    getFIFOBatches,
    getProcurementStats,
    getPurchaseReceipts,
} from "@/actions/procurement"
import {
    getConsignments,
    getSettlements,
    getConsignmentStats,
} from "@/actions/consignment"
import { getRawMaterials } from "@/actions/assets"

export const dynamic = "force-dynamic"

export default async function ProcurementPage() {
    const [orders, suppliers, receipts, fifoBatches, stats, consignments, settlements, csmStats, purchaseReceipts, ingredients] = await Promise.all([
        getPurchaseOrders(),
        getSuppliers(),
        getGoodsReceipts(),
        getFIFOBatches(),
        getProcurementStats(),
        getConsignments(),
        getSettlements(),
        getConsignmentStats(),
        getPurchaseReceipts(),
        getRawMaterials(),
    ])

    return (
        <ProcurementClient
            initial={{ orders, suppliers, receipts, fifoBatches, stats, consignments, settlements, csmStats, purchaseReceipts, ingredients }}
        />
    )
}

