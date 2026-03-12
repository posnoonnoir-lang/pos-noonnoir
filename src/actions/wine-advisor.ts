"use server"

import { prisma } from "@/lib/prisma"

// ============================================================
// WINE ADVISOR — Smart recommendation engine for POS staff
// ============================================================

export type WineRecommendation = {
    id: string
    name: string
    sku: string
    grapeVariety: string
    country: string
    region: string
    alcoholPct: number
    sellPrice: number
    glassPrice: number | null
    isByGlass: boolean
    inStock: number
    matchReason: string
    matchScore: number
    category: string
    type: string
}

type WineProfile = {
    body: "light" | "medium" | "full"
    acidity: "low" | "medium" | "high"
    sweetness: "dry" | "off-dry" | "sweet"
    tannin: "low" | "medium" | "high"
}

function getWineProfile(grape: string, alcohol: number): WineProfile {
    const g = grape.toLowerCase()

    // Body based on alcohol and grape
    let body: WineProfile["body"] = "medium"
    if (alcohol >= 14 || g.includes("cabernet") || g.includes("shiraz") || g.includes("malbec") || g.includes("zinfandel")) body = "full"
    else if (alcohol <= 12 || g.includes("riesling") || g.includes("moscato") || g.includes("pinot grigio")) body = "light"

    // Acidity
    let acidity: WineProfile["acidity"] = "medium"
    if (g.includes("sauvignon blanc") || g.includes("riesling") || g.includes("pinot noir") || g.includes("sangiovese") || g.includes("barbera")) acidity = "high"
    else if (g.includes("viognier") || g.includes("gewurztraminer") || g.includes("merlot")) acidity = "low"

    // Sweetness
    let sweetness: WineProfile["sweetness"] = "dry"
    if (g.includes("moscato") || g.includes("riesling")) sweetness = "off-dry"

    // Tannin
    let tannin: WineProfile["tannin"] = "medium"
    if (g.includes("cabernet") || g.includes("nebbiolo") || g.includes("tannat") || g.includes("shiraz")) tannin = "high"
    else if (g.includes("pinot noir") || g.includes("gamay") || g.includes("grenache")) tannin = "low"
    if (g.includes("chardonnay") || g.includes("sauvignon blanc") || g.includes("riesling")) tannin = "low"

    return { body, acidity, sweetness, tannin }
}

function profileMatch(a: WineProfile, b: WineProfile): number {
    let score = 0
    if (a.body === b.body) score += 30
    else if (Math.abs(["light", "medium", "full"].indexOf(a.body) - ["light", "medium", "full"].indexOf(b.body)) === 1) score += 15
    if (a.acidity === b.acidity) score += 25
    else if (Math.abs(["low", "medium", "high"].indexOf(a.acidity) - ["low", "medium", "high"].indexOf(b.acidity)) === 1) score += 12
    if (a.tannin === b.tannin) score += 25
    else if (Math.abs(["low", "medium", "high"].indexOf(a.tannin) - ["low", "medium", "high"].indexOf(b.tannin)) === 1) score += 12
    if (a.sweetness === b.sweetness) score += 20
    return score
}

// Get product stock count
export async function getProductStock(productId: string): Promise<number> {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { type: true } })
    if (!product) return 0
    if (["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"].includes(product.type)) {
        return prisma.wineBottle.count({ where: { productId, status: "IN_STOCK" } })
    }
    return 999 // Non-wine products considered always in stock
}

// Check if store allows negative stock
export async function getAllowNegativeStock(): Promise<boolean> {
    const settings = await prisma.storeSettings.findFirst({ select: { allowNegativeStock: true } })
    return settings?.allowNegativeStock ?? false
}

// Toggle allow negative stock (manager action)
export async function toggleAllowNegativeStock(allow: boolean): Promise<{ success: boolean }> {
    await prisma.storeSettings.updateMany({ data: { allowNegativeStock: allow } })
    return { success: true }
}

// Check stock for all items in cart
export async function checkCartStock(items: Array<{ productId: string; quantity: number }>): Promise<{
    ok: boolean
    issues: Array<{ productId: string; productName: string; requested: number; available: number }>
}> {
    const issues: Array<{ productId: string; productName: string; requested: number; available: number }> = []

    for (const item of items) {
        const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true, type: true, trackInventory: true },
        })
        if (!product || !product.trackInventory) continue

        if (["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"].includes(product.type)) {
            const stock = await prisma.wineBottle.count({
                where: { productId: item.productId, status: "IN_STOCK" },
            })
            if (stock < item.quantity) {
                issues.push({
                    productId: item.productId,
                    productName: product.name,
                    requested: item.quantity,
                    available: stock,
                })
            }
        }
    }

    return { ok: issues.length === 0, issues }
}

// Recommend similar wines (by profile, grape, region)
export async function getWineRecommendations(productId: string): Promise<WineRecommendation[]> {
    // Query 1: Get source product (lean select, no joins)
    const source = await prisma.product.findUnique({
        where: { id: productId },
        select: {
            id: true, grapeVariety: true, country: true, region: true,
            alcoholPct: true, categoryId: true, type: true,
        },
    })
    if (!source) return []

    const sourceProfile = getWineProfile(source.grapeVariety ?? "", Number(source.alcoholPct ?? 0))
    const sourceGrapes = (source.grapeVariety ?? "").toLowerCase().split(",").map(g => g.trim())

    // Query 2: Get all wine products (lean select, no joins)
    const wines = await prisma.product.findMany({
        where: {
            isActive: true,
            type: { in: ["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"] },
            id: { not: productId },
        },
        select: {
            id: true, name: true, sku: true, grapeVariety: true,
            country: true, region: true, alcoholPct: true, sellPrice: true,
            glassPrice: true, isByGlass: true, categoryId: true, type: true,
        },
    })

    // Query 3: Batch stock count (single groupBy instead of N subqueries)
    const stockCounts = await prisma.wineBottle.groupBy({
        by: ["productId"],
        where: { status: "IN_STOCK" },
        _count: { id: true },
    })
    const stockMap = new Map(stockCounts.map(s => [s.productId, s._count.id]))

    // Score in-memory (fast)
    const recommendations: WineRecommendation[] = wines.map(w => {
        const wineProfile = getWineProfile(w.grapeVariety ?? "", Number(w.alcoholPct ?? 0))
        const targetGrapes = (w.grapeVariety ?? "").toLowerCase().split(",").map(g => g.trim())

        let score = profileMatch(sourceProfile, wineProfile)
        const reasons: string[] = []

        // Bonus: same grape
        const sameGrape = sourceGrapes.some(sg => targetGrapes.some(tg => tg.includes(sg) || sg.includes(tg)))
        if (sameGrape) { score += 20; reasons.push("Cùng giống nho") }

        // Bonus: same region
        if (source.region && w.region && source.region === w.region) {
            score += 15; reasons.push("Cùng vùng")
        } else if (source.country && w.country && source.country === w.country) {
            score += 8; reasons.push("Cùng quốc gia")
        }

        // Bonus: similar alcohol
        const alcoholDiff = Math.abs(Number(source.alcoholPct ?? 0) - Number(w.alcoholPct ?? 0))
        if (alcoholDiff <= 1) { score += 10; reasons.push("Nồng độ tương đương") }

        // Bonus: same category
        if (source.categoryId === w.categoryId) score += 5

        // Profile description
        const bodyLabels = { light: "Nhẹ", medium: "Vừa", full: "Đậm" }
        const acidLabels = { low: "Ít chua", medium: "Chua vừa", high: "Chua cao" }
        reasons.push(`${bodyLabels[wineProfile.body]} · ${acidLabels[wineProfile.acidity]}`)

        return {
            id: w.id,
            name: w.name,
            sku: w.sku ?? "",
            grapeVariety: w.grapeVariety ?? "",
            country: w.country ?? "",
            region: w.region ?? "",
            alcoholPct: Number(w.alcoholPct ?? 0),
            sellPrice: Number(w.sellPrice),
            glassPrice: w.glassPrice ? Number(w.glassPrice) : null,
            isByGlass: w.isByGlass,
            inStock: stockMap.get(w.id) ?? 0,
            matchReason: reasons.join(" · "),
            matchScore: score,
            category: "",
            type: w.type,
        }
    })

    return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 8)
}

// Recommend alternatives for out-of-stock wine
export async function getAlternativesForOutOfStock(productId: string): Promise<WineRecommendation[]> {
    const recs = await getWineRecommendations(productId)
    return recs.filter(r => r.inStock > 0)
}

// Get wines by taste profile filter
export async function filterWinesByProfile(params: {
    body?: "light" | "medium" | "full"
    acidity?: "low" | "medium" | "high"
    maxAlcohol?: number
    minAlcohol?: number
    maxPrice?: number
}): Promise<WineRecommendation[]> {
    const wines = await prisma.product.findMany({
        where: {
            isActive: true,
            type: { in: ["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"] },
            ...(params.maxAlcohol && { alcoholPct: { lte: params.maxAlcohol } }),
            ...(params.minAlcohol && { alcoholPct: { gte: params.minAlcohol } }),
            ...(params.maxPrice && { sellPrice: { lte: params.maxPrice } }),
        },
        select: {
            id: true, name: true, sku: true, grapeVariety: true,
            country: true, region: true, alcoholPct: true, sellPrice: true,
            glassPrice: true, isByGlass: true, type: true,
        },
    })

    // Batch stock count
    const stockCounts = await prisma.wineBottle.groupBy({
        by: ["productId"],
        where: { status: "IN_STOCK" },
        _count: { id: true },
    })
    const stockMap = new Map(stockCounts.map(s => [s.productId, s._count.id]))

    const results: WineRecommendation[] = wines
        .map(w => {
            const profile = getWineProfile(w.grapeVariety ?? "", Number(w.alcoholPct ?? 0))
            if (params.body && profile.body !== params.body) return null
            if (params.acidity && profile.acidity !== params.acidity) return null

            const bodyLabels = { light: "Nhẹ", medium: "Vừa", full: "Đậm" }
            const acidLabels = { low: "Ít chua", medium: "Chua vừa", high: "Chua cao" }
            const stock = stockMap.get(w.id) ?? 0

            return {
                id: w.id,
                name: w.name,
                sku: w.sku ?? "",
                grapeVariety: w.grapeVariety ?? "",
                country: w.country ?? "",
                region: w.region ?? "",
                alcoholPct: Number(w.alcoholPct ?? 0),
                sellPrice: Number(w.sellPrice),
                glassPrice: w.glassPrice ? Number(w.glassPrice) : null,
                isByGlass: w.isByGlass,
                inStock: stock,
                matchReason: `${bodyLabels[profile.body]} · ${acidLabels[profile.acidity]}`,
                matchScore: stock > 0 ? 50 : 10,
                category: "",
                type: w.type,
            }
        })
        .filter(Boolean) as WineRecommendation[]

    return results.sort((a, b) => b.matchScore - a.matchScore)
}
