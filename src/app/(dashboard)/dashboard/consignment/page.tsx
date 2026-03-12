import { getConsignments, getSettlements } from "@/actions/consignment"
import { ConsignmentClient } from "./consignment-client"

export const dynamic = "force-dynamic"

export default async function ConsignmentPage() {
    const [consignments, settlements] = await Promise.all([getConsignments(), getSettlements()])
    return <ConsignmentClient initial={{ consignments, settlements }} />
}
