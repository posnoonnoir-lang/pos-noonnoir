"use server"

import { prisma } from "@/lib/prisma"

/**
 * Consolidated Tables page data loader.
 * Replaces 4 separate calls: getZones, getTables, getTableStats, getActiveOrders
 * into a single batched Promise.all.
 */
export async function getTablesPageData(zoneId?: string) {
    try {
        const [zones, tables, activeOrders] = await Promise.all([
            // Zones
            prisma.tableZone.findMany({
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
            }),
            // Tables (with zone name for display)
            prisma.floorTable.findMany({
                where: {
                    isActive: true,
                    ...(zoneId ? { zoneId } : {}),
                },
                include: { zone: { select: { name: true } } },
                orderBy: { tableNumber: "asc" },
            }),
            // Active orders — only fields needed for table overlay
            prisma.order.findMany({
                where: {
                    status: { in: ["OPEN", "PREPARING", "SERVED"] },
                    tableId: { not: null },
                },
                select: {
                    id: true,
                    orderNo: true,
                    tableId: true,
                    totalAmount: true,
                    createdAt: true,
                    items: { select: { id: true } },
                },
            }),
        ])

        // Compute stats from tables array (no extra DB call)
        const stats = {
            total: tables.length,
            available: tables.filter((t) => t.status === "AVAILABLE").length,
            occupied: tables.filter((t) => t.status === "OCCUPIED").length,
            reserved: tables.filter((t) => t.status === "RESERVED").length,
            cleaning: tables.filter((t) => t.status === "CLEANING").length,
        }

        // Build active order map keyed by tableId
        const activeOrderMap: Record<string, {
            orderNo: string
            total: number
            createdAt: string
            itemCount: number
        }> = {}
        for (const order of activeOrders) {
            if (order.tableId) {
                activeOrderMap[order.tableId] = {
                    orderNo: order.orderNo,
                    total: Number(order.totalAmount),
                    createdAt: order.createdAt.toISOString(),
                    itemCount: order.items.length,
                }
            }
        }

        // Serialize tables
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
            zone: t.zone ? { name: t.zone.name } : null,
        }))

        const serializedZones = zones.map((z) => ({
            id: z.id,
            name: z.name,
            sortOrder: z.sortOrder,
            isActive: z.isActive,
            layoutData: z.layoutData,
        }))

        return {
            zones: serializedZones,
            tables: serializedTables,
            stats,
            activeOrderMap,
        }
    } catch (error) {
        console.error("[getTablesPageData] Error:", error)
        return {
            zones: [],
            tables: [],
            stats: { total: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0 },
            activeOrderMap: {},
        }
    }
}
