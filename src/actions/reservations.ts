"use server"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

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
    date: string // YYYY-MM-DD
    time: string // HH:mm
    endTime: string | null
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

// In-memory store
const RESERVATIONS: Reservation[] = [
    {
        id: "rsv-1",
        customerName: "Nguyễn Văn An",
        customerPhone: "0901234567",
        customerEmail: "an.nguyen@email.com",
        guestCount: 4,
        tableId: "t-05",
        tableNumber: "T05",
        zonePreference: "Indoor Tầng 1",
        date: new Date().toISOString().split("T")[0],
        time: "19:00",
        endTime: null,
        status: "CONFIRMED",
        notes: "Khách VIP — Gold member",
        specialRequests: "Cần high chair cho bé",
        source: "PHONE",
        staffId: "staff-1",
        staffName: "Ngọc Anh",
        confirmedAt: new Date(Date.now() - 3600000),
        seatedAt: null,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 3600000),
    },
    {
        id: "rsv-2",
        customerName: "Trần Minh Hương",
        customerPhone: "0912345678",
        customerEmail: null,
        guestCount: 2,
        tableId: null,
        tableNumber: null,
        zonePreference: "Bar Counter",
        date: new Date().toISOString().split("T")[0],
        time: "20:30",
        endTime: null,
        status: "PENDING",
        notes: null,
        specialRequests: "Muốn ngồi bar counter",
        source: "ZALO",
        staffId: "staff-2",
        staffName: "Minh Tú",
        confirmedAt: null,
        seatedAt: null,
        createdAt: new Date(Date.now() - 7200000),
        updatedAt: new Date(Date.now() - 7200000),
    },
    {
        id: "rsv-3",
        customerName: "Lê Thanh Tùng",
        customerPhone: "0923456789",
        customerEmail: "tung.le@corp.vn",
        guestCount: 8,
        tableId: "t-12",
        tableNumber: "VIP1",
        zonePreference: "VIP Room",
        date: new Date().toISOString().split("T")[0],
        time: "18:30",
        endTime: null,
        status: "CONFIRMED",
        notes: "Corporate dinner — wine tasting package",
        specialRequests: "Pre-order: 2 chai Opus One, Cheese Board x2, Cold Cut Board x2",
        source: "PHONE",
        staffId: "staff-1",
        staffName: "Ngọc Anh",
        confirmedAt: new Date(Date.now() - 86400000),
        seatedAt: null,
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 86400000),
    },
]

let reservationCounter = 4

export async function getReservations(params?: {
    date?: string
    status?: ReservationStatus
}): Promise<Reservation[]> {
    await delay(150)
    let list = [...RESERVATIONS]
    if (params?.date) {
        list = list.filter((r) => r.date === params.date)
    }
    if (params?.status) {
        list = list.filter((r) => r.status === params.status)
    }
    return list.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.time.localeCompare(b.time)
    })
}

export async function getTodayReservations(): Promise<Reservation[]> {
    const today = new Date().toISOString().split("T")[0]
    return getReservations({ date: today })
}

export async function getUpcomingReservations(): Promise<Reservation[]> {
    await delay(100)
    const now = new Date()
    const today = now.toISOString().split("T")[0]
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    return RESERVATIONS.filter(
        (r) =>
            ["PENDING", "CONFIRMED"].includes(r.status) &&
            (r.date > today || (r.date === today && r.time >= currentTime))
    ).sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.time.localeCompare(b.time)
    })
}

export async function createReservation(params: {
    customerName: string
    customerPhone: string
    customerEmail?: string
    guestCount: number
    tableId?: string
    tableNumber?: string
    zonePreference?: string
    date: string
    time: string
    notes?: string
    specialRequests?: string
    source: Reservation["source"]
    staffId: string
    staffName: string
}): Promise<{ success: boolean; reservation?: Reservation; error?: string }> {
    await delay(300)

    if (!params.customerName || !params.customerPhone) {
        return { success: false, error: "Tên và SĐT là bắt buộc" }
    }
    if (params.guestCount < 1) {
        return { success: false, error: "Số khách phải >= 1" }
    }

    const reservation: Reservation = {
        id: `rsv-${reservationCounter++}`,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        customerEmail: params.customerEmail ?? null,
        guestCount: params.guestCount,
        tableId: params.tableId ?? null,
        tableNumber: params.tableNumber ?? null,
        zonePreference: params.zonePreference ?? null,
        date: params.date,
        time: params.time,
        endTime: null,
        status: "PENDING",
        notes: params.notes ?? null,
        specialRequests: params.specialRequests ?? null,
        source: params.source,
        staffId: params.staffId,
        staffName: params.staffName,
        confirmedAt: null,
        seatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    RESERVATIONS.push(reservation)
    return { success: true, reservation }
}

export async function updateReservationStatus(
    id: string,
    status: ReservationStatus
): Promise<{ success: boolean; error?: string }> {
    await delay(200)
    const rsv = RESERVATIONS.find((r) => r.id === id)
    if (!rsv) return { success: false, error: "Không tìm thấy đặt bàn" }

    rsv.status = status
    rsv.updatedAt = new Date()

    if (status === "CONFIRMED") rsv.confirmedAt = new Date()
    if (status === "SEATED") rsv.seatedAt = new Date()

    return { success: true }
}

export async function assignTableToReservation(
    id: string,
    tableId: string,
    tableNumber: string
): Promise<{ success: boolean; error?: string }> {
    await delay(200)
    const rsv = RESERVATIONS.find((r) => r.id === id)
    if (!rsv) return { success: false, error: "Không tìm thấy đặt bàn" }

    rsv.tableId = tableId
    rsv.tableNumber = tableNumber
    rsv.updatedAt = new Date()

    return { success: true }
}

export async function deleteReservation(
    id: string
): Promise<{ success: boolean }> {
    await delay(200)
    const idx = RESERVATIONS.findIndex((r) => r.id === id)
    if (idx === -1) return { success: false }
    RESERVATIONS.splice(idx, 1)
    return { success: true }
}

export async function getReservationStats() {
    await delay(100)
    const today = new Date().toISOString().split("T")[0]
    const todayList = RESERVATIONS.filter((r) => r.date === today)
    return {
        todayTotal: todayList.length,
        pending: todayList.filter((r) => r.status === "PENDING").length,
        confirmed: todayList.filter((r) => r.status === "CONFIRMED").length,
        seated: todayList.filter((r) => r.status === "SEATED").length,
        noShow: todayList.filter((r) => r.status === "NO_SHOW").length,
        totalGuests: todayList
            .filter((r) => ["CONFIRMED", "SEATED", "PENDING"].includes(r.status))
            .reduce((sum, r) => sum + r.guestCount, 0),
    }
}
