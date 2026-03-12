import { getAllServingNotes, getFoodProducts } from "@/actions/serving-notes"
import WineGuideClient from "./wineguide-client"

export const dynamic = "force-dynamic"

export default async function WineGuidePage() {
    const [notes, foodProducts] = await Promise.all([getAllServingNotes(), getFoodProducts()])
    return <WineGuideClient initial={{ notes, foodProducts }} />
}
