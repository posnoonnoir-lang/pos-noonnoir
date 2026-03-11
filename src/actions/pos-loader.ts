"use server"

import { prisma } from "@/lib/prisma"

/**
 * Consolidated initial data loader for POS page.
 * Batches 8+ separate DB queries into a single server action call
 * to avoid waterfall and reduce cold-start overhead.
 */
export async function getPOSInitialData() {
    const [
        products,
        categories,
        zones,
        tables,
        shift,
        out86Records,
        heldOrders,
        taxRate,
        storeSettings,
    ] = await Promise.all([
        // Products (active only)
        prisma.product.findMany({
            where: { isActive: true },
            include: { category: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
        // Categories (active only)
        prisma.category.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
        // Table zones
        prisma.tableZone.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
        }),
        // Floor tables
        prisma.floorTable.findMany({
            where: { isActive: true },
            orderBy: { tableNumber: "asc" },
        }),
        // Current open shift (join staff for name)
        prisma.shiftRecord.findFirst({
            where: { closedAt: null },
            orderBy: { openedAt: "desc" },
            include: { staff: { select: { fullName: true } } },
        }),
        // 86 out of stock — from audit log
        prisma.auditLog.findMany({
            where: {
                action: "MARK_86",
                tableName: "product",
            },
            select: { recordId: true },
        }),
        // Held orders — from audit log
        prisma.auditLog.findMany({
            where: {
                action: "HOLD_ORDER",
                tableName: "held_order",
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        }),
        // Default tax rate
        prisma.taxRate.findFirst({
            where: { isDefault: true, isActive: true },
        }),
        // Store settings (negative stock flag)
        prisma.storeSettings.findFirst(),
    ])

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

    const serializedTables = tables.map((t: any) => ({
        id: t.id,
        zoneId: t.zoneId,
        tableNumber: t.tableNumber,
        seats: t.seats,
        status: t.status,
        shape: t.shape,
        posX: t.posX,
        posY: t.posY,
        width: t.width ?? 80,
        height: t.height ?? 80,
        rotation: t.rotation ?? 0,
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
        out86Ids: out86Records.map((r) => r.recordId),
        taxRate: taxRate
            ? { id: taxRate.id, name: taxRate.name, rate: Number(taxRate.rate) }
            : null,
        allowNegativeStock: (storeSettings as any)?.allowNegativeStock ?? false,
    }
}
