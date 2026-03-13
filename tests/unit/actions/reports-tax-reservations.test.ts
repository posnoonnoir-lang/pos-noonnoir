/**
 * 🧪 Unit Tests — Reports, Tax, Reservations
 * Tests dashboard stats, weekly revenue, tax CRUD, reservation flows
 */
import { describe, it, expect, afterAll } from 'vitest'
import { getDashboardStats, getWeeklyRevenue, getTopProducts, getHourlyData, getPaymentBreakdown, getStaffPerformance } from '@/actions/reports'
import { getTaxRates, calculateTax, getDefaultTaxRate, getTaxConfig } from '@/actions/tax'
import { getReservations, getTodayReservations, createReservation, getReservationStats, deleteReservation, updateReservationStatus } from '@/actions/reservations'
import { prisma } from '@/lib/prisma'

const testReservationIds: string[] = []

afterAll(async () => {
    for (const id of testReservationIds) {
        try { await prisma.reservation.delete({ where: { id } }) } catch { /* */ }
    }
    await prisma.$disconnect()
})

// ─── REPORTS ──────────────────────────────────────────────────

describe('Reports — Dashboard (Real DB)', () => {
    it('U-RPT-01: getDashboardStats — should return today KPIs', async () => {
        const stats = await getDashboardStats()
        expect(stats).toHaveProperty('todayRevenue')
        expect(stats).toHaveProperty('todayOrders')
        expect(stats).toHaveProperty('revenueChange')
        expect(stats).toHaveProperty('avgOrderValue')
        expect(stats).toHaveProperty('tableOccupancy')
        expect(typeof stats.todayRevenue).toBe('number')
        expect(typeof stats.todayOrders).toBe('number')
    })

    it('U-RPT-02: getWeeklyRevenue — should return 7 days', async () => {
        const weekly = await getWeeklyRevenue()
        expect(Array.isArray(weekly)).toBe(true)
        expect(weekly.length).toBe(7)
        for (const d of weekly) {
            expect(d).toHaveProperty('date')
            expect(d).toHaveProperty('revenue')
            expect(d).toHaveProperty('orders')
        }
    })

    it('U-RPT-03: getTopProducts — sorted by revenue desc', async () => {
        const products = await getTopProducts()
        expect(Array.isArray(products)).toBe(true)
        for (const p of products) {
            expect(p).toHaveProperty('name')
            expect(p).toHaveProperty('quantity')
            expect(p).toHaveProperty('revenue')
            expect(p).toHaveProperty('category')
        }
        for (let i = 1; i < products.length; i++) {
            expect(products[i].revenue).toBeLessThanOrEqual(products[i - 1].revenue)
        }
    })

    it('U-RPT-04: getHourlyData — should return hour × orders/revenue', async () => {
        const hourly = await getHourlyData()
        expect(Array.isArray(hourly)).toBe(true)
        for (const h of hourly) {
            expect(h).toHaveProperty('hour')
            expect(h).toHaveProperty('orders')
            expect(h).toHaveProperty('revenue')
        }
    })

    it('U-RPT-05: getPaymentBreakdown — percentages sum ≈ 100', async () => {
        const breakdown = await getPaymentBreakdown()
        expect(Array.isArray(breakdown)).toBe(true)
        for (const b of breakdown) {
            expect(b).toHaveProperty('method')
            expect(b).toHaveProperty('count')
            expect(b).toHaveProperty('total')
            expect(b).toHaveProperty('percentage')
        }
        if (breakdown.length > 0) {
            const total = breakdown.reduce((s, b) => s + b.percentage, 0)
            expect(total).toBeGreaterThanOrEqual(99)
            expect(total).toBeLessThanOrEqual(101)
        }
    })

    it('U-RPT-06: getStaffPerformance — should return staff list', async () => {
        const perf = await getStaffPerformance()
        expect(Array.isArray(perf)).toBe(true)
        for (const p of perf) {
            expect(p).toHaveProperty('name')
            expect(p).toHaveProperty('orders')
            expect(p).toHaveProperty('revenue')
            expect(p).toHaveProperty('avgTime')
        }
    })
})

// ─── TAX ──────────────────────────────────────────────────────

describe('Tax (Real DB)', () => {
    it('U-TAX-01: getTaxRates — should return tax rate list', async () => {
        const rates = await getTaxRates()
        expect(Array.isArray(rates)).toBe(true)
        for (const r of rates) {
            expect(r).toHaveProperty('id')
            expect(r).toHaveProperty('name')
            expect(r).toHaveProperty('rate')
            expect(typeof r.rate).toBe('number')
        }
    })

    it('U-TAX-02: calculateTax — with valid rate should return amount', async () => {
        const rates = await getTaxRates()
        if (rates.length === 0) return
        const result = await calculateTax(1000000, rates[0].id)
        expect(result.taxAmount).toBe(Math.round(1000000 * rates[0].rate / 100))
        expect(result.taxRate).toBe(rates[0].rate)
        expect(result.taxName).toBe(rates[0].name)
    })

    it('U-TAX-03: calculateTax — without rateId should return 0', async () => {
        const result = await calculateTax(1000000)
        expect(result.taxAmount).toBe(0)
    })

    it('U-TAX-04: getDefaultTaxRate — should return rate or null', async () => {
        const rate = await getDefaultTaxRate()
        if (rate) {
            expect(rate).toHaveProperty('id')
            expect(rate).toHaveProperty('name')
            expect(rate).toHaveProperty('rate')
        }
    })

    it('U-TAX-05: getTaxConfig — should return config object', async () => {
        const config = await getTaxConfig()
        expect(config).toHaveProperty('enabled')
        expect(config).toHaveProperty('inclusive')
    })
})

// ─── RESERVATIONS ─────────────────────────────────────────────

describe('Reservations (Real DB)', () => {
    let reservationId: string

    it('U-RSV-01: createReservation — should create new reservation', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) return

        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 7)
        const dateStr = futureDate.toISOString().split('T')[0]

        const result = await createReservation({
            customerName: 'Test Customer',
            customerPhone: '0909123456',
            guestCount: 4,
            date: dateStr,
            time: '19:00',
            source: 'PHONE',
            staffId: staff.id,
            staffName: staff.fullName,
        })
        expect(result.success).toBe(true)
        if (result.reservation) {
            reservationId = result.reservation.id
            testReservationIds.push(reservationId)
        }
    })

    it('U-RSV-02: getReservations — should return all reservations', async () => {
        const reservations = await getReservations()
        expect(Array.isArray(reservations)).toBe(true)
        if (reservations.length > 0) {
            expect(reservations[0]).toHaveProperty('id')
            expect(reservations[0]).toHaveProperty('customerName')
            expect(reservations[0]).toHaveProperty('status')
            expect(reservations[0]).toHaveProperty('source')
        }
    })

    it('U-RSV-03: getTodayReservations — should return today only', async () => {
        const today = await getTodayReservations()
        expect(Array.isArray(today)).toBe(true)
    })

    it('U-RSV-04: updateReservationStatus — PENDING → CONFIRMED', async () => {
        if (!reservationId) return
        const result = await updateReservationStatus(reservationId, 'CONFIRMED')
        expect(result.success).toBe(true)
    })

    it('U-RSV-05: getReservationStats — should return today stats', async () => {
        const stats = await getReservationStats()
        expect(stats).toHaveProperty('todayTotal')
        expect(stats).toHaveProperty('pending')
        expect(stats).toHaveProperty('confirmed')
        expect(stats).toHaveProperty('seated')
        expect(stats).toHaveProperty('noShow')
        expect(stats).toHaveProperty('totalGuests')
        expect(typeof stats.todayTotal).toBe('number')
    })

    it('U-RSV-06: deleteReservation — cleanup test reservation', async () => {
        if (!reservationId) return
        const result = await deleteReservation(reservationId)
        expect(result.success).toBe(true)
        // Remove from cleanup since deleted
        const idx = testReservationIds.indexOf(reservationId)
        if (idx >= 0) testReservationIds.splice(idx, 1)
    })
})
