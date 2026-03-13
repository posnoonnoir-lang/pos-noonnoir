/**
 * 🧪 Unit Tests — HR: Attendance, Payroll, Schedule (P2)
 * Tests check-in/out, payroll calculation, weekly schedule
 */
import { describe, it, expect } from 'vitest'
import { getTodayAttendance, getAttendanceSummary } from '@/actions/attendance'
import { calculatePayroll, exportPayrollCSV } from '@/actions/payroll'
import { getWeekSchedule, assignShift, removeShift } from '@/actions/schedule'
import { prisma } from '@/lib/prisma'

// ─── ATTENDANCE ───────────────────────────────────────────────

describe('Attendance (Real DB)', () => {
    it('U-ATT-01: getTodayAttendance — should return today records', async () => {
        const records = await getTodayAttendance()
        expect(Array.isArray(records)).toBe(true)
        for (const r of records) {
            expect(r).toHaveProperty('id')
            expect(r).toHaveProperty('staffId')
            expect(r).toHaveProperty('staffName')
            expect(r).toHaveProperty('date')
            expect(r).toHaveProperty('status')
            expect(['PRESENT', 'LATE', 'ABSENT', 'LEAVE']).toContain(r.status)
        }
    })

    it('U-ATT-02: getAttendanceSummary — should return attendance stats', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) return
        const summary = await getAttendanceSummary(staff.id)
        expect(summary).toHaveProperty('present')
        expect(summary).toHaveProperty('absent')
        expect(summary).toHaveProperty('leave')
        expect(summary).toHaveProperty('late')
        expect(summary).toHaveProperty('totalHours')
        expect(summary).toHaveProperty('totalDays')
        expect(typeof summary.present).toBe('number')
        expect(typeof summary.totalHours).toBe('number')
    })
})

// ─── PAYROLL ──────────────────────────────────────────────────

describe('Payroll (Real DB)', () => {
    it('U-PAY-01: calculatePayroll — should return payroll records', async () => {
        const payroll = await calculatePayroll()
        expect(payroll).toHaveProperty('month')
        expect(payroll).toHaveProperty('year')
        expect(payroll).toHaveProperty('monthLabel')
        expect(payroll).toHaveProperty('records')
        expect(payroll).toHaveProperty('totalPayroll')
        expect(payroll).toHaveProperty('totalBonus')
        expect(payroll).toHaveProperty('totalStaff')
        expect(Array.isArray(payroll.records)).toBe(true)
    })

    it('U-PAY-02: calculatePayroll — each record has correct fields', async () => {
        const payroll = await calculatePayroll()
        for (const r of payroll.records) {
            expect(r).toHaveProperty('staffId')
            expect(r).toHaveProperty('staffName')
            expect(r).toHaveProperty('role')
            expect(r).toHaveProperty('baseSalary')
            expect(r).toHaveProperty('daysWorked')
            expect(r).toHaveProperty('regularPay')
            expect(r).toHaveProperty('overtimePay')
            expect(r).toHaveProperty('bonus')
            expect(r).toHaveProperty('totalPay')
            // totalPay = regularPay + overtimePay + bonus
            expect(r.totalPay).toBe(r.regularPay + r.overtimePay + r.bonus)
        }
    })

    it('U-PAY-03: calculatePayroll — bonus only if revenue > 5M', async () => {
        const payroll = await calculatePayroll()
        for (const r of payroll.records) {
            if (r.totalRevenue > 5_000_000) {
                expect(r.bonus).toBe(Math.round(r.totalRevenue * 0.01))
            } else {
                expect(r.bonus).toBe(0)
            }
        }
    })

    it('U-PAY-04: exportPayrollCSV — should return CSV string with BOM', async () => {
        const csv = await exportPayrollCSV()
        expect(typeof csv).toBe('string')
        expect(csv.startsWith('\uFEFF')).toBe(true)
        expect(csv).toContain('Họ tên')
        expect(csv).toContain('Tổng lương')
    })
})

// ─── SCHEDULE ─────────────────────────────────────────────────

describe('Schedule (Real DB)', () => {
    it('U-SCH-01: getWeekSchedule — should return schedule entries', async () => {
        // Get current week's Monday
        const now = new Date()
        const dayOfWeek = now.getDay()
        const monday = new Date(now)
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
        const weekStart = monday.toISOString().split('T')[0]

        const schedule = await getWeekSchedule(weekStart)
        expect(Array.isArray(schedule)).toBe(true)
        for (const s of schedule) {
            expect(s).toHaveProperty('id')
            expect(s).toHaveProperty('staffId')
            expect(s).toHaveProperty('staffName')
            expect(s).toHaveProperty('role')
            expect(s).toHaveProperty('date')
            expect(s).toHaveProperty('shiftType')
            expect(s).toHaveProperty('startTime')
            expect(s).toHaveProperty('endTime')
        }
    })

    it('U-SCH-02: assignShift + removeShift — roundtrip', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) return

        // Use a future date to avoid conflicts
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 30)
        const dateStr = futureDate.toISOString().split('T')[0]

        const assignResult = await assignShift({
            staffId: staff.id,
            date: dateStr,
            shiftType: 'MORNING',
        })
        expect(assignResult.success).toBe(true)

        // Clean up
        const removeResult = await removeShift(staff.id, dateStr)
        expect(removeResult.success).toBe(true)
    })
})
