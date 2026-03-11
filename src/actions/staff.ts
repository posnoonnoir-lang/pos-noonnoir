"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { StaffRole } from "@prisma/client"

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
    const existing = await prisma.staff.findFirst({ where: { pinCode: data.pin } })
    if (existing) return { success: false, error: "Mã PIN đã được sử dụng" }

    try {
        const staff = await prisma.staff.create({
            data: {
                fullName: data.fullName,
                pinCode: data.pin,
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
    try {
        await prisma.staff.update({ where: { id }, data })
        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch {
        return { success: false, error: "Không tìm thấy nhân viên" }
    }
}

export async function updateStaffStatus(id: string, status: boolean | string) {
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
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return { success: false, error: "PIN phải là 4 chữ số" }
    }
    try {
        await prisma.staff.update({ where: { id }, data: { pinCode: newPin } })
        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch {
        return { success: false, error: "Không tìm thấy nhân viên" }
    }
}

export async function verifyStaffPin(pin: string) {
    const staff = await prisma.staff.findFirst({
        where: { pinCode: pin, isActive: true },
    })
    if (!staff) return null
    return {
        id: staff.id,
        fullName: staff.fullName,
        role: staff.role,
    }
}
