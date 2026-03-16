"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { StaffRole } from "@prisma/client"
import { withRbac } from "@/lib/with-rbac"
import bcrypt from "bcryptjs"

// Rate limiting for PIN verification (brute-force protection)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 5 * 60 * 1000 // 5 minutes

export type { StaffRole } from "@prisma/client"

export type StaffStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE"

export type Staff = {
    id: string
    fullName: string
    pin: string | null
    role: string
    isActive: boolean
    status?: StaffStatus
    phone: string | null
    email: string | null
    baseSalary: number
    pinCode: string | null
    avatarUrl: string | null
    shiftStart?: string
    shiftEnd?: string
    totalOrders?: number
    totalRevenue?: number
    createdAt: Date
    updatedAt: Date
}

// ============================================================
// STAFF — CRUD
// ============================================================

export async function getStaffList() {
    const staffList = await prisma.staff.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { orders: { where: { status: "PAID" } } } },
            orders: {
                where: { status: "PAID" },
                select: { totalAmount: true },
            },
        },
    })
    return staffList.map((s) => ({
        ...s,
        pin: s.pinCode ? "****" : null,
        pinCode: s.pinCode,
        baseSalary: Number(s.baseSalary),
        status: (s.isActive ? "ACTIVE" : "INACTIVE") as StaffStatus,
        totalOrders: s._count.orders,
        totalRevenue: s.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
        shiftStart: undefined as string | undefined,
        shiftEnd: undefined as string | undefined,
    }))
}

export async function getStaffById(id: string) {
    const staff = await prisma.staff.findUnique({
        where: { id },
        include: {
            _count: { select: { orders: { where: { status: "PAID" } } } },
            orders: {
                where: { status: "PAID" },
                select: { totalAmount: true },
            },
        },
    })
    if (!staff) return null
    return {
        ...staff,
        pin: staff.pinCode ? "****" : null,
        baseSalary: Number(staff.baseSalary),
        status: (staff.isActive ? "ACTIVE" : "INACTIVE") as StaffStatus,
        totalOrders: staff._count.orders,
        totalRevenue: staff.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
    }
}

export async function getStaffShiftHistory(staffId: string) {
    const shifts = await prisma.shiftRecord.findMany({
        where: { staffId },
        orderBy: { openedAt: "desc" },
        take: 50,
    })
    return shifts.map((s) => ({
        id: s.id,
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        openingCash: Number(s.openingCash),
        closingCash: s.closingCash ? Number(s.closingCash) : null,
        expectedCash: s.expectedCash ? Number(s.expectedCash) : null,
        variance: s.variance ? Number(s.variance) : null,
        totalRevenue: s.totalRevenue ? Number(s.totalRevenue) : null,
        status: s.closedAt ? "CLOSED" : "OPEN",
        duration: s.closedAt
            ? Math.round((s.closedAt.getTime() - s.openedAt.getTime()) / 3600000 * 10) / 10
            : null,
    }))
}

export async function getStaffPerformance(staffId: string) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const orders = await prisma.order.findMany({
        where: {
            createdBy: staffId,
            status: "PAID",
            createdAt: { gte: thirtyDaysAgo },
        },
        select: {
            totalAmount: true,
            createdAt: true,
            items: { select: { quantity: true } },
        },
        orderBy: { createdAt: "asc" },
    })

    // Group by day
    const dailyMap = new Map<string, { revenue: number; orders: number; items: number }>()
    for (const o of orders) {
        const day = o.createdAt.toISOString().split("T")[0]
        const existing = dailyMap.get(day) ?? { revenue: 0, orders: 0, items: 0 }
        existing.revenue += Number(o.totalAmount)
        existing.orders += 1
        existing.items += o.items.reduce((s, i) => s + i.quantity, 0)
        dailyMap.set(day, existing)
    }

    const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        ...data,
    }))

    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0)
    const totalOrders = orders.length
    const totalItems = orders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return {
        dailyData,
        totalRevenue,
        totalOrders,
        totalItems,
        avgOrderValue,
        daysActive: dailyMap.size,
    }
}

export async function createStaff(data: {
    fullName: string
    pin: string
    role: StaffRole
    phone: string
    email?: string
    baseSalary?: number
}) {
    const guard = await withRbac("staff", "create")
    if (!guard.ok) return { success: false, error: guard.error }

    // Check PIN uniqueness by comparing against all active staff
    const allStaff = await prisma.staff.findMany({ where: { isActive: true }, select: { pinCode: true } })
    for (const s of allStaff) {
        if (await bcrypt.compare(data.pin, s.pinCode)) {
            return { success: false, error: "Mã PIN đã được sử dụng" }
        }
    }

    try {
        const hashedPin = await bcrypt.hash(data.pin, 10)
        const staff = await prisma.staff.create({
            data: {
                fullName: data.fullName,
                pinCode: hashedPin,
                role: data.role,
                phone: data.phone,
                email: data.email,
                baseSalary: data.baseSalary ?? 0,
            },
        })
        revalidatePath("/dashboard/staff")
        return { success: true, staff: { ...staff, pin: "****", baseSalary: Number(staff.baseSalary) } }
    } catch {
        return { success: false, error: "Không thể tạo nhân viên" }
    }
}

export async function updateStaff(
    id: string,
    data: Partial<{ fullName: string; role: StaffRole; phone: string; email: string; baseSalary: number }>
) {
    const guard = await withRbac("staff", "edit")
    if (!guard.ok) return { success: false, error: guard.error }

    try {
        await prisma.staff.update({ where: { id }, data })
        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch {
        return { success: false, error: "Không tìm thấy nhân viên" }
    }
}

export async function updateStaffStatus(id: string, status: boolean | string) {
    const guard = await withRbac("staff", "edit")
    if (!guard.ok) return { success: false, error: guard.error }

    const isActive = typeof status === "boolean" ? status : status === "ACTIVE"
    try {
        await prisma.staff.update({ where: { id }, data: { isActive } })
        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function resetStaffPin(id: string, newPin: string) {
    const guard = await withRbac("staff", "edit")
    if (!guard.ok) return { success: false, error: guard.error }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return { success: false, error: "PIN phải là 4 chữ số" }
    }
    try {
        const hashedPin = await bcrypt.hash(newPin, 10)
        await prisma.staff.update({ where: { id }, data: { pinCode: hashedPin } })
        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch {
        return { success: false, error: "Không tìm thấy nhân viên" }
    }
}

export async function verifyStaffPin(pin: string) {
    // Rate limiting check
    const clientKey = "global" // In production, use IP/device fingerprint
    const attempts = loginAttempts.get(clientKey)
    if (attempts) {
        const timeSinceLast = Date.now() - attempts.lastAttempt
        if (attempts.count >= MAX_ATTEMPTS && timeSinceLast < LOCKOUT_MS) {
            const remainingMin = Math.ceil((LOCKOUT_MS - timeSinceLast) / 60000)
            return { error: `Quá nhiều lần thử. Vui lòng đợi ${remainingMin} phút.` } as const
        }
        // Reset if lockout expired
        if (timeSinceLast >= LOCKOUT_MS) {
            loginAttempts.delete(clientKey)
        }
    }

    // Load all active staff and compare PIN hashes
    const allStaff = await prisma.staff.findMany({
        where: { isActive: true },
        select: { id: true, fullName: true, role: true, pinCode: true },
    })

    let matchedStaff: typeof allStaff[0] | null = null
    for (const s of allStaff) {
        // Support both hashed and legacy plaintext PINs
        const isHashed = s.pinCode.startsWith("$2")
        const isMatch = isHashed
            ? await bcrypt.compare(pin, s.pinCode)
            : s.pinCode === pin
        if (isMatch) {
            matchedStaff = s
            // If plaintext match, auto-migrate to hashed
            if (!isHashed) {
                const hashed = await bcrypt.hash(pin, 10)
                await prisma.staff.update({ where: { id: s.id }, data: { pinCode: hashed } })
            }
            break
        }
    }

    if (!matchedStaff) {
        // Record failed attempt
        const current = loginAttempts.get(clientKey) ?? { count: 0, lastAttempt: 0 }
        loginAttempts.set(clientKey, { count: current.count + 1, lastAttempt: Date.now() })
        return null
    }

    // Reset attempts on success
    loginAttempts.delete(clientKey)

    // Set HTTP-only cookies for middleware + RBAC validation
    const cookieStore = await import("next/headers").then(m => m.cookies())
    const cookieOpts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
    }
    cookieStore.set("pos_auth", "true", cookieOpts)
    cookieStore.set("pos_staff_id", matchedStaff.id, cookieOpts)

    return {
        id: matchedStaff.id,
        fullName: matchedStaff.fullName,
        role: matchedStaff.role,
    }
}

export async function logoutStaff() {
    const cookieStore = await import("next/headers").then(m => m.cookies())
    cookieStore.delete("pos_auth")
    cookieStore.delete("pos_staff_id")
    return { success: true }
}
