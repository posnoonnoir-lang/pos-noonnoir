import { getAllPromotions, getPromoStats } from "@/actions/promotions"
import PromotionsClient from "./promotions-client"

export const dynamic = "force-dynamic"

export default async function PromotionsPage() {
    const [promos, stats] = await Promise.all([getAllPromotions(), getPromoStats()])
    return <PromotionsClient initial={{ promos, stats }} />
}
