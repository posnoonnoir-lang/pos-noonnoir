"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type Shift = {
    id: string; staffId: string; staffName: string
    shiftNumber?: string
    openingCash: number; closingCash: number | null
    expectedCash: number | null; variance: number | null
    cashDifference?: number | null
    totalRevenue: number | null; totalSales?: number
    totalCash?: number; totalCard?: number; totalQR?: number
    orderCount?: number; itemsSold?: number
    transactions?: Array<{ id?: string; type: string; amount: number; time: Date; description?: string }>
    status: string
    openedAt: Date; closedAt: Date | null
}

export async function addShiftExpense(_params: { shiftId: string; amount: number; description: string; staffName?: string }) {
    return { success: true }
}


// ============================================================
// SHIFT MANAGEMENT
// ============================================================

export async function getShifts() {
    const shifts = await prisma.shiftRecord.findMany({
        include: { staff: true },
        orderBy: { openedAt: "desc" },
        take: 50,
    })
    return shifts.map((s) => ({
        id: s.id,
        staffId: s.staffId,
        staffName: s.staff.fullName,
        openingCash: Number(s.openingCash),
        closingCash: s.closingCash ? Number(s.closingCash) : null,
        expectedCash: s.expectedCash ? Number(s.expectedCash) : null,
        variance: s.variance ? Number(s.variance) : null,
        totalRevenue: s.totalRevenue ? Number(s.totalRevenue) : null,
        status: s.closedAt ? "CLOSED" : "OPEN",
        openedAt: s.openedAt,
        closedAt: s.closedAt,
    }))
}

export async function getCurrentShift() {
    const shift = await prisma.shiftRecord.findFirst({
        where: { closedAt: null },
        include: { staff: true },
        orderBy: { openedAt: "desc" },
    })
    if (!shift) return null
    return {
        id: shift.id,
        staffId: shift.staffId,
        staffName: shift.staff.fullName,
        openingCash: Number(shift.openingCash),
        closingCash: null,
        expectedCash: null,
        variance: null,
        totalRevenue: null,
        status: "OPEN",
        openedAt: shift.openedAt,
        closedAt: null,
    } as Shift
}

export async function openShift(params: { staffId: string; openingCash: number; staffName?: string; staffRole?: string }) {
    const existing = await prisma.shiftRecord.findFirst({ where: { closedAt: null } })
    if (existing) return { success: false, error: "Đã có ca đang mở" }

    try {
        const shift = await prisma.shiftRecord.create({
            data: {
                staffId: params.staffId,
                openingCash: params.openingCash,
            },
        })
        revalidatePath("/dashboard/finance")
        return { success: true, data: shift }
    } catch {
        return { success: false, error: "Không thể mở ca" }
    }
}

export async function closeShift(params: { shiftId: string; closingCash: number; notes?: string }) {
    try {
        const shift = await prisma.shiftRecord.findUnique({ where: { id: params.shiftId } })
        if (!shift) return { success: false, error: "Không tìm thấy ca" }

        // Calculate expected cash from today's orders
        const paidOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: shift.openedAt },
                status: "PAID",
            },
            include: { payments: { where: { method: "CASH" } } },
        })

        const cashRevenue = paidOrders.reduce(
            (s, o) => s + o.payments.reduce((ps, p) => ps + Number(p.amount), 0), 0
        )
        const expectedCash = Number(shift.openingCash) + cashRevenue
        const variance = params.closingCash - expectedCash
        const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.totalAmount), 0)

        await prisma.shiftRecord.update({
            where: { id: params.shiftId },
            data: {
                closingCash: params.closingCash,
                expectedCash,
                variance,
                totalRevenue,
                closedAt: new Date(),
            },
        })

        revalidatePath("/dashboard/finance")
        return { success: true, data: { expectedCash, variance, totalRevenue, cashDifference: variance } }
    } catch {
        return { success: false, error: "Không thể đóng ca" }
    }
}

export async function getShiftStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayShifts = await prisma.shiftRecord.findMany({
        where: { openedAt: { gte: today } },
    })

    return {
        todayShifts: todayShifts.length,
        currentOpen: todayShifts.filter((s) => !s.closedAt).length > 0,
        totalCashVariance: todayShifts.reduce((s, sh) => s + Number(sh.variance ?? 0), 0),
    }
}
