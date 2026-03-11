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
    })
    return staffList.map((s) => ({
        ...s,
        pin: s.pinCode ? "****" : null,
        pinCode: s.pinCode,
        baseSalary: Number(s.baseSalary),
        status: (s.isActive ? "ACTIVE" : "INACTIVE") as StaffStatus,
    }))
}

export async function getStaffById(id: string) {
    const staff = await prisma.staff.findUnique({ where: { id } })
    if (!staff) return null
    return {
        ...staff,
        pin: staff.pinCode ? "****" : null,
        baseSalary: Number(staff.baseSalary),
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
