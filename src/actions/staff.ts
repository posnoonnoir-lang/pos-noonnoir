"use server"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type StaffRole = "OWNER" | "MANAGER" | "BARTENDER" | "SERVER" | "KITCHEN"
export type StaffStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE"

export type Staff = {
    id: string
    fullName: string
    pin: string
    role: StaffRole
    status: StaffStatus
    phone: string
    email: string
    joinDate: string
    shiftStart: string
    shiftEnd: string
    avatar?: string
    totalOrders: number
    totalRevenue: number
}

const MOCK_STAFF: Staff[] = [
    {
        id: "staff-1", fullName: "Chien Nguyen", pin: "1234", role: "OWNER", status: "ACTIVE",
        phone: "0901234567", email: "chien@noonnoir.vn", joinDate: "2024-01-15",
        shiftStart: "09:00", shiftEnd: "22:00", totalOrders: 1250, totalRevenue: 456_000_000,
    },
    {
        id: "staff-2", fullName: "Linh Tran", pin: "5678", role: "MANAGER", status: "ACTIVE",
        phone: "0912345678", email: "linh@noonnoir.vn", joinDate: "2024-03-01",
        shiftStart: "10:00", shiftEnd: "22:00", totalOrders: 890, totalRevenue: 312_000_000,
    },
    {
        id: "staff-3", fullName: "Minh Le", pin: "9012", role: "BARTENDER", status: "ACTIVE",
        phone: "0923456789", email: "minh@noonnoir.vn", joinDate: "2024-06-15",
        shiftStart: "16:00", shiftEnd: "00:00", totalOrders: 650, totalRevenue: 198_000_000,
    },
    {
        id: "staff-4", fullName: "Hoa Pham", pin: "3456", role: "SERVER", status: "ACTIVE",
        phone: "0934567890", email: "hoa@noonnoir.vn", joinDate: "2024-08-01",
        shiftStart: "10:00", shiftEnd: "18:00", totalOrders: 420, totalRevenue: 128_000_000,
    },
    {
        id: "staff-5", fullName: "Duc Vo", pin: "7890", role: "KITCHEN", status: "ACTIVE",
        phone: "0945678901", email: "duc@noonnoir.vn", joinDate: "2024-09-15",
        shiftStart: "09:00", shiftEnd: "17:00", totalOrders: 0, totalRevenue: 0,
    },
    {
        id: "staff-6", fullName: "Anh Nguyen", pin: "2468", role: "SERVER", status: "ON_LEAVE",
        phone: "0956789012", email: "anh@noonnoir.vn", joinDate: "2025-01-10",
        shiftStart: "16:00", shiftEnd: "00:00", totalOrders: 180, totalRevenue: 52_000_000,
    },
]

export async function getStaffList(): Promise<Staff[]> {
    await delay(150)
    return MOCK_STAFF.map(({ pin, ...rest }) => ({ ...rest, pin: "****" }))
}

export async function getStaffById(id: string): Promise<Staff | null> {
    await delay(100)
    const staff = MOCK_STAFF.find((s) => s.id === id)
    return staff ? { ...staff, pin: "****" } : null
}

export async function createStaff(data: {
    fullName: string
    pin: string
    role: StaffRole
    phone: string
    email: string
    shiftStart: string
    shiftEnd: string
}): Promise<{ success: boolean; staff?: Staff; error?: string }> {
    await delay(200)
    if (MOCK_STAFF.some((s) => s.pin === data.pin)) {
        return { success: false, error: "Mã PIN đã được sử dụng" }
    }
    const newStaff: Staff = {
        id: `staff-${Date.now()}`,
        ...data,
        status: "ACTIVE",
        joinDate: new Date().toISOString().split("T")[0],
        totalOrders: 0,
        totalRevenue: 0,
    }
    MOCK_STAFF.push(newStaff)
    return { success: true, staff: { ...newStaff, pin: "****" } }
}

export async function updateStaff(
    id: string,
    data: Partial<{ fullName: string; role: StaffRole; phone: string; email: string; shiftStart: string; shiftEnd: string }>
): Promise<{ success: boolean; error?: string }> {
    await delay(150)
    const staff = MOCK_STAFF.find((s) => s.id === id)
    if (!staff) return { success: false, error: "Không tìm thấy nhân viên" }
    Object.assign(staff, data)
    return { success: true }
}

export async function updateStaffStatus(
    id: string,
    status: StaffStatus
): Promise<{ success: boolean }> {
    await delay(150)
    const staff = MOCK_STAFF.find((s) => s.id === id)
    if (!staff) return { success: false }
    staff.status = status
    return { success: true }
}

export async function resetStaffPin(
    id: string,
    newPin: string
): Promise<{ success: boolean; error?: string }> {
    await delay(150)
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return { success: false, error: "PIN phải là 4 chữ số" }
    }
    const staff = MOCK_STAFF.find((s) => s.id === id)
    if (!staff) return { success: false, error: "Không tìm thấy nhân viên" }
    staff.pin = newPin
    return { success: true }
}
