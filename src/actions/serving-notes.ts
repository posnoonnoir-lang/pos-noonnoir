"use server"

import { prisma } from "@/lib/prisma"

// ============================================================
// WINE SERVING NOTES — Prisma version
// Reads from Product model fields
// tastingNotes JSON format: { nose: string[], palate: string[], finish: string, pairings: string[] }
// ============================================================

export type WineServingNote = {
    id: string; productId: string; productName: string; vintage: string | null
    region: string; grape: string; servingTemp: string; decantTime: string | null
    glassType: string; tastingNotes: { nose: string[]; palate: string[]; finish: string }
    pairings: string[]; staffNotes: string | null; addedBy: string; updatedAt: Date
}

function toServingNote(p: Awaited<ReturnType<typeof prisma.product.findFirst>>): WineServingNote | null {
    if (!p) return null
    const parsed = parseTasting(p.tastingNotes)
    return {
        id: p.id, productId: p.id, productName: p.name,
        vintage: p.vintage ? String(p.vintage) : null,
        region: [p.region, p.country].filter(Boolean).join(", "),
        grape: p.grapeVariety ?? "", servingTemp: p.servingTemp ?? "16-18°C",
        decantTime: p.decantingTime, glassType: p.glassType ?? "Standard",
        tastingNotes: { nose: parsed.nose, palate: parsed.palate, finish: parsed.finish },
        pairings: parsed.pairings ?? [],
        staffNotes: p.description, addedBy: "", updatedAt: p.updatedAt,
    }
}

function parseTasting(notes: string | null): { nose: string[]; palate: string[]; finish: string; pairings?: string[] } {
    if (!notes) return { nose: [], palate: [], finish: "", pairings: [] }
    try {
        const parsed = JSON.parse(notes)
        return {
            nose: parsed.nose ?? [],
            palate: parsed.palate ?? [],
            finish: parsed.finish ?? "",
            pairings: parsed.pairings ?? [],
        }
    } catch {
        return { nose: [], palate: [notes], finish: "", pairings: [] }
    }
}

export async function getAllServingNotes(): Promise<WineServingNote[]> {
    const products = await prisma.product.findMany({
        where: { isActive: true, type: { in: ["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"] } },
        orderBy: { updatedAt: "desc" },
    })
    return products.map(toServingNote).filter(Boolean) as WineServingNote[]
}

export async function getServingNoteByProduct(productId: string): Promise<WineServingNote | null> {
    const p = await prisma.product.findUnique({ where: { id: productId } })
    return toServingNote(p)
}

export async function searchServingNotes(query: string): Promise<WineServingNote[]> {
    if (!query) return getAllServingNotes()
    const products = await prisma.product.findMany({
        where: {
            isActive: true, type: { in: ["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"] },
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { grapeVariety: { contains: query, mode: "insensitive" } },
                { region: { contains: query, mode: "insensitive" } },
                { tastingNotes: { contains: query, mode: "insensitive" } },
            ],
        },
    })
    return products.map(toServingNote).filter(Boolean) as WineServingNote[]
}

// ============================================================
// FULL UPDATE — For manager/owner to setup wine guide info
// ============================================================
export async function updateWineGuideInfo(id: string, updates: {
    servingTemp?: string
    decantTime?: string | null
    glassType?: string
    staffNotes?: string | null
    tastingNotes?: { nose: string[]; palate: string[]; finish: string }
    pairings?: string[]
}): Promise<{ success: boolean; error?: string }> {
    try {
        // Build tasting notes JSON (merge nose/palate/finish + pairings)
        const existing = await prisma.product.findUnique({ where: { id } })
        if (!existing) return { success: false, error: "Sản phẩm không tồn tại" }

        const currentTasting = parseTasting(existing.tastingNotes)
        const newTasting = {
            nose: updates.tastingNotes?.nose ?? currentTasting.nose,
            palate: updates.tastingNotes?.palate ?? currentTasting.palate,
            finish: updates.tastingNotes?.finish ?? currentTasting.finish,
            pairings: updates.pairings ?? currentTasting.pairings ?? [],
        }

        const data: Record<string, unknown> = {
            tastingNotes: JSON.stringify(newTasting),
        }
        if (updates.servingTemp !== undefined) data.servingTemp = updates.servingTemp
        if (updates.decantTime !== undefined) data.decantingTime = updates.decantTime
        if (updates.glassType !== undefined) data.glassType = updates.glassType
        if (updates.staffNotes !== undefined) data.description = updates.staffNotes

        await prisma.product.update({ where: { id }, data })
        return { success: true }
    } catch (err) {
        return { success: false, error: String(err) }
    }
}

// Backward compat
export async function updateServingNote(id: string, updates: { staffNotes?: string; pairings?: string[] }): Promise<{ success: boolean }> {
    return updateWineGuideInfo(id, updates)
}

// ============================================================
// FOOD PAIRING — Select from menu items
// ============================================================

export type FoodMenuItem = { id: string; name: string; type: string; categoryName: string | null; sellPrice: number }

/** Get all food/drink products for pairing selection */
export async function getFoodProducts(): Promise<FoodMenuItem[]> {
    const products = await prisma.product.findMany({
        where: { isActive: true, type: { in: ["FOOD", "DRINK", "OTHER"] } },
        include: { category: { select: { name: true } } },
        orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    })
    return products.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        categoryName: p.category?.name ?? null,
        sellPrice: Number(p.sellPrice),
    }))
}

/** Update wine pairings using product IDs (stored as JSON array of {id, name}) */
export async function updateWinePairings(wineId: string, pairedProductIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
        const products = await prisma.product.findMany({
            where: { id: { in: pairedProductIds } },
            select: { id: true, name: true },
        })
        const pairings = products.map(p => `${p.id}::${p.name}`)

        const existing = await prisma.product.findUnique({ where: { id: wineId } })
        if (!existing) return { success: false, error: "Không tìm thấy rượu" }

        const currentTasting = existing.tastingNotes ? JSON.parse(existing.tastingNotes as string) : {}
        const newTasting = { ...currentTasting, pairings }
        await prisma.product.update({ where: { id: wineId }, data: { tastingNotes: JSON.stringify(newTasting) } })
        return { success: true }
    } catch (err) {
        return { success: false, error: String(err) }
    }
}

/** Get bidirectional pairing: for a product, find all wines that pair with it (food→wines) or all foods paired with it (wine→foods) */
export async function getPairingsForProduct(productId: string): Promise<{ id: string; name: string; type: string; sellPrice: number }[]> {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return []

    const isWine = ["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"].includes(product.type)

    if (isWine) {
        // Wine → return paired food products
        const tasting = product.tastingNotes ? JSON.parse(product.tastingNotes as string) : {}
        const pairings: string[] = tasting.pairings ?? []
        const ids = pairings.map(p => p.split("::")[0]).filter(Boolean)
        if (ids.length === 0) return []
        const foods = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true } })
        return foods.map(f => ({ id: f.id, name: f.name, type: f.type, sellPrice: Number(f.sellPrice) }))
    } else {
        // Food → find all wines that have this food in their pairings
        const wines = await prisma.product.findMany({
            where: {
                isActive: true,
                type: { in: ["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"] },
                tastingNotes: { contains: productId },
            },
        })
        return wines.map(w => ({ id: w.id, name: w.name, type: w.type, sellPrice: Number(w.sellPrice) }))
    }
}
