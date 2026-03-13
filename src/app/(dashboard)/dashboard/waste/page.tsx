import { getWasteReport, getWasteFormOptions } from "@/actions/waste"
import WasteClient from "./waste-client"

export const dynamic = "force-dynamic"

export default async function WastePage() {
    const [report, formOptions] = await Promise.all([
        getWasteReport(),
        getWasteFormOptions(),
    ])
    return <WasteClient initial={report} formOptions={formOptions} />
}
