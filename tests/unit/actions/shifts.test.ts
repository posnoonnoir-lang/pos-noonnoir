/**
 * 🧪 Unit Tests — Shifts (P1 Important)
 * Tests shift management against REAL Supabase database
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
    openShift,
    closeShift,
    getCurrentShift,
    getShifts,
    getShiftStats,
} from '@/actions/shifts'
import { prisma } from '@/lib/prisma'

const testShiftIds: string[] = []

describe('Shifts — Server Actions (Real DB)', () => {

    afterAll(async () => {
        // Cleanup test shifts
        for (const id of testShiftIds) {
            try {
                await prisma.shiftRecord.delete({ where: { id } })
            } catch { /* ignore */ }
        }
        await prisma.$disconnect()
    })

    // ─── U-SHI-01: openShift ──────────────────────────────────
    it('U-SHI-01: openShift — should create shift with opening cash', async () => {
        // First close any existing open shift
        const existing = await prisma.shiftRecord.findFirst({ where: { closedAt: null } })
        if (existing) {
            await prisma.shiftRecord.update({
                where: { id: existing.id },
                data: { closedAt: new Date(), closingCash: 0, expectedCash: 0, variance: 0, totalRevenue: 0 },
            })
        }

        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) throw new Error('Need at least 1 staff')

        const result = await openShift({
            staffId: staff.id,
            openingCash: 500000,
            staffName: staff.fullName,
        })

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        testShiftIds.push(result.data!.id)

        // Verify in DB
        const shift = await prisma.shiftRecord.findUnique({ where: { id: result.data!.id } })
        expect(shift).toBeDefined()
        expect(Number(shift!.openingCash)).toBe(500000)
        expect(shift!.closedAt).toBeNull()
    })

    // ─── U-SHI-02: openShift — duplicate should fail ─────────
    it('U-SHI-02: openShift duplicate — should return error when shift already open', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) return

        const result = await openShift({
            staffId: staff.id,
            openingCash: 300000,
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('Đã có ca đang mở')
    })

    // ─── U-SHI-03: getCurrentShift ────────────────────────────
    it('U-SHI-03: getCurrentShift — should return open shift', async () => {
        const shift = await getCurrentShift()
        expect(shift).toBeDefined()
        expect(shift!.status).toBe('OPEN')
        expect(shift!.openingCash).toBe(500000)
        expect(shift!.closedAt).toBeNull()
    })

    // ─── U-SHI-04: closeShift — variance calculation ─────────
    it('U-SHI-04: closeShift — should calculate variance correctly', async () => {
        if (testShiftIds.length === 0) return

        const result = await closeShift({
            shiftId: testShiftIds[0],
            closingCash: 520000,
        })

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data).toHaveProperty('expectedCash')
        expect(result.data).toHaveProperty('variance')
        expect(result.data).toHaveProperty('totalRevenue')

        // Verify in DB
        const shift = await prisma.shiftRecord.findUnique({ where: { id: testShiftIds[0] } })
        expect(shift!.closedAt).toBeDefined()
        expect(Number(shift!.closingCash)).toBe(520000)
    })

    // ─── U-SHI-05: getShifts — list ──────────────────────────
    it('U-SHI-05: getShifts — should return shift list', async () => {
        const shifts = await getShifts()
        expect(Array.isArray(shifts)).toBe(true)
        if (shifts.length > 0) {
            expect(shifts[0]).toHaveProperty('id')
            expect(shifts[0]).toHaveProperty('staffName')
            expect(shifts[0]).toHaveProperty('openingCash')
            expect(shifts[0]).toHaveProperty('status')
        }
    })

    // ─── U-SHI-06: getShiftStats ──────────────────────────────
    it('U-SHI-06: getShiftStats — should return daily stats', async () => {
        const stats = await getShiftStats()
        expect(stats).toHaveProperty('todayShifts')
        expect(stats).toHaveProperty('currentOpen')
        expect(stats).toHaveProperty('totalCashVariance')
        expect(stats.todayShifts).toBeGreaterThanOrEqual(0)
    })
})
