"use server"

// ============================================================
// FORECAST — V2 Feature 3
// Dự báo đặt hàng nâng cao
// ============================================================

export type ForecastItem = {
    id: string
    productId: string
    productName: string
    productSku: string
    category: string
    currentStock: number
    avgWeeklySales: number
    predictedDemand: number
    suggestedQty: number
    confidence: number
    reason: string
    status: "PENDING" | "ACCEPTED" | "DISMISSED"
    estimatedCost: number
}

export type ForecastSummary = {
    totalItems: number
    totalEstimatedCost: number
    avgConfidence: number
    lastCalculated: string
}

/**
 * Calculate forecast suggestions using weighted moving average
 * with seasonal decomposition
 */
export async function calculateForecast(): Promise<ForecastItem[]> {
    // Mock data — in production, uses:
    // 1. Weighted avg of last 8 weeks (weights: 1.0, 0.95, 0.9, 0.85, 0.8, 0.7, 0.6, 0.5)
    // 2. Season factor: day-of-week pattern
    // 3. Trend: 4-week slope
    // 4. Holiday/weekend boost
    // 5. Safety stock buffer

    const items: ForecastItem[] = [
        {
            id: "fc-1",
            productId: "prod-1",
            productName: "Château Margaux 2018",
            productSku: "WB-001",
            category: "Wine by Bottle",
            currentStock: 3,
            avgWeeklySales: 2.1,
            predictedDemand: 2.5,
            suggestedQty: 3,
            confidence: 0.87,
            reason: "Tồn thấp + nhu cầu ổn định. Lead time 5 ngày.",
            status: "PENDING",
            estimatedCost: 10500000,
        },
        {
            id: "fc-2",
            productId: "prod-2",
            productName: "Opus One 2019",
            productSku: "WB-002",
            category: "Wine by Bottle",
            currentStock: 2,
            avgWeeklySales: 1.5,
            predictedDemand: 1.8,
            suggestedQty: 2,
            confidence: 0.82,
            reason: "Sắp hết stock. Xu hướng tăng 12% tuần gần đây.",
            status: "PENDING",
            estimatedCost: 12000000,
        },
        {
            id: "fc-3",
            productId: "prod-3",
            productName: "Cloudy Bay SB 2022",
            productSku: "WB-003",
            category: "Wine by Bottle",
            currentStock: 5,
            avgWeeklySales: 3.2,
            predictedDemand: 3.8,
            suggestedQty: 4,
            confidence: 0.91,
            reason: "Best seller. Cuối tuần tăng 40%. Safety stock = 3.",
            status: "PENDING",
            estimatedCost: 2600000,
        },
        {
            id: "fc-4",
            productId: "prod-9",
            productName: "Cheese Board",
            productSku: "FD-001",
            category: "Food",
            currentStock: 8,
            avgWeeklySales: 12.0,
            predictedDemand: 14.0,
            suggestedQty: 8,
            confidence: 0.78,
            reason: "Nguyên liệu phô mai sắp hết. Cần nhập lại.",
            status: "PENDING",
            estimatedCost: 640000,
        },
        {
            id: "fc-5",
            productId: "prod-barolo",
            productName: "Barolo 2017",
            productSku: "WB-007",
            category: "Wine by Bottle",
            currentStock: 4,
            avgWeeklySales: 0.3,
            predictedDemand: 0.2,
            suggestedQty: 0,
            confidence: 0.65,
            reason: "Slow mover — 21 ngày không bán. KHÔNG cần nhập thêm.",
            status: "PENDING",
            estimatedCost: 0,
        },
        {
            id: "fc-6",
            productId: "prod-rosé",
            productName: "Rosé Provence 2023",
            productSku: "WB-008",
            category: "Wine by Bottle",
            currentStock: 1,
            avgWeeklySales: 2.8,
            predictedDemand: 3.2,
            suggestedQty: 5,
            confidence: 0.85,
            reason: "Xu hướng mùa hè tăng mạnh. Rất phổ biến cuối tuần.",
            status: "PENDING",
            estimatedCost: 3750000,
        },
    ]

    return items
}

/**
 * Get forecast summary stats
 */
export async function getForecastSummary(): Promise<ForecastSummary> {
    const items = await calculateForecast()
    const pendingItems = items.filter((i) => i.status === "PENDING" && i.suggestedQty > 0)

    return {
        totalItems: pendingItems.length,
        totalEstimatedCost: pendingItems.reduce((sum, i) => sum + i.estimatedCost, 0),
        avgConfidence: pendingItems.length > 0
            ? Math.round((pendingItems.reduce((sum, i) => sum + i.confidence, 0) / pendingItems.length) * 100)
            : 0,
        lastCalculated: new Date().toISOString(),
    }
}

/**
 * Update suggestion status (ACCEPTED / DISMISSED)
 */
export async function updateForecastStatus(
    id: string,
    status: "ACCEPTED" | "DISMISSED"
): Promise<{ success: boolean }> {
    void id
    void status
    // In production:
    // 1. Update ForecastSuggestion record
    // 2. If ACCEPTED, auto-create draft PO line
    return { success: true }
}
