"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { TableStatus } from "@prisma/client"

// ============================================================
// ZONES — CRUD
// ============================================================

export async function getZones() {
    const zones = await prisma.tableZone.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
    })
    return zones
}

export async function createZone(data: {
    name: string
    sortOrder?: number
}) {
    try {
        const count = await prisma.tableZone.count()
        const zone = await prisma.tableZone.create({
            data: {
                name: data.name,
                sortOrder: data.sortOrder ?? count,
            },
        })
        revalidatePath("/dashboard/tables")
        return { success: true, data: zone }
    } catch {
        return { success: false }
    }
}

export async function updateZone(
    id: string,
    data: Partial<{ name: string; sortOrder: number; isActive: boolean }>
) {
    try {
        await prisma.tableZone.update({ where: { id }, data })
        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function deleteZone(id: string) {
    const hasTables = await prisma.floorTable.count({
        where: { zoneId: id, isActive: true },
    })
    if (hasTables > 0) return { success: false, error: "Khu vực còn bàn, không thể xóa" }

    try {
        await prisma.tableZone.update({ where: { id }, data: { isActive: false } })
        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch {
        return { success: false, error: "Không tìm thấy" }
    }
}

// ============================================================
// TABLES — CRUD
// ============================================================

export async function getTables(zoneId?: string) {
    const tables = await prisma.floorTable.findMany({
        where: {
            isActive: true,
            ...(zoneId ? { zoneId } : {}),
        },
        include: { zone: true },
        orderBy: { tableNumber: "asc" },
    })
    return tables
}

export async function createTable(data: {
    zoneId: string
    tableNumber: string
    seats: number
    shape?: string
}) {
    try {
        const table = await prisma.floorTable.create({
            data: {
                zoneId: data.zoneId,
                tableNumber: data.tableNumber,
                seats: data.seats,
                shape: data.shape ?? "square",
            },
        })
        revalidatePath("/dashboard/tables")
        return { success: true, data: table }
    } catch {
        return { success: false, error: `Bàn "${data.tableNumber}" đã tồn tại` }
    }
}

export async function updateTable(
    id: string,
    data: Partial<{ tableNumber: string; seats: number; zoneId: string; shape: string }>
) {
    try {
        await prisma.floorTable.update({ where: { id }, data })
        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch {
        return { success: false, error: "Không thể cập nhật bàn" }
    }
}

export async function deleteTable(id: string) {
    const table = await prisma.floorTable.findUnique({ where: { id } })
    if (!table) return { success: false, error: "Không tìm thấy bàn" }
    if (table.status === "OCCUPIED") return { success: false, error: "Bàn đang có khách, không thể xóa" }

    await prisma.floorTable.update({ where: { id }, data: { isActive: false } })
    revalidatePath("/dashboard/tables")
    return { success: true }
}

export async function updateTableStatus(tableId: string, status: TableStatus) {
    try {
        await prisma.floorTable.update({ where: { id: tableId }, data: { status } })
        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function getTableStats() {
    const tables = await prisma.floorTable.findMany({ where: { isActive: true } })
    return {
        total: tables.length,
        available: tables.filter((t) => t.status === "AVAILABLE").length,
        occupied: tables.filter((t) => t.status === "OCCUPIED").length,
        reserved: tables.filter((t) => t.status === "RESERVED").length,
        cleaning: tables.filter((t) => t.status === "CLEANING").length,
    }
}
