"use server"

import { prisma } from "@/lib/prisma"

/**
 * Consolidated initial data loader for POS page.
 * Split into 2 sequential batches to avoid exhausting connection pool.
 * Batch 1: Products + Categories (critical, display first)
 * Batch 2: Tables, Shift, 86, Tax, Settings (secondary)
 */
export async function getPOSInitialData() {
    const start = Date.now()
    try {
        // Batch 1 — Critical data for product grid (highest priority)
        const [products, categories] = await Promise.all([
            prisma.product.findMany({
                where: { isActive: true },
                include: { category: true },
                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            }),
            prisma.category.findMany({
                where: { isActive: true },
                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            }),
        ])

        // Batch 2 — Secondary data (tables, shift, etc.)
        const [zones, tables, shift, out86Records, taxRate, storeSettings] = await Promise.all([
            prisma.tableZone.findMany({
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
            }),
            prisma.floorTable.findMany({
                where: { isActive: true },
                orderBy: { tableNumber: "asc" },
            }),
            prisma.shiftRecord.findFirst({
                where: { closedAt: null },
                orderBy: { openedAt: "desc" },
                include: { staff: { select: { fullName: true } } },
            }),
            prisma.out86.findMany({
                select: { productId: true },
            }),
            prisma.taxRate.findFirst({
                where: { isDefault: true, isActive: true },
            }),
            prisma.storeSettings.findFirst(),
        ])

        const elapsed = Date.now() - start
        if (elapsed > 3000) {
            console.warn(`[POS] Slow initial load: ${elapsed}ms`)
        }

        // Serialize Decimal/Date fields for client consumption
        const serializedProducts = products.map((p: any) => ({
            id: p.id,
            name: p.name,
            nameVi: p.nameVi,
            sku: p.sku,
            categoryId: p.categoryId,
            type: p.type,
            vintage: p.vintage,
            appellation: p.appellation,
            grapeVariety: p.grapeVariety,
            country: p.country,
            region: p.region,
            alcoholPct: p.alcoholPct ? Number(p.alcoholPct) : null,
            tastingNotes: p.tastingNotes,
            costPrice: Number(p.costPrice),
            sellPrice: Number(p.sellPrice),
            glassPrice: p.glassPrice ? Number(p.glassPrice) : null,
            isByGlass: p.isByGlass,
            glassesPerBottle: p.glassesPerBottle,
            tastingPortions: p.tastingPortions,
            servingTemp: p.servingTemp,
            decantingTime: p.decantingTime,
            glassType: p.glassType,
            oxidationHours: p.oxidationHours ?? null,
            trackInventory: p.trackInventory,
            lowStockAlert: p.lowStockAlert,
            imageUrl: p.imageUrl,
            description: p.description,
            isActive: p.isActive,
            sortOrder: p.sortOrder,
        }))

        const serializedCategories = categories.map((c) => ({
            id: c.id,
            name: c.name,
            nameVi: c.nameVi,
            icon: c.icon,
            sortOrder: c.sortOrder,
            isActive: c.isActive,
        }))

        const serializedZones = zones.map((z) => ({
            id: z.id,
            name: z.name,
            sortOrder: z.sortOrder,
            isActive: z.isActive,
        }))

        const serializedTables = tables.map((t) => ({
            id: t.id,
            zoneId: t.zoneId,
            tableNumber: t.tableNumber,
            seats: t.seats,
            status: t.status,
            shape: t.shape,
            posX: t.posX,
            posY: t.posY,
            width: t.width,
            height: t.height,
            rotation: t.rotation,
            mergedIntoId: t.mergedIntoId,
            isActive: t.isActive,
        }))

        const serializedShift = shift
            ? {
                id: shift.id,
                staffId: shift.staffId,
                staffName: shift.staff.fullName,
                openingCash: Number(shift.openingCash),
                closingCash: shift.closingCash ? Number(shift.closingCash) : null,
                expectedCash: shift.expectedCash ? Number(shift.expectedCash) : null,
                variance: shift.variance ? Number(shift.variance) : null,
                totalRevenue: shift.totalRevenue ? Number(shift.totalRevenue) : null,
                status: shift.closedAt ? "CLOSED" : "OPEN",
                openedAt: shift.openedAt.toISOString(),
                closedAt: shift.closedAt?.toISOString() ?? null,
            }
            : null

        return {
            products: serializedProducts,
            categories: serializedCategories,
            zones: serializedZones,
            tables: serializedTables,
            currentShift: serializedShift,
            out86Ids: out86Records.map((r) => r.productId),
            taxRate: taxRate
                ? { id: taxRate.id, name: taxRate.name, rate: Number(taxRate.rate) }
                : null,
            allowNegativeStock: storeSettings?.allowNegativeStock ?? false,
        }
    } catch (error) {
        console.error("[getPOSInitialData] Error:", error)
        return {
            products: [],
            categories: [],
            zones: [],
            tables: [],
            currentShift: null,
            out86Ids: [],
            taxRate: null,
            allowNegativeStock: false,
        }
    }
}
