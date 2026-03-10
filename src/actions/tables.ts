"use server"

import { MOCK_TABLES, MOCK_ZONES, type FloorTable, type TableZone } from "@/lib/mock-data"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ============================================================
// ZONES — CRUD
// ============================================================

export async function getZones(): Promise<TableZone[]> {
    await delay(100)
    return [...MOCK_ZONES].sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function createZone(data: {
    name: string
    sortOrder?: number
}): Promise<{ success: boolean; data?: TableZone }> {
    await delay(150)
    const zone: TableZone = {
        id: `zone-${Date.now()}`,
        name: data.name,
        sortOrder: data.sortOrder ?? MOCK_ZONES.length,
        isActive: true,
    }
    MOCK_ZONES.push(zone)
    return { success: true, data: zone }
}

export async function updateZone(
    id: string,
    data: Partial<{ name: string; sortOrder: number; isActive: boolean }>
): Promise<{ success: boolean }> {
    await delay(100)
    const zone = MOCK_ZONES.find((z) => z.id === id)
    if (!zone) return { success: false }
    Object.assign(zone, data)
    return { success: true }
}

export async function deleteZone(id: string): Promise<{ success: boolean; error?: string }> {
    await delay(100)
    const hasTables = MOCK_TABLES.some((t) => t.zoneId === id && t.isActive)
    if (hasTables) return { success: false, error: "Khu vực còn bàn, không thể xóa" }
    const idx = MOCK_ZONES.findIndex((z) => z.id === id)
    if (idx === -1) return { success: false, error: "Không tìm thấy" }
    MOCK_ZONES.splice(idx, 1)
    return { success: true }
}

// ============================================================
// TABLES — CRUD
// ============================================================

export async function getTables(zoneId?: string): Promise<FloorTable[]> {
    await delay(150)
    let tables = [...MOCK_TABLES].filter((t) => t.isActive)
    if (zoneId) {
        tables = tables.filter((t) => t.zoneId === zoneId)
    }
    return tables.map((t) => ({
        ...t,
        zone: MOCK_ZONES.find((z) => z.id === t.zoneId),
    }))
}

export async function createTable(data: {
    zoneId: string
    tableNumber: string
    seats: number
    shape?: string
}): Promise<{ success: boolean; data?: FloorTable; error?: string }> {
    await delay(200)
    if (MOCK_TABLES.some((t) => t.tableNumber === data.tableNumber && t.isActive)) {
        return { success: false, error: `Bàn "${data.tableNumber}" đã tồn tại` }
    }
    const table: FloorTable = {
        id: `t-${Date.now()}`,
        zoneId: data.zoneId,
        tableNumber: data.tableNumber,
        seats: data.seats,
        status: "AVAILABLE",
        shape: data.shape ?? "square",
        posX: 0,
        posY: 0,
        isActive: true,
    }
    MOCK_TABLES.push(table)
    return { success: true, data: table }
}

export async function updateTable(
    id: string,
    data: Partial<{ tableNumber: string; seats: number; zoneId: string; shape: string }>
): Promise<{ success: boolean; error?: string }> {
    await delay(150)
    const table = MOCK_TABLES.find((t) => t.id === id)
    if (!table) return { success: false, error: "Không tìm thấy bàn" }
    if (data.tableNumber && data.tableNumber !== table.tableNumber) {
        if (MOCK_TABLES.some((t) => t.tableNumber === data.tableNumber && t.isActive && t.id !== id)) {
            return { success: false, error: `Bàn "${data.tableNumber}" đã tồn tại` }
        }
    }
    Object.assign(table, data)
    return { success: true }
}

export async function deleteTable(id: string): Promise<{ success: boolean; error?: string }> {
    await delay(150)
    const table = MOCK_TABLES.find((t) => t.id === id)
    if (!table) return { success: false, error: "Không tìm thấy bàn" }
    if (table.status === "OCCUPIED") return { success: false, error: "Bàn đang có khách, không thể xóa" }
    table.isActive = false
    return { success: true }
}

export async function updateTableStatus(
    tableId: string,
    status: FloorTable["status"]
): Promise<{ success: boolean }> {
    await delay(200)
    const table = MOCK_TABLES.find((t) => t.id === tableId)
    if (!table) return { success: false }
    table.status = status
    return { success: true }
}

export async function getTableStats() {
    await delay(100)
    const tables = MOCK_TABLES.filter((t) => t.isActive)
    return {
        total: tables.length,
        available: tables.filter((t) => t.status === "AVAILABLE").length,
        occupied: tables.filter((t) => t.status === "OCCUPIED").length,
        reserved: tables.filter((t) => t.status === "RESERVED").length,
        cleaning: tables.filter((t) => t.status === "CLEANING").length,
    }
}
