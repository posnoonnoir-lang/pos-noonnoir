import { getSuppliers } from "@/actions/procurement"
import SuppliersClient from "./suppliers-client"

export const dynamic = "force-dynamic"

export default async function SuppliersPage() {
    const suppliers = await getSuppliers()
    return <SuppliersClient initial={{ suppliers }} />
}
