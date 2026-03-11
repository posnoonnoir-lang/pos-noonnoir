"use server"

import { prisma } from "@/lib/prisma"

// ============================================================
// FORECAST — V2 Feature 3 — Prisma version
// ============================================================

export type ForecastItem = {
    id: string; productId: string; productName: string; productSku: string; category: string
    currentStock: number; avgWeeklySales: number; predictedDemand: number; suggestedQty: number
    confidence: number; reason: string; status: "PENDING" | "ACCEPTED" | "DISMISSED"; estimatedCost: number
}

export type ForecastSummary = { totalItems: number; totalEstimatedCost: number; avgConfidence: number; lastCalculated: string }

export async function calculateForecast(): Promise<ForecastItem[]> {
    // Check DB for existing suggestions first
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
            estimatedCost: 0,
        }))
    }

    // Generate from product data
    const products = await prisma.product.findMany({
        where: { isActive: true, trackInventory: true },
        include: { category: true },
    })

    const items: ForecastItem[] = []
    for (const p of products) {
        const stockCount = await prisma.wineBottle.count({ where: { productId: p.id, status: "IN_STOCK" } })
        const weekAgo = new Date(Date.now() - 7 * 86400000)
        const salesCount = await prisma.orderItem.count({
            where: { productId: p.id, order: { createdAt: { gte: weekAgo }, status: { not: "CANCELLED" } } },
        })

        const avgWeekly = salesCount
        const predicted = Math.ceil(avgWeekly * 1.1)
        const suggested = Math.max(0, predicted - stockCount + p.lowStockAlert)

        if (suggested > 0 || stockCount <= p.lowStockAlert) {
            items.push({
                id: `fc-${p.id.slice(0, 8)}`, productId: p.id, productName: p.name,
                productSku: p.sku ?? "", category: p.category?.name ?? "",
                currentStock: stockCount, avgWeeklySales: avgWeekly,
                predictedDemand: predicted, suggestedQty: suggested,
                confidence: avgWeekly > 0 ? 0.85 : 0.5,
                reason: stockCount <= p.lowStockAlert ? `Tồn thấp (${stockCount}/${p.lowStockAlert})` : `Dự báo cần ${predicted}, tồn ${stockCount}`,
                status: "PENDING", estimatedCost: suggested * Number(p.costPrice),
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
