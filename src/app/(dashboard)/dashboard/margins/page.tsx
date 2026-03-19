import { getCOGSByProduct, getCOGSSummary } from "@/actions/finance"
import MarginsClient from "./margins-client"

export const dynamic = "force-dynamic"

export default async function MarginsPage() {
    const [byProduct, summary] = await Promise.all([
        getCOGSByProduct(),
        getCOGSSummary(),
    ])
    return <MarginsClient initial={{ byProduct, summary }} />
}
