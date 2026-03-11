"use server"

import { prisma } from "@/lib/prisma"

// ============================================================
// WINE BOTTLE & GLASS TRACKING — Full Bottle Management System
// ============================================================

export type BottleStatus = "IN_STOCK" | "OPENED" | "SOLD" | "RETURNED" | "DAMAGED"
export type BottleSource = "PURCHASED" | "CONSIGNED"

export type WineBottle = {
    id: string; productId: string; productName: string; batchCode: string
    status: BottleStatus; source: BottleSource
    supplierId: string | null; supplierName: string | null
    costPrice: number; glassesPoured: number; glassesTotal: number
    glassesRemaining: number
    openedAt: Date | null; openedBy: string | null; openedByName: string | null
    soldAt: Date | null
    notes: string | null; receivedAt: Date; expiresAt: Date | null
    // Computed tracking fields
    oxidationHours: number | null
    maxOxidationHours: number | null
    isExpired: boolean
    revenuePerGlass: number
    totalRevenue: number
    sellSpeedPerHour: number | null
}

export type GlassStatus = {
    productId: string; productName: string
    currentBottle: WineBottle | null
    glassesPoured: number; glassesTotal: number; glassesRemaining: number
    bottlesInStock: number; bottlesOpened: number
}

export type OpenedBottleSummary = {
    id: string
    productId: string
    productName: string
    batchCode: string
    glassesRemaining: number
    glassesTotal: number
    glassesPoured: number
    openedAt: Date
    openedByName: string | null
    oxidationHours: number
    maxOxidationHours: number
    isExpired: boolean
    sellSpeedPerHour: number
    glassPrice: number
    estimatedRevenueRemaining: number
}

function toWineBottle(b: Record<string, unknown> & {
    id: string; productId: string; batchCode?: string | null;
    ownershipType: string; status: string; costPrice?: unknown;
    glassesRemaining?: number | null; openedAt?: Date | null;
    openedBy?: string | null; soldAt?: Date | null; receivedAt: Date;
    product?: { name: string; glassesPerBottle?: number; glassPrice?: unknown; oxidationHours?: number | null };
    consignment?: { supplier?: { id: string; name: string } } | null;
    openedByStaff?: { fullName: string } | null
}): WineBottle {
    const glassesTotal = b.product?.glassesPerBottle ?? b.glassesRemaining ?? 0
    const glassesRem = b.glassesRemaining ?? 0
    const glassesPoured = glassesTotal - glassesRem
    const glassPrice = Number(b.product?.glassPrice ?? 0)
    const maxOx = b.product?.oxidationHours ?? null

    // Calculate oxidation
    let oxidationHours: number | null = null
    let isExpired = false
    if (b.openedAt && b.status === "OPENED") {
        oxidationHours = Math.round((Date.now() - new Date(b.openedAt).getTime()) / 3600000 * 10) / 10
        if (maxOx && oxidationHours > maxOx) isExpired = true
    }

    // Sell speed
    let sellSpeedPerHour: number | null = null
    if (b.openedAt && glassesPoured > 0) {
        const hoursOpen = (Date.now() - new Date(b.openedAt).getTime()) / 3600000
        if (hoursOpen > 0) sellSpeedPerHour = Math.round(glassesPoured / hoursOpen * 10) / 10
    }

    return {
        id: b.id, productId: b.productId, productName: b.product?.name ?? "",
        batchCode: b.batchCode ?? "", status: b.status as BottleStatus,
        source: b.ownershipType as BottleSource,
        supplierId: b.consignment?.supplier?.id ?? null,
        supplierName: b.consignment?.supplier?.name ?? null,
        costPrice: Number(b.costPrice ?? 0),
        glassesPoured, glassesTotal, glassesRemaining: glassesRem,
        openedAt: b.openedAt ?? null,
        openedBy: (b.openedBy as string | null) ?? null,
        openedByName: b.openedByStaff?.fullName ?? null,
        soldAt: b.soldAt ?? null,
        notes: null, receivedAt: b.receivedAt, expiresAt: null,
        oxidationHours, maxOxidationHours: maxOx, isExpired,
        revenuePerGlass: glassPrice,
        totalRevenue: glassesPoured * glassPrice,
        sellSpeedPerHour,
    }
}

// ============================================================
// GLASS STATUS
// ============================================================

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

// ============================================================
// BOTTLE MANAGEMENT — Open, Pour, Close
// ============================================================

// Manually open a bottle (staff action from POS)
export async function openBottle(params: {
    bottleId: string; staffId: string
}): Promise<{ success: boolean; bottle: WineBottle | null; error?: string }> {
    try {
        const bottle = await prisma.wineBottle.findUnique({
            where: { id: params.bottleId },
            include: { product: true },
        })
        if (!bottle) return { success: false, bottle: null, error: "Không tìm thấy chai" }
        if (bottle.status !== "IN_STOCK") return { success: false, bottle: null, error: `Chai đang ở trạng thái: ${bottle.status}` }

        const updated = await prisma.wineBottle.update({
            where: { id: params.bottleId },
            data: {
                status: "OPENED",
                openedAt: new Date(),
                openedBy: params.staffId,
                glassesRemaining: bottle.product.glassesPerBottle,
            },
            include: { product: true, consignment: { include: { supplier: true } } },
        })

        return { success: true, bottle: toWineBottle(updated as Parameters<typeof toWineBottle>[0]) }
    } catch (e) {
        return { success: false, bottle: null, error: (e as Error).message }
    }
}

// Pour from a specific bottle (used in POS glass selling)
export async function pourFromBottle(params: {
    bottleId: string; glasses: number; staffId: string
}): Promise<{ success: boolean; glassesPoured: number; bottleFinished: boolean; error?: string }> {
    try {
        const bottle = await prisma.wineBottle.findUnique({
            where: { id: params.bottleId },
            include: { consignment: true },
        })
        if (!bottle) return { success: false, glassesPoured: 0, bottleFinished: false, error: "Không tìm thấy chai" }
        if (bottle.status !== "OPENED") return { success: false, glassesPoured: 0, bottleFinished: false, error: "Chai chưa được mở" }

        const remaining = bottle.glassesRemaining ?? 0
        if (remaining < params.glasses) return { success: false, glassesPoured: 0, bottleFinished: false, error: `Chỉ còn ${remaining} ly` }

        const newRemaining = remaining - params.glasses
        const bottleFinished = newRemaining <= 0

        await prisma.wineBottle.update({
            where: { id: params.bottleId },
            data: {
                glassesRemaining: newRemaining,
                ...(bottleFinished ? { status: "SOLD", soldAt: new Date() } : {}),
            },
        })

        // GAP-12 fix: Update consignment tracking when bottle finishes
        if (bottleFinished && bottle.consignmentId && bottle.ownershipType === "CONSIGNED") {
            await prisma.consignment.update({
                where: { id: bottle.consignmentId },
                data: { soldBottles: { increment: 1 } },
            })
        }

        return { success: true, glassesPoured: params.glasses, bottleFinished }
    } catch (e) {
        return { success: false, glassesPoured: 0, bottleFinished: false, error: (e as Error).message }
    }
}

// Get all opened bottles for a product (for POS bottle selector)
export async function getOpenedBottlesForProduct(productId: string): Promise<OpenedBottleSummary[]> {
    const bottles = await prisma.wineBottle.findMany({
        where: { productId, status: "OPENED" },
        include: { product: true },
        orderBy: { openedAt: "asc" },
    })

    // Get staff names for opened bottles
    const staffIds = bottles.map(b => b.openedBy).filter(Boolean) as string[]
    const staffMap = new Map<string, string>()
    if (staffIds.length > 0) {
        const staffList = await prisma.staff.findMany({
            where: { id: { in: staffIds } },
            select: { id: true, fullName: true },
        })
        staffList.forEach(s => staffMap.set(s.id, s.fullName))
    }

    return bottles.map(b => {
        const glassesTotal = b.product.glassesPerBottle
        const glassesRem = b.glassesRemaining ?? 0
        const glassesPoured = glassesTotal - glassesRem
        const openedAt = b.openedAt ?? new Date()
        const hoursOpen = (Date.now() - openedAt.getTime()) / 3600000
        const maxOx = b.product.oxidationHours ?? 48
        const sellSpeed = hoursOpen > 0 ? Math.round(glassesPoured / hoursOpen * 10) / 10 : 0
        const glassPrice = Number(b.product.glassPrice ?? 0)

        return {
            id: b.id,
            productId: b.productId,
            productName: b.product.name,
            batchCode: b.batchCode ?? "",
            glassesRemaining: glassesRem,
            glassesTotal,
            glassesPoured,
            openedAt,
            openedByName: b.openedBy ? (staffMap.get(b.openedBy) ?? null) : null,
            oxidationHours: Math.round(hoursOpen * 10) / 10,
            maxOxidationHours: maxOx,
            isExpired: hoursOpen > maxOx,
            sellSpeedPerHour: sellSpeed,
            glassPrice,
            estimatedRevenueRemaining: glassesRem * glassPrice,
        }
    })
}

// Get all IN_STOCK bottles for a product (for opening)
export async function getInStockBottlesForProduct(productId: string) {
    const bottles = await prisma.wineBottle.findMany({
        where: { productId, status: "IN_STOCK" },
        include: { product: true },
        orderBy: { receivedAt: "asc" },
    })
    return bottles.map(b => ({
        id: b.id,
        productId: b.productId,
        productName: b.product.name,
        batchCode: b.batchCode ?? "",
        costPrice: Number(b.costPrice ?? 0),
        receivedAt: b.receivedAt,
    }))
}

// ============================================================
// GLASS SELLING — from specific bottles in POS
// ============================================================

export async function sellWineGlass(params: {
    productId: string; quantity: number; staffName: string; bottleId?: string
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
            // If specific bottle requested, use that first
            let openBottle = params.bottleId
                ? await prisma.wineBottle.findFirst({ where: { id: params.bottleId, status: "OPENED" } })
                : await prisma.wineBottle.findFirst({ where: { productId: params.productId, status: "OPENED" }, orderBy: { openedAt: "asc" } })

            if (!openBottle) {
                const nextBottle = await prisma.wineBottle.findFirst({
                    where: { productId: params.productId, status: "IN_STOCK" },
                    orderBy: { receivedAt: "asc" },
                })
                if (!nextBottle) break

                // Get staffId from name for tracking
                const staff = await prisma.staff.findFirst({ where: { fullName: { contains: params.staffName } } })

                openBottle = await prisma.wineBottle.update({
                    where: { id: nextBottle.id },
                    data: {
                        status: "OPENED",
                        openedAt: new Date(),
                        openedBy: staff?.id ?? null,
                        glassesRemaining: product.glassesPerBottle,
                    },
                })
                const full = await prisma.wineBottle.findFirst({
                    where: { id: openBottle.id },
                    include: { product: true, consignment: { include: { supplier: true } } },
                })
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

// ============================================================
// BOTTLE TRACKING DASHBOARD
// ============================================================

export async function getAllOpenedBottles(): Promise<OpenedBottleSummary[]> {
    const bottles = await prisma.wineBottle.findMany({
        where: { status: "OPENED" },
        include: { product: true },
        orderBy: { openedAt: "asc" },
    })

    const staffIds = bottles.map(b => b.openedBy).filter(Boolean) as string[]
    const staffMap = new Map<string, string>()
    if (staffIds.length > 0) {
        const staffList = await prisma.staff.findMany({
            where: { id: { in: staffIds } },
            select: { id: true, fullName: true },
        })
        staffList.forEach(s => staffMap.set(s.id, s.fullName))
    }

    return bottles.map(b => {
        const glassesTotal = b.product.glassesPerBottle
        const glassesRem = b.glassesRemaining ?? 0
        const glassesPoured = glassesTotal - glassesRem
        const openedAt = b.openedAt ?? new Date()
        const hoursOpen = (Date.now() - openedAt.getTime()) / 3600000
        const maxOx = b.product.oxidationHours ?? 48
        const sellSpeed = hoursOpen > 0.1 ? Math.round(glassesPoured / hoursOpen * 10) / 10 : 0
        const glassPrice = Number(b.product.glassPrice ?? 0)

        return {
            id: b.id,
            productId: b.productId,
            productName: b.product.name,
            batchCode: b.batchCode ?? "",
            glassesRemaining: glassesRem,
            glassesTotal,
            glassesPoured,
            openedAt,
            openedByName: b.openedBy ? (staffMap.get(b.openedBy) ?? null) : null,
            oxidationHours: Math.round(hoursOpen * 10) / 10,
            maxOxidationHours: maxOx,
            isExpired: hoursOpen > maxOx,
            sellSpeedPerHour: sellSpeed,
            glassPrice,
            estimatedRevenueRemaining: glassesRem * glassPrice,
        }
    })
}

export async function getBottleHistory(params?: { productId?: string; days?: number }) {
    const where: Record<string, unknown> = { status: { in: ["SOLD", "OPENED", "DAMAGED"] } }
    if (params?.productId) where.productId = params.productId
    if (params?.days) where.openedAt = { gte: new Date(Date.now() - params.days * 86400000) }

    const bottles = await prisma.wineBottle.findMany({
        where,
        include: { product: true },
        orderBy: { openedAt: "desc" },
        take: 50,
    })

    const staffIds = bottles.map(b => b.openedBy).filter(Boolean) as string[]
    const staffMap = new Map<string, string>()
    if (staffIds.length > 0) {
        const staffList = await prisma.staff.findMany({
            where: { id: { in: staffIds } },
            select: { id: true, fullName: true },
        })
        staffList.forEach(s => staffMap.set(s.id, s.fullName))
    }

    return bottles.map(b => {
        const glassesTotal = b.product.glassesPerBottle
        const glassesPoured = glassesTotal - (b.glassesRemaining ?? 0)
        const openedAt = b.openedAt ? new Date(b.openedAt) : null
        const soldAt = b.soldAt ? new Date(b.soldAt) : null
        const duration = openedAt && soldAt ? (soldAt.getTime() - openedAt.getTime()) / 3600000 : null
        const glassPrice = Number(b.product.glassPrice ?? 0)

        return {
            id: b.id,
            productName: b.product.name,
            batchCode: b.batchCode ?? "",
            status: b.status,
            openedAt,
            soldAt,
            openedByName: b.openedBy ? (staffMap.get(b.openedBy) ?? null) : null,
            glassesPoured,
            glassesTotal,
            durationHours: duration ? Math.round(duration * 10) / 10 : null,
            revenue: glassesPoured * glassPrice,
            costPrice: Number(b.costPrice ?? 0),
            profit: glassesPoured * glassPrice - Number(b.costPrice ?? 0),
        }
    })
}

export async function getByGlassDashboardStats() {
    const allBottles = await prisma.wineBottle.findMany({
        include: { product: true },
    })

    const opened = allBottles.filter(b => b.status === "OPENED")
    const sold = allBottles.filter(b => b.status === "SOLD" && b.openedAt)

    // Revenue from sold bottles (glass sales)
    let totalGlassRevenue = 0
    let totalGlassCost = 0
    let totalGlassesSoldAll = 0
    for (const b of sold) {
        const glassesSold = b.product.glassesPerBottle - (b.glassesRemaining ?? 0)
        totalGlassesSoldAll += glassesSold
        totalGlassRevenue += glassesSold * Number(b.product.glassPrice ?? 0)
        totalGlassCost += Number(b.costPrice ?? 0)
    }

    // Currently opened
    let currentlyOpenedRevenue = 0
    let currentlyOpenedGlasses = 0
    let expiredCount = 0
    for (const b of opened) {
        const glassesRem = b.glassesRemaining ?? 0
        const glassesPoured = b.product.glassesPerBottle - glassesRem
        currentlyOpenedGlasses += glassesPoured
        currentlyOpenedRevenue += glassesPoured * Number(b.product.glassPrice ?? 0)
        if (b.openedAt) {
            const hoursOpen = (Date.now() - new Date(b.openedAt).getTime()) / 3600000
            if (b.product.oxidationHours && hoursOpen > b.product.oxidationHours) expiredCount++
        }
    }

    // Average sell speed
    const avgSellSpeeds: number[] = []
    for (const b of sold) {
        if (b.openedAt && b.soldAt) {
            const hours = (b.soldAt.getTime() - b.openedAt.getTime()) / 3600000
            const glasses = b.product.glassesPerBottle - (b.glassesRemaining ?? 0)
            if (hours > 0) avgSellSpeeds.push(glasses / hours)
        }
    }
    const avgSpeed = avgSellSpeeds.length > 0 ? avgSellSpeeds.reduce((a, b) => a + b, 0) / avgSellSpeeds.length : 0

    return {
        openedBottles: opened.length,
        expiredBottles: expiredCount,
        totalGlassesSold: totalGlassesSoldAll + currentlyOpenedGlasses,
        totalGlassRevenue: totalGlassRevenue + currentlyOpenedRevenue,
        totalGlassCost,
        profit: totalGlassRevenue + currentlyOpenedRevenue - totalGlassCost,
        avgSellSpeedPerHour: Math.round(avgSpeed * 10) / 10,
        bottlesConsumed: sold.length,
    }
}

// ============================================================
// LEGACY EXPORTS (backward compatibility)
// ============================================================

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

// ============================================================
// GAP-04: WINE FLIGHT / TASTING
// ============================================================

/**
 * Sell a wine tasting portion (smaller than a glass, ~60ml vs 150ml).
 * Uses tastingPortions config on Product instead of glassesPerBottle.
 * 1 bottle = tastingPortions tastings (default 12).
 */
export async function sellWineTasting(params: {
    productId: string
    portions: number
    staffId: string
    bottleId?: string
}): Promise<{
    success: boolean
    portionsSold: number
    bottlesConsumed: string[]
    error?: string
}> {
    try {
        const product = await prisma.product.findUnique({ where: { id: params.productId } })
        if (!product) return { success: false, portionsSold: 0, bottlesConsumed: [], error: "Sản phẩm không tồn tại" }
        if (product.type !== "WINE_TASTING" && product.type !== "WINE_GLASS") {
            return { success: false, portionsSold: 0, bottlesConsumed: [], error: "Sản phẩm không phải loại tasting" }
        }

        const tastingPerBottle = product.tastingPortions > 0 ? product.tastingPortions : 12
        let remaining = params.portions
        let sold = 0
        const consumed: string[] = []

        // Use specific bottle if provided
        if (params.bottleId) {
            const bottle = await prisma.wineBottle.findUnique({ where: { id: params.bottleId } })
            if (!bottle || bottle.status !== "OPENED") {
                return { success: false, portionsSold: 0, bottlesConsumed: [], error: "Chai không khả dụng" }
            }
            const available = bottle.glassesRemaining ?? 0
            // Convert: tastings use smaller portions, so multiply available glasses
            // If bottle has 4 glasses remaining (150ml each) = roughly 10 tastings (60ml each)
            const tastingsAvailable = Math.floor((available / product.glassesPerBottle) * tastingPerBottle)
            const pour = Math.min(remaining, tastingsAvailable > 0 ? tastingsAvailable : available)

            // Deduct: 1 tasting = (glassesPerBottle / tastingPerBottle) glasses
            const glassEquivalent = (pour / tastingPerBottle) * product.glassesPerBottle
            const newRemaining = Math.max(0, available - Math.ceil(glassEquivalent))
            const finished = newRemaining <= 0

            await prisma.wineBottle.update({
                where: { id: params.bottleId },
                data: {
                    glassesRemaining: newRemaining,
                    status: finished ? "SOLD" : "OPENED",
                },
            })

            sold += pour
            remaining -= pour
            if (finished) consumed.push(params.bottleId)
        }

        // Auto-pour from oldest opened bottles
        while (remaining > 0) {
            const bottle = await prisma.wineBottle.findFirst({
                where: { productId: params.productId, status: "OPENED", glassesRemaining: { gt: 0 } },
                orderBy: { openedAt: "asc" },
            })
            if (!bottle) break

            const available = bottle.glassesRemaining ?? 0
            const tastingsAvailable = Math.floor((available / product.glassesPerBottle) * tastingPerBottle)
            const pour = Math.min(remaining, Math.max(tastingsAvailable, 1))
            const glassEquivalent = (pour / tastingPerBottle) * product.glassesPerBottle
            const newRemaining = Math.max(0, available - Math.ceil(glassEquivalent))
            const finished = newRemaining <= 0

            await prisma.wineBottle.update({
                where: { id: bottle.id },
                data: {
                    glassesRemaining: newRemaining,
                    status: finished ? "SOLD" : "OPENED",
                },
            })

            sold += pour
            remaining -= pour
            if (finished) consumed.push(bottle.id)
        }

        return { success: true, portionsSold: sold, bottlesConsumed: consumed }
    } catch (e) {
        console.error("sellWineTasting error:", e)
        return { success: false, portionsSold: 0, bottlesConsumed: [], error: "Lỗi bán tasting" }
    }
}

/**
 * Create a wine flight (combo of tastings from multiple wines).
 * Each flight is a set of tasting pour from different products.
 */
export async function createWineFlight(params: {
    wineProductIds: string[]  // Array of product IDs to taste
    portionsPerWine: number   // Usually 1 portion of each
    staffId: string
}): Promise<{
    success: boolean
    results: Array<{ productId: string; productName: string; portionsSold: number; error?: string }>
    totalPortions: number
    error?: string
}> {
    try {
        if (params.wineProductIds.length < 2) {
            return { success: false, results: [], totalPortions: 0, error: "Flight cần ít nhất 2 loại rượu" }
        }
        if (params.wineProductIds.length > 6) {
            return { success: false, results: [], totalPortions: 0, error: "Flight tối đa 6 loại rượu" }
        }

        const results: Array<{ productId: string; productName: string; portionsSold: number; error?: string }> = []
        let total = 0

        for (const productId of params.wineProductIds) {
            const product = await prisma.product.findUnique({ where: { id: productId } })
            if (!product) {
                results.push({ productId, productName: "Unknown", portionsSold: 0, error: "Không tìm thấy" })
                continue
            }

            const res = await sellWineTasting({
                productId,
                portions: params.portionsPerWine,
                staffId: params.staffId,
            })

            results.push({
                productId,
                productName: product.name,
                portionsSold: res.portionsSold,
                error: res.error,
            })
            total += res.portionsSold
        }

        return { success: true, results, totalPortions: total }
    } catch (e) {
        console.error("createWineFlight error:", e)
        return { success: false, results: [], totalPortions: 0, error: "Lỗi tạo flight" }
    }
}

/**
 * Get available wines for flight/tasting selection.
 * Returns wines that have opened bottles with remaining portions.
 */
export async function getFlightOptions(): Promise<Array<{
    productId: string
    productName: string
    tastingPortions: number
    availableTastings: number
    openedBottles: number
    glassPrice: number
    tastingPrice: number
}>> {
    const products = await prisma.product.findMany({
        where: {
            isActive: true,
            type: { in: ["WINE_GLASS", "WINE_TASTING"] },
        },
    })

    const result = []
    for (const p of products) {
        const openBottles = await prisma.wineBottle.findMany({
            where: { productId: p.id, status: "OPENED", glassesRemaining: { gt: 0 } },
        })

        if (openBottles.length === 0) continue

        const tastingPerBottle = p.tastingPortions > 0 ? p.tastingPortions : 12
        const totalGlassesRemaining = openBottles.reduce((s, b) => s + (b.glassesRemaining ?? 0), 0)
        const availableTastings = Math.floor((totalGlassesRemaining / Math.max(p.glassesPerBottle, 1)) * tastingPerBottle)
        const glassPrice = Number(p.glassPrice ?? 0)
        // Tasting price = glass price × (glass size / tasting size) ≈ glass price × 0.4
        const tastingPrice = Math.round(glassPrice * (p.glassesPerBottle / Math.max(tastingPerBottle, 1)))

        result.push({
            productId: p.id,
            productName: p.name,
            tastingPortions: tastingPerBottle,
            availableTastings,
            openedBottles: openBottles.length,
            glassPrice,
            tastingPrice,
        })
    }

    return result
}
