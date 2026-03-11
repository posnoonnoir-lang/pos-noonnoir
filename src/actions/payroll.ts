"use server"

import { prisma } from "@/lib/prisma"

export type PayrollRecord = {
    staffId: string
    staffName: string
    role: string
    baseSalary: number
    daysWorked: number
    totalHours: number
    overtimeHours: number
    regularPay: number
    overtimePay: number
    totalPay: number
    totalOrders: number
    totalRevenue: number
    bonus: number
}

const STANDARD_HOURS_PER_DAY = 8
const OVERTIME_MULTIPLIER = 1.5

export async function calculatePayroll(month?: number, year?: number) {
    const now = new Date()
    const m = month ?? now.getMonth()
    const y = year ?? now.getFullYear()
    const start = new Date(y, m, 1)
    const end = new Date(y, m + 1, 0, 23, 59, 59)

    const staffList = await prisma.staff.findMany({
        where: { isActive: true },
        include: {
            attendances: {
                where: { date: { gte: start, lte: end } },
            },
            orders: {
                where: {
                    status: "PAID",
                    createdAt: { gte: start, lte: end },
                },
                select: { totalAmount: true },
            },
            _count: {
                select: {
                    orders: {
                        where: {
                            status: "PAID",
                            createdAt: { gte: start, lte: end },
                        },
                    },
                },
            },
        },
    })

    const payroll: PayrollRecord[] = staffList.map((staff) => {
        const baseSalary = Number(staff.baseSalary)
        const daysInMonth = new Date(y, m + 1, 0).getDate()
        const dailyRate = baseSalary / daysInMonth

        const presentDays = staff.attendances.filter(
            (a) => a.status === "PRESENT" || a.status === "LATE"
        ).length

        const totalHours = staff.attendances.reduce(
            (sum, a) => sum + Number(a.hoursWorked ?? 0), 0
        )

        const standardHours = presentDays * STANDARD_HOURS_PER_DAY
        const overtimeHours = Math.max(0, totalHours - standardHours)

        const regularPay = Math.round(dailyRate * presentDays)
        const hourlyRate = dailyRate / STANDARD_HOURS_PER_DAY
        const overtimePay = Math.round(overtimeHours * hourlyRate * OVERTIME_MULTIPLIER)

        const totalRevenue = staff.orders.reduce(
            (sum, o) => sum + Number(o.totalAmount), 0
        )

        // Bonus: 1% of revenue if revenue > 5M
        const bonus = totalRevenue > 5_000_000 ? Math.round(totalRevenue * 0.01) : 0

        return {
            staffId: staff.id,
            staffName: staff.fullName,
            role: staff.role,
            baseSalary,
            daysWorked: presentDays,
            totalHours: Math.round(totalHours * 10) / 10,
            overtimeHours: Math.round(overtimeHours * 10) / 10,
            regularPay,
            overtimePay,
            totalPay: regularPay + overtimePay + bonus,
            totalOrders: staff._count.orders,
            totalRevenue,
            bonus,
        }
    })

    const totalPayroll = payroll.reduce((s, p) => s + p.totalPay, 0)
    const totalBonus = payroll.reduce((s, p) => s + p.bonus, 0)

    return {
        month: m,
        year: y,
        monthLabel: new Date(y, m).toLocaleDateString("vi-VN", { month: "long", year: "numeric" }),
        records: payroll,
        totalPayroll,
        totalBonus,
        totalStaff: payroll.length,
    }
}

export async function exportPayrollCSV(month?: number, year?: number) {
    const data = await calculatePayroll(month, year)
    const bom = "\uFEFF"
    const header = "Họ tên,Vai trò,Lương cơ bản,Ngày công,Giờ làm,OT (h),Lương thường,Lương OT,Thưởng,Tổng lương\n"
    const rows = data.records.map((r) =>
        `"${r.staffName}","${r.role}",${r.baseSalary},${r.daysWorked},${r.totalHours},${r.overtimeHours},${r.regularPay},${r.overtimePay},${r.bonus},${r.totalPay}`
    ).join("\n")
    return bom + header + rows
}
