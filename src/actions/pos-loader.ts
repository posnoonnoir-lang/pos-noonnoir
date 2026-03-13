"use server"

import { prisma } from "@/lib/prisma"
import { getPosConfig } from "@/actions/pos-config"

/**
 * Consolidated initial data loader for POS page.
 * Split into 3 sequential batches to avoid exhausting connection pool.
 * Batch 1: Products + Categories (critical, display first)
 * Batch 2: Tables, Shift, 86, Tax, Settings (secondary)
 * Batch 3: Stock, Tabs, Notifications, Held orders, Push sale, Reservations, Config (background)
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

        // Batch 3 — Background data (stock + glass via Prisma, rest via function calls)
        const [wineStockCounts, glassStatuses] = await Promise.all([
            // Wine stock — single groupBy instead of N queries!
            prisma.wineBottle.groupBy({
                by: ["productId"],
                where: { status: "IN_STOCK" },
                _count: { id: true },
            }),
            // Glass statuses — opened bottles with remaining pours
            prisma.wineBottle.findMany({
                where: { status: "OPENED" },
                select: {
                    productId: true,
                    glassesRemaining: true,
                    product: { select: { glassesPerBottle: true } },
                },
            }),
        ])

        // Batch 4 — Parallel function calls for computed/in-memory data
        const { getOpenTabs } = await import("@/actions/tabs")
        const { getHeldOrders } = await import("@/actions/operational")
        const { getUnreadNotifications } = await import("@/actions/notifications")
        const { getPushSaleItems } = await import("@/actions/push-sale")
        const { getUpcomingReservations } = await import("@/actions/reservations")

        const [openTabs, heldOrders, notifications, pushSaleItems, reservations, posConfig] = await Promise.all([
            getOpenTabs(),
            getHeldOrders(),
            getUnreadNotifications(),
            getPushSaleItems(),
            getUpcomingReservations(),
            getPosConfig(),
        ])

        const elapsed = Date.now() - start
        if (elapsed > 3000) {
            console.warn(`[POS] Slow initial load: ${elapsed}ms`)
        }

        // Serialize wine stock map
        const wineStock: Record<string, number> = {}
        for (const s of wineStockCounts) {
            wineStock[s.productId] = s._count.id
        }

        // Serialize glass statuses: productId → { glassesRemaining, glassesTotal }
        const glassStatusMap: Record<string, { glassesRemaining: number; glassesTotal: number }> = {}
        for (const b of glassStatuses) {
            const total = b.product.glassesPerBottle ?? 6
            const remaining = b.glassesRemaining ?? 0
            const prev = glassStatusMap[b.productId]
            if (prev) {
                glassStatusMap[b.productId] = {
                    glassesRemaining: prev.glassesRemaining + remaining,
                    glassesTotal: prev.glassesTotal + total,
                }
            } else {
                glassStatusMap[b.productId] = { glassesRemaining: remaining, glassesTotal: total }
            }
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
                totalSales: shift.totalRevenue ? Number(shift.totalRevenue) : 0,
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
            // Batch 3+4 data — eliminates 8+ separate API calls
            wineStock,
            glassStatusMap,
            openTabs,
            heldOrders,
            notifications,
            pushSaleItems,
            upcomingReservations: reservations,
            paymentMode: posConfig?.paymentMode ?? "PAY_AFTER",
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
            wineStock: {} as Record<string, number>,
            glassStatusMap: {} as Record<string, { glassesRemaining: number; glassesTotal: number }>,
            openTabs: [],
            heldOrders: [],
            notifications: [],
            pushSaleItems: [],
            upcomingReservations: [],
            paymentMode: "PAY_AFTER",
        }
    }
}

