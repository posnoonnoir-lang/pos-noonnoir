"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type AttendanceRecord = {
    id: string
    staffId: string
    staffName: string
    date: string
    checkIn: string | null
    checkOut: string | null
    hoursWorked: number | null
    status: string
}

// ============================================================
// ATTENDANCE — CHECK IN / CHECK OUT
// ============================================================

export async function checkIn(staffId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existing = await prisma.attendance.findUnique({
        where: { staffId_date: { staffId, date: today } },
    })
    if (existing?.checkIn) {
        return { success: false, error: "Đã chấm công vào hôm nay" }
    }

    try {
        await prisma.attendance.upsert({
            where: { staffId_date: { staffId, date: today } },
            create: {
                staffId,
                date: today,
                checkIn: new Date(),
                status: "PRESENT",
            },
            update: {
                checkIn: new Date(),
                status: "PRESENT",
            },
        })
        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch {
        return { success: false, error: "Lỗi chấm công" }
    }
}

export async function checkOut(staffId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existing = await prisma.attendance.findUnique({
        where: { staffId_date: { staffId, date: today } },
    })
    if (!existing?.checkIn) {
        return { success: false, error: "Chưa chấm công vào" }
    }
    if (existing.checkOut) {
        return { success: false, error: "Đã chấm công ra rồi" }
    }

    const checkOut = new Date()
    const checkIn = new Date(existing.checkIn)
    const hoursWorked = Math.round(((checkOut.getTime() - checkIn.getTime()) / 3600000) * 100) / 100

    try {
        await prisma.attendance.update({
            where: { staffId_date: { staffId, date: today } },
            data: {
                checkOut,
                hoursWorked,
            },
        })
        revalidatePath("/dashboard/staff")
        return { success: true, hoursWorked }
    } catch {
        return { success: false, error: "Lỗi chấm công ra" }
    }
}

export async function getTodayAttendance() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const records = await prisma.attendance.findMany({
        where: { date: today },
        include: { staff: { select: { fullName: true } } },
        orderBy: { checkIn: "asc" },
    })

    return records.map((r) => ({
        id: r.id,
        staffId: r.staffId,
        staffName: r.staff.fullName,
        date: r.date.toISOString().split("T")[0],
        checkIn: r.checkIn ? r.checkIn.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : null,
        checkOut: r.checkOut ? r.checkOut.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : null,
        hoursWorked: r.hoursWorked ? Number(r.hoursWorked) : null,
        status: r.status,
    }))
}

export async function getStaffAttendance(staffId: string, month?: number, year?: number) {
    const now = new Date()
    const m = month ?? now.getMonth()
    const y = year ?? now.getFullYear()
    const start = new Date(y, m, 1)
    const end = new Date(y, m + 1, 0, 23, 59, 59)

    const records = await prisma.attendance.findMany({
        where: {
            staffId,
            date: { gte: start, lte: end },
        },
        include: { staff: { select: { fullName: true } } },
        orderBy: { date: "desc" },
    })

    return records.map((r) => ({
        id: r.id,
        staffId: r.staffId,
        staffName: r.staff.fullName,
        date: r.date.toISOString().split("T")[0],
        checkIn: r.checkIn ? r.checkIn.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : null,
        checkOut: r.checkOut ? r.checkOut.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : null,
        hoursWorked: r.hoursWorked ? Number(r.hoursWorked) : null,
        status: r.status,
    }))
}

export async function markAbsent(staffId: string, date?: Date) {
    const targetDate = date ?? new Date()
    targetDate.setHours(0, 0, 0, 0)

    try {
        await prisma.attendance.upsert({
            where: { staffId_date: { staffId, date: targetDate } },
            create: {
                staffId,
                date: targetDate,
                status: "ABSENT",
            },
            update: {
                status: "ABSENT",
            },
        })
        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch {
        return { success: false, error: "Lỗi đánh dấu vắng" }
    }
}

export async function markLeave(staffId: string, date?: Date) {
    const targetDate = date ?? new Date()
    targetDate.setHours(0, 0, 0, 0)

    try {
        await prisma.attendance.upsert({
            where: { staffId_date: { staffId, date: targetDate } },
            create: {
                staffId,
                date: targetDate,
                status: "LEAVE",
            },
            update: {
                status: "LEAVE",
            },
        })
        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch {
        return { success: false, error: "Lỗi đánh dấu nghỉ phép" }
    }
}

export async function getAttendanceSummary(staffId: string, month?: number, year?: number) {
    const now = new Date()
    const m = month ?? now.getMonth()
    const y = year ?? now.getFullYear()
    const start = new Date(y, m, 1)
    const end = new Date(y, m + 1, 0, 23, 59, 59)

    const records = await prisma.attendance.findMany({
        where: {
            staffId,
            date: { gte: start, lte: end },
        },
    })

    const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length
    const absent = records.filter((r) => r.status === "ABSENT").length
    const leave = records.filter((r) => r.status === "LEAVE").length
    const late = records.filter((r) => r.status === "LATE").length
    const totalHours = records.reduce((s, r) => s + Number(r.hoursWorked ?? 0), 0)

    return { present, absent, leave, late, totalHours, totalDays: records.length }
}

export async function deleteStaff(id: string) {
    try {
        // Soft delete — just deactivate
        await prisma.staff.update({
            where: { id },
            data: { isActive: false },
        })
        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch {
        return { success: false, error: "Không thể xoá nhân viên" }
    }
}
