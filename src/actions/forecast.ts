"use server"

import { prisma } from "@/lib/prisma"

// ============================================================
// FORECAST — V2 Feature 3 — ENHANCED
// 8-week weighted average, season/trend factors, safety stock
// Uses ForecastConfig for per-product tuning
// ============================================================

export type ForecastItem = {
    id: string; productId: string; productName: string; productSku: string; category: string
    currentStock: number; avgWeeklySales: number; predictedDemand: number; suggestedQty: number
    confidence: number; reason: string; status: "PENDING" | "ACCEPTED" | "DISMISSED"; estimatedCost: number
    // Enhanced fields
    seasonFactor: number; trendFactor: number; leadTimeDays: number; safetyStock: number
    weeklyBreakdown: number[]
}

export type ForecastSummary = { totalItems: number; totalEstimatedCost: number; avgConfidence: number; lastCalculated: string }

// WEIGHTS: more recent weeks have higher weight
// Week -1 (most recent) = 1.0, Week -8 (oldest) = 0.3
const WEEK_WEIGHTS = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

function calcWeightedAverage(weeklyValues: number[]): number {
    const weights = WEEK_WEIGHTS.slice(-weeklyValues.length)
    const totalWeight = weights.reduce((s, w) => s + w, 0)
    if (totalWeight === 0) return 0
    const weightedSum = weeklyValues.reduce((s, v, i) => s + v * weights[i], 0)
    return weightedSum / totalWeight
}

function calcTrendSlope(weeklyValues: number[]): number {
    if (weeklyValues.length < 4) return 1.0
    const recent = weeklyValues.slice(-4)
    const n = recent.length
    const xMean = (n - 1) / 2
    const yMean = recent.reduce((s, v) => s + v, 0) / n
    let num = 0, den = 0
    for (let i = 0; i < n; i++) {
        num += (i - xMean) * (recent[i] - yMean)
        den += (i - xMean) * (i - xMean)
    }
    if (den === 0 || yMean === 0) return 1.0
    const slope = num / den
    // Convert slope to factor: if increasing → >1.0, decreasing → <1.0
    const factor = 1.0 + (slope / yMean) * 0.5
    return Math.max(0.5, Math.min(1.5, Math.round(factor * 100) / 100))
}

function calcDayOfWeekFactor(): number {
    const day = new Date().getDay()
    // Weekend boost (Fri/Sat/Sun)
    if (day === 5) return 1.15
    if (day === 6) return 1.25
    if (day === 0) return 1.10
    // Mon/Tue are typically slower
    if (day === 1 || day === 2) return 0.85
    return 1.0
}

function calcConfidence(weeklyValues: number[], stockCount: number): number {
    if (weeklyValues.length === 0) return 0.3
    // Higher confidence with more data + consistent sales
    const dataPoints = Math.min(weeklyValues.length, 8)
    const dataCoverage = dataPoints / 8 // 0.125 to 1.0
    const nonZeroWeeks = weeklyValues.filter((v) => v > 0).length
    const consistency = nonZeroWeeks / weeklyValues.length

    // Stock awareness: higher confidence when stock is actually tracked
    const stockBonus = stockCount > 0 ? 0.1 : 0

    const raw = (dataCoverage * 0.4 + consistency * 0.4 + stockBonus + 0.1)
    return Math.round(Math.min(0.98, Math.max(0.2, raw)) * 100) / 100
}

export async function calculateForecast(): Promise<ForecastItem[]> {
    // Check DB for existing PENDING suggestions first
    const dbSuggestions = await prisma.forecastSuggestion.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
    })

    if (dbSuggestions.length > 0) {
        return dbSuggestions.map((s) => ({
            id: s.id, productId: s.productId, productName: s.productName,
            productSku: "", category: "", currentStock: Number(s.currentStock),
            avgWeeklySales: 0, predictedDemand: Number(s.predictedDemand),
            suggestedQty: Number(s.suggestedQty), confidence: Number(s.confidence),
            reason: s.reason ?? "", status: s.status as ForecastItem["status"],
            estimatedCost: 0, seasonFactor: 1, trendFactor: 1, leadTimeDays: 3,
            safetyStock: 5, weeklyBreakdown: [],
        }))
    }

    // Generate forecast from historical data — 8-week weighted average
    const products = await prisma.product.findMany({
        where: { isActive: true, trackInventory: true },
        include: { category: true },
    })

    // Load ForecastConfig for all products
    const configs = await prisma.forecastConfig.findMany()
    const configMap = new Map(configs.map((c) => [c.productId, c]))

    // Preload sales for last 8 weeks per product in batch
    const eightWeeksAgo = new Date(Date.now() - 56 * 86400000)
    const allSales = await prisma.orderItem.findMany({
        where: {
            order: { createdAt: { gte: eightWeeksAgo }, status: { not: "CANCELLED" } },
        },
        select: { productId: true, quantity: true, order: { select: { createdAt: true } } },
    })

    // Group sales by product → weekly buckets
    const salesByProduct = new Map<string, number[]>()
    for (const sale of allSales) {
        const weekIndex = Math.floor((Date.now() - sale.order.createdAt.getTime()) / (7 * 86400000))
        if (weekIndex >= 8) continue // older than 8 weeks
        const bucketIdx = 7 - weekIndex // 0=oldest, 7=most recent
        if (!salesByProduct.has(sale.productId)) {
            salesByProduct.set(sale.productId, new Array(8).fill(0))
        }
        salesByProduct.get(sale.productId)![bucketIdx] += sale.quantity
    }

    const dayFactor = calcDayOfWeekFactor()
    const items: ForecastItem[] = []

    for (const p of products) {
        const stockCount = await prisma.wineBottle.count({ where: { productId: p.id, status: "IN_STOCK" } })
        const weeklyValues = salesByProduct.get(p.id) ?? []

        // Use ForecastConfig or calculate
        const config = configMap.get(p.id)
        const weightedAvg = calcWeightedAverage(weeklyValues)
        const autoTrend = calcTrendSlope(weeklyValues)
        const autoSeason = dayFactor

        const seasonFactor = config ? Number(config.seasonFactor) : autoSeason
        const trendFactor = config ? Number(config.trendFactor) : autoTrend
        const leadTimeDays = config?.leadTimeDays ?? 3
        const safetyStock = config?.safetyStock ?? p.lowStockAlert

        // Predicted demand = weighted avg × season × trend
        const predictedDemand = Math.ceil(weightedAvg * seasonFactor * trendFactor)

        // Suggested order = demand + safety stock cover - current stock
        // Safety stock = (daily demand rate) × lead time days + safety buffer
        const dailyRate = predictedDemand / 7
        const leadTimeDemand = Math.ceil(dailyRate * leadTimeDays)
        const suggested = Math.max(0, predictedDemand + leadTimeDemand + safetyStock - stockCount)

        const confidence = calcConfidence(weeklyValues, stockCount)

        // Generate reason
        const reasons: string[] = []
        if (stockCount <= p.lowStockAlert) reasons.push(`Tồn thấp (${stockCount}/${p.lowStockAlert})`)
        if (trendFactor > 1.05) reasons.push(`Xu hướng tăng (×${trendFactor})`)
        if (trendFactor < 0.95) reasons.push(`Xu hướng giảm (×${trendFactor})`)
        if (seasonFactor > 1.05) reasons.push(`Mùa cao điểm (×${seasonFactor})`)
        if (reasons.length === 0) reasons.push(`Dự báo cần ${predictedDemand}, tồn ${stockCount}`)

        if (suggested > 0 || stockCount <= p.lowStockAlert) {
            items.push({
                id: `fc-${p.id.slice(0, 8)}`, productId: p.id, productName: p.name,
                productSku: p.sku ?? "", category: p.category?.name ?? "",
                currentStock: stockCount, avgWeeklySales: Math.round(weightedAvg * 10) / 10,
                predictedDemand, suggestedQty: suggested,
                confidence, reason: reasons.join(" · "),
                status: "PENDING", estimatedCost: suggested * Number(p.costPrice),
                seasonFactor, trendFactor, leadTimeDays, safetyStock,
                weeklyBreakdown: weeklyValues,
            })
        }

        // Update ForecastConfig if exists
        if (config) {
            await prisma.forecastConfig.update({
                where: { id: config.id },
                data: {
                    avgWeeklySales: weightedAvg,
                    seasonFactor: autoSeason,
                    trendFactor: autoTrend,
                    lastCalculated: new Date(),
                },
            })
        }
    }

    return items.sort((a, b) => b.confidence - a.confidence)
}

export async function getForecastSummary(): Promise<ForecastSummary> {
    const items = await calculateForecast()
    const pending = items.filter((i) => i.status === "PENDING" && i.suggestedQty > 0)
    return {
        totalItems: pending.length,
        totalEstimatedCost: pending.reduce((s, i) => s + i.estimatedCost, 0),
        avgConfidence: pending.length > 0 ? Math.round(pending.reduce((s, i) => s + i.confidence, 0) / pending.length * 100) : 0,
        lastCalculated: new Date().toISOString(),
    }
}

export async function updateForecastStatus(id: string, status: "ACCEPTED" | "DISMISSED"): Promise<{ success: boolean }> {
    try {
        await prisma.forecastSuggestion.update({ where: { id }, data: { status } })
    } catch { /* suggestion may not exist in DB yet */ }
    return { success: true }
}

// Save forecast suggestions to DB for tracking
export async function saveForecastToDB(): Promise<{ success: boolean; count: number }> {
    const items = await calculateForecast()
    const pending = items.filter((i) => i.status === "PENDING" && i.suggestedQty > 0 && !i.id.startsWith("fc-"))
    const newItems = items.filter((i) => i.id.startsWith("fc-") && i.suggestedQty > 0)

    const weekOf = new Date()
    weekOf.setDate(weekOf.getDate() - weekOf.getDay()) // Start of current week

    let created = 0
    for (const item of newItems) {
        try {
            await prisma.forecastSuggestion.create({
                data: {
                    productId: item.productId,
                    productName: item.productName,
                    currentStock: item.currentStock,
                    predictedDemand: item.predictedDemand,
                    suggestedQty: item.suggestedQty,
                    confidence: item.confidence,
                    reason: item.reason,
                    weekOf,
                },
            })
            created++
        } catch { /* duplicate or other error */ }
    }

    return { success: true, count: created + pending.length }
}
