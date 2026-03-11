"use server"

import { prisma } from "@/lib/prisma"

export type ReservationStatus = "PENDING" | "CONFIRMED" | "SEATED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"

export type Reservation = {
    id: string
    customerName: string
    customerPhone: string
    customerEmail: string | null
    guestCount: number
    tableId: string | null
    tableNumber: string | null
    zonePreference: string | null
    date: string
    time: string
    status: ReservationStatus
    notes: string | null
    specialRequests: string | null
    source: "PHONE" | "WALK_IN" | "WEBSITE" | "ZALO"
    staffId: string
    staffName: string
    confirmedAt: Date | null
    seatedAt: Date | null
    createdAt: Date
    updatedAt: Date
}

function toReservation(r: {
    id: string; customerName: string; customerPhone: string; customerEmail: string | null
    guestCount: number; tableId: string | null; tableNumber: string | null; zonePreference: string | null
    date: Date; time: string; status: string; notes: string | null; specialRequests: string | null
    source: string; staffId: string; staffName: string; confirmedAt: Date | null; seatedAt: Date | null
    createdAt: Date; updatedAt: Date
}): Reservation {
    return { ...r, date: r.date.toISOString().split("T")[0], status: r.status as ReservationStatus, source: r.source as Reservation["source"] }
}

export async function getReservations(params?: { date?: string; status?: ReservationStatus }): Promise<Reservation[]> {
    const where: Record<string, unknown> = {}
    if (params?.date) where.date = new Date(params.date)
    if (params?.status) where.status = params.status

    const rows = await prisma.reservation.findMany({ where, orderBy: { time: "asc" } })
    return rows.map(toReservation)
}

export async function getTodayReservations(): Promise<Reservation[]> {
    const today = new Date().toISOString().split("T")[0]
    return getReservations({ date: today })
}

export async function getUpcomingReservations(): Promise<Reservation[]> {
    const now = new Date()
    const today = new Date(now.toISOString().split("T")[0])
    const rows = await prisma.reservation.findMany({
        where: { date: { gte: today }, status: { in: ["PENDING", "CONFIRMED"] } },
        orderBy: [{ date: "asc" }, { time: "asc" }],
    })
    return rows.map(toReservation)
}

export async function createReservation(params: {
    customerName: string; customerPhone: string; customerEmail?: string; guestCount: number
    tableId?: string; tableNumber?: string; zonePreference?: string; date: string; time: string
    notes?: string; specialRequests?: string; source: Reservation["source"]; staffId: string; staffName: string
}): Promise<{ success: boolean; reservation?: Reservation; error?: string }> {
    try {
        const row = await prisma.reservation.create({
            data: {
                customerName: params.customerName,
                customerPhone: params.customerPhone,
                customerEmail: params.customerEmail ?? null,
                guestCount: params.guestCount,
                tableId: params.tableId ?? null,
                tableNumber: params.tableNumber ?? null,
                zonePreference: params.zonePreference ?? null,
                date: new Date(params.date),
                time: params.time,
                notes: params.notes ?? null,
                specialRequests: params.specialRequests ?? null,
                source: params.source,
                staffId: params.staffId,
                staffName: params.staffName,
            },
        })
        return { success: true, reservation: toReservation(row) }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<{ success: boolean; error?: string }> {
    try {
        const data: Record<string, unknown> = { status }
        if (status === "CONFIRMED") data.confirmedAt = new Date()
        if (status === "SEATED") data.seatedAt = new Date()
        await prisma.reservation.update({ where: { id }, data })
        return { success: true }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

export async function assignTableToReservation(id: string, tableId: string, tableNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.reservation.update({ where: { id }, data: { tableId, tableNumber } })
        return { success: true }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
}

export async function deleteReservation(id: string): Promise<{ success: boolean }> {
    await prisma.reservation.delete({ where: { id } })
    return { success: true }
}

export async function getReservationStats() {
    const today = new Date(new Date().toISOString().split("T")[0])
    const rows = await prisma.reservation.findMany({ where: { date: today } })

    return {
        todayTotal: rows.length,
        pending: rows.filter((r) => r.status === "PENDING").length,
        confirmed: rows.filter((r) => r.status === "CONFIRMED").length,
        seated: rows.filter((r) => r.status === "SEATED").length,
        noShow: rows.filter((r) => r.status === "NO_SHOW").length,
        totalGuests: rows.reduce((sum, r) => sum + r.guestCount, 0),
    }
}
