import { getReservations, getReservationStats } from "@/actions/reservations"
import { getZones, getTables } from "@/actions/tables"
import { ReservationsClient } from "./reservations-client"

export const dynamic = "force-dynamic"

export default async function ReservationsPage() {
    try {
        const [list, stats] = await Promise.all([getReservations({}), getReservationStats()])
        const [zones, tables] = await Promise.all([getZones(), getTables()])
        return <ReservationsClient initialData={{ list, stats, zones, tables }} />
    } catch (e) {
        console.error("[ReservationsPage SSR] Failed:", e)
        return <ReservationsClient initialData={{ list: [], stats: { todayTotal: 0, pending: 0, confirmed: 0, seated: 0, noShow: 0, totalGuests: 0 }, zones: [], tables: [] }} />
    }
}
