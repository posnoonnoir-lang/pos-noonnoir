"use server"

import { prisma } from "@/lib/prisma"

// ============================================================
// WINE SERVING NOTES — Prisma version
// Reads from Product model fields
// ============================================================

export type WineServingNote = {
    id: string; productId: string; productName: string; vintage: string | null
    region: string; grape: string; servingTemp: string; decantTime: string | null
    glassType: string; tastingNotes: { nose: string[]; palate: string[]; finish: string }
    pairings: string[]; staffNotes: string | null; addedBy: string; updatedAt: Date
}

function toServingNote(p: Awaited<ReturnType<typeof prisma.product.findFirst>>): WineServingNote | null {
    if (!p) return null
    return {
        id: p.id, productId: p.id, productName: p.name,
        vintage: p.vintage ? String(p.vintage) : null,
        region: [p.region, p.country].filter(Boolean).join(", "),
        grape: p.grapeVariety ?? "", servingTemp: p.servingTemp ?? "16-18°C",
        decantTime: p.decantingTime, glassType: p.glassType ?? "Standard",
        tastingNotes: parseTasting(p.tastingNotes),
        pairings: [], staffNotes: p.description, addedBy: "", updatedAt: p.updatedAt,
    }
}

function parseTasting(notes: string | null): { nose: string[]; palate: string[]; finish: string } {
    if (!notes) return { nose: [], palate: [], finish: "" }
    try { return JSON.parse(notes) } catch { return { nose: [], palate: [notes], finish: "" } }
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
    const q = `%${query}%`
    const products = await prisma.product.findMany({
        where: {
            isActive: true, type: { in: ["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"] },
            OR: [{ name: { contains: query, mode: "insensitive" } }, { grapeVariety: { contains: query, mode: "insensitive" } }, { region: { contains: query, mode: "insensitive" } }],
        },
    })
    void q // used in the Prisma query above via contains
    return products.map(toServingNote).filter(Boolean) as WineServingNote[]
}

export async function updateServingNote(id: string, updates: { staffNotes?: string; pairings?: string[] }): Promise<{ success: boolean }> {
    try {
        await prisma.product.update({ where: { id }, data: { description: updates.staffNotes } })
        return { success: true }
    } catch { return { success: false } }
}
