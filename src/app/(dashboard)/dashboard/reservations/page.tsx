import { getReservations, getReservationStats } from "@/actions/reservations"
import { getZones, getTables } from "@/actions/tables"
import { ReservationsClient } from "./reservations-client"

export default async function ReservationsPage() {
    const [list, stats] = await Promise.all([getReservations({}), getReservationStats()])
    const [zones, tables] = await Promise.all([getZones(), getTables()])
    return <ReservationsClient initialData={{ list, stats, zones, tables }} />
}
