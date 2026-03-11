"use server"

import { prisma } from "@/lib/prisma"

// ============================================================
// WINE BOTTLE & GLASS TRACKING — Prisma version
// ============================================================

export type BottleStatus = "IN_STOCK" | "OPENED" | "SOLD" | "RETURNED" | "DAMAGED"
export type BottleSource = "PURCHASED" | "CONSIGNED"

export type WineBottle = {
    id: string; productId: string; productName: string; batchCode: string
    status: BottleStatus; source: BottleSource
    supplierId: string | null; supplierName: string | null
    costPrice: number; glassesPoured: number; glassesTotal: number
    openedAt: Date | null; openedBy: string | null; soldAt: Date | null
    notes: string | null; receivedAt: Date; expiresAt: Date | null
}

export type GlassStatus = {
    productId: string; productName: string
    currentBottle: WineBottle | null
    glassesPoured: number; glassesTotal: number; glassesRemaining: number
    bottlesInStock: number; bottlesOpened: number
}

function toWineBottle(b: Record<string, unknown> & { id: string; productId: string; batchCode?: string | null; ownershipType: string; status: string; costPrice?: unknown; glassesRemaining?: number | null; openedAt?: Date | null; soldAt?: Date | null; receivedAt: Date; product?: { name: string; glassesPerBottle?: number }; consignment?: { supplier?: { id: string; name: string } } | null }): WineBottle {
    const glassesTotal = b.product?.glassesPerBottle ?? b.glassesRemaining ?? 0
    const glassesPoured = glassesTotal - (b.glassesRemaining ?? 0)
    return {
        id: b.id, productId: b.productId, productName: b.product?.name ?? "",
        batchCode: b.batchCode ?? "", status: b.status as BottleStatus,
        source: b.ownershipType as BottleSource,
        supplierId: b.consignment?.supplier?.id ?? null,
        supplierName: b.consignment?.supplier?.name ?? null,
        costPrice: Number(b.costPrice ?? 0), glassesPoured, glassesTotal,
        openedAt: b.openedAt, openedBy: null, soldAt: b.soldAt,
        notes: null, receivedAt: b.receivedAt, expiresAt: null,
    }
}

export async function getGlassStatus(productId: string): Promise<GlassStatus | null> {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product || !product.isByGlass) return null

    const allBottles = await prisma.wineBottle.findMany({
        where: { productId },
        include: { product: true, consignment: { include: { supplier: true } } },
        orderBy: { receivedAt: "asc" },
    })

    const openedBottle = allBottles.find((b) => b.status === "OPENED")
    const inStock = allBottles.filter((b) => b.status === "IN_STOCK").length
    const openedCount = allBottles.filter((b) => b.status === "OPENED").length
    const glassesTotal = product.glassesPerBottle
    const glassesPoured = openedBottle ? glassesTotal - (openedBottle.glassesRemaining ?? 0) : 0
    const glassesRemaining = openedBottle ? (openedBottle.glassesRemaining ?? 0) : 0

    return {
        productId, productName: product.name,
        currentBottle: openedBottle ? toWineBottle(openedBottle as Parameters<typeof toWineBottle>[0]) : null,
        glassesPoured, glassesTotal, glassesRemaining,
        bottlesInStock: inStock, bottlesOpened: openedCount,
    }
}

export async function getAllGlassStatuses(): Promise<Record<string, GlassStatus>> {
    const products = await prisma.product.findMany({ where: { isByGlass: true, isActive: true } })
    const result: Record<string, GlassStatus> = {}
    for (const p of products) {
        const s = await getGlassStatus(p.id)
        if (s) result[p.id] = s
    }
    return result
}

export async function sellWineGlass(params: {
    productId: string; quantity: number; staffName: string
}): Promise<{
    success: boolean; glassesSold: number; bottlesConsumed: string[]
    newBottleOpened: WineBottle | null; currentStatus: GlassStatus | null; error?: string
}> {
    try {
        const product = await prisma.product.findUnique({ where: { id: params.productId } })
        if (!product) return { success: false, glassesSold: 0, bottlesConsumed: [], newBottleOpened: null, currentStatus: null, error: "Product not found" }

        let remaining = params.quantity
        let glassesSold = 0
        const bottlesConsumed: string[] = []
        let newBottleOpened: WineBottle | null = null

        while (remaining > 0) {
            let openBottle = await prisma.wineBottle.findFirst({ where: { productId: params.productId, status: "OPENED" } })

            if (!openBottle) {
                const nextBottle = await prisma.wineBottle.findFirst({
                    where: { productId: params.productId, status: "IN_STOCK" },
                    orderBy: { receivedAt: "asc" },
                })
                if (!nextBottle) break

                openBottle = await prisma.wineBottle.update({
                    where: { id: nextBottle.id },
                    data: { status: "OPENED", openedAt: new Date(), glassesRemaining: product.glassesPerBottle },
                })
                const full = await prisma.wineBottle.findFirst({ where: { id: openBottle.id }, include: { product: true, consignment: { include: { supplier: true } } } })
                newBottleOpened = toWineBottle(full as Parameters<typeof toWineBottle>[0])
            }

            const canPour = Math.min(remaining, openBottle.glassesRemaining ?? 0)
            if (canPour <= 0) break

            const newRemaining = (openBottle.glassesRemaining ?? 0) - canPour
            await prisma.wineBottle.update({
                where: { id: openBottle.id },
                data: { glassesRemaining: newRemaining, ...(newRemaining <= 0 ? { status: "SOLD", soldAt: new Date() } : {}) },
            })

            if (newRemaining <= 0) bottlesConsumed.push(openBottle.id)
            glassesSold += canPour
            remaining -= canPour
        }

        const currentStatus = await getGlassStatus(params.productId)
        return { success: true, glassesSold, bottlesConsumed, newBottleOpened, currentStatus }
    } catch (e) {
        return { success: false, glassesSold: 0, bottlesConsumed: [], newBottleOpened: null, currentStatus: null, error: (e as Error).message }
    }
}

export async function sellWineBottle(params: {
    productId: string; quantity: number
}): Promise<{ success: boolean; bottlesSold: string[]; error?: string }> {
    try {
        const bottles = await prisma.wineBottle.findMany({
            where: { productId: params.productId, status: "IN_STOCK" },
            orderBy: { receivedAt: "asc" },
            take: params.quantity,
        })
        if (bottles.length < params.quantity) return { success: false, bottlesSold: [], error: `Only ${bottles.length} bottles in stock` }

        const ids = bottles.map((b) => b.id)
        await prisma.wineBottle.updateMany({ where: { id: { in: ids } }, data: { status: "SOLD", soldAt: new Date() } })
        return { success: true, bottlesSold: ids }
    } catch (e) {
        return { success: false, bottlesSold: [], error: (e as Error).message }
    }
}

export async function getBottlesByProduct(productId: string): Promise<WineBottle[]> {
    const rows = await prisma.wineBottle.findMany({
        where: { productId },
        include: { product: true, consignment: { include: { supplier: true } } },
        orderBy: { receivedAt: "desc" },
    })
    return rows.map((r) => toWineBottle(r as Parameters<typeof toWineBottle>[0]))
}

export async function getAllBottles(): Promise<WineBottle[]> {
    const rows = await prisma.wineBottle.findMany({
        include: { product: true, consignment: { include: { supplier: true } } },
        orderBy: { receivedAt: "desc" },
    })
    return rows.map((r) => toWineBottle(r as Parameters<typeof toWineBottle>[0]))
}

export async function getBottleStats() {
    const bottles = await prisma.wineBottle.findMany()
    return {
        total: bottles.length,
        inStock: bottles.filter((b) => b.status === "IN_STOCK").length,
        opened: bottles.filter((b) => b.status === "OPENED").length,
        sold: bottles.filter((b) => b.status === "SOLD").length,
        damaged: bottles.filter((b) => b.status === "DAMAGED").length,
    }
}
