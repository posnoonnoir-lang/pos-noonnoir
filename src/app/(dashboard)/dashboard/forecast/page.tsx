import { calculateForecast, getForecastSummary } from "@/actions/forecast"
import ForecastClient from "./forecast-client"

export const dynamic = "force-dynamic"

export default async function ForecastPage() {
    const [items, summary] = await Promise.all([calculateForecast(), getForecastSummary()])
    return <ForecastClient initial={{ items, summary }} />
}
