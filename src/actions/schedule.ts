"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type ScheduleEntry = {
    id: string
    staffId: string
    staffName: string
    role: string
    date: string
    shiftType: string
    startTime: string
    endTime: string
    note: string | null
}

import { SHIFT_TYPES } from "@/lib/shift-types"

export async function getWeekSchedule(weekStartDate: string) {
    const start = new Date(weekStartDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59)

    const schedules = await prisma.staffSchedule.findMany({
        where: { date: { gte: start, lte: end } },
        include: { staff: { select: { fullName: true, role: true } } },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
    })

    return schedules.map((s) => ({
        id: s.id,
        staffId: s.staffId,
        staffName: s.staff.fullName,
        role: s.staff.role,
        date: s.date.toISOString().split("T")[0],
        shiftType: s.shiftType,
        startTime: s.startTime,
        endTime: s.endTime,
        note: s.note,
    }))
}

export async function assignShift(data: {
    staffId: string
    date: string
    shiftType: string
    startTime?: string
    endTime?: string
    note?: string
}) {
    const shiftConfig = SHIFT_TYPES[data.shiftType]
    const startTime = data.startTime ?? shiftConfig?.start ?? "10:00"
    const endTime = data.endTime ?? shiftConfig?.end ?? "22:00"

    try {
        await prisma.staffSchedule.upsert({
            where: {
                staffId_date: {
                    staffId: data.staffId,
                    date: new Date(data.date),
                },
            },
            create: {
                staffId: data.staffId,
                date: new Date(data.date),
                shiftType: data.shiftType,
                startTime,
                endTime,
                note: data.note,
            },
            update: {
                shiftType: data.shiftType,
                startTime,
                endTime,
                note: data.note,
            },
        })
        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch {
        return { success: false, error: "Không thể gán ca" }
    }
}

export async function removeShift(staffId: string, date: string) {
    try {
        await prisma.staffSchedule.delete({
            where: {
                staffId_date: {
                    staffId,
                    date: new Date(date),
                },
            },
        })
        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch {
        return { success: false, error: "Không tìm thấy lịch ca" }
    }
}

export async function copyWeekSchedule(fromWeekStart: string, toWeekStart: string) {
    const from = new Date(fromWeekStart)
    const to = new Date(toWeekStart)
    const fromEnd = new Date(from)
    fromEnd.setDate(fromEnd.getDate() + 6)

    const sourceSchedules = await prisma.staffSchedule.findMany({
        where: { date: { gte: from, lte: fromEnd } },
    })

    if (sourceSchedules.length === 0) {
        return { success: false, error: "Tuần nguồn không có lịch" }
    }

    const daysDiff = Math.round((to.getTime() - from.getTime()) / 86400000)

    let created = 0
    for (const sched of sourceSchedules) {
        const newDate = new Date(sched.date)
        newDate.setDate(newDate.getDate() + daysDiff)

        try {
            await prisma.staffSchedule.upsert({
                where: {
                    staffId_date: {
                        staffId: sched.staffId,
                        date: newDate,
                    },
                },
                create: {
                    staffId: sched.staffId,
                    date: newDate,
                    shiftType: sched.shiftType,
                    startTime: sched.startTime,
                    endTime: sched.endTime,
                    note: sched.note,
                },
                update: {
                    shiftType: sched.shiftType,
                    startTime: sched.startTime,
                    endTime: sched.endTime,
                },
            })
            created++
        } catch {
            // Skip conflicts
        }
    }

    revalidatePath("/dashboard/staff")
    return { success: true, count: created }
}
