/**
 * 🧪 Unit Tests — Reservations, Promotions, Procurement, Feedback (P2-P3)
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
    getReservations,
    getTodayReservations,
    createReservation,
    updateReservationStatus,
    deleteReservation,
    getReservationStats,
} from '@/actions/reservations'
import {
    getAllPromotions,
    getActivePromotions,
    getPromoStats,
} from '@/actions/promotions'
import {
    getSuppliers,
    createSupplier,
    getProcurementStats,
} from '@/actions/procurement'
import { getAllFeedback } from '@/actions/feedback'
import { prisma } from '@/lib/prisma'

const createdReservationIds: string[] = []
const createdSupplierIds: string[] = []

describe('Reservations (Real DB)', () => {
    afterAll(async () => {
        for (const id of createdReservationIds) {
            try { await deleteReservation(id) } catch { /* */ }
        }
    })

    it('U-RES-01: createReservation — should create reservation', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) return

        const result = await createReservation({
            customerName: 'Test Reservation',
            customerPhone: '0909999888',
            guestCount: 4,
            date: new Date().toISOString().split('T')[0],
            time: '19:00',
            source: 'PHONE',
            staffId: staff.id,
            staffName: staff.fullName,
        })
        expect(result.success).toBe(true)
        expect(result.reservation).toBeDefined()
        createdReservationIds.push(result.reservation!.id)
    })

    it('U-RES-02: getReservations — should return list', async () => {
        const reservations = await getReservations()
        expect(Array.isArray(reservations)).toBe(true)
    })

    it('U-RES-03: getTodayReservations — should return today only', async () => {
        const today = await getTodayReservations()
        expect(Array.isArray(today)).toBe(true)
        const todayStr = new Date().toISOString().split('T')[0]
        for (const r of today) {
            expect(r.date).toBe(todayStr)
        }
    })

    it('U-RES-04: updateReservationStatus — should confirm reservation', async () => {
        if (createdReservationIds.length === 0) return
        const result = await updateReservationStatus(createdReservationIds[0], 'CONFIRMED')
        expect(result.success).toBe(true)
    })

    it('U-RES-05: getReservationStats — should return today stats', async () => {
        const stats = await getReservationStats()
        expect(stats).toHaveProperty('todayTotal')
        expect(stats).toHaveProperty('pending')
        expect(stats).toHaveProperty('confirmed')
        expect(stats).toHaveProperty('totalGuests')
    })

    it('U-RES-06: deleteReservation — should remove reservation', async () => {
        if (createdReservationIds.length === 0) return
        const result = await deleteReservation(createdReservationIds[0])
        expect(result.success).toBe(true)
        createdReservationIds.length = 0 // No need to cleanup
    })
})

describe('Promotions (Real DB)', () => {
    it('U-PRO-01: getAllPromotions — should return list', async () => {
        const promos = await getAllPromotions()
        expect(Array.isArray(promos)).toBe(true)
    })

    it('U-PRO-02: getActivePromotions — should return only active', async () => {
        const promos = await getActivePromotions()
        expect(Array.isArray(promos)).toBe(true)
        for (const p of promos) {
            expect(p.status).toBe('ACTIVE')
        }
    })

    it('U-PRO-03: getPromoStats — should return promo stats', async () => {
        const stats = await getPromoStats()
        expect(stats).toHaveProperty('totalPromotions')
        expect(stats).toHaveProperty('activeNow')
        expect(stats).toHaveProperty('totalDiscountGiven')
    })
})

describe('Procurement (Real DB)', () => {
    afterAll(async () => {
        for (const id of createdSupplierIds) {
            try { await prisma.supplier.delete({ where: { id } }) } catch { /* */ }
        }
        await prisma.$disconnect()
    })

    it('U-SUP-01: getSuppliers — should return supplier list', async () => {
        const suppliers = await getSuppliers()
        expect(Array.isArray(suppliers)).toBe(true)
        if (suppliers.length > 0) {
            expect(suppliers[0]).toHaveProperty('name')
            expect(suppliers[0]).toHaveProperty('totalConsignments')
        }
    })

    it('U-SUP-02: createSupplier — should create new supplier', async () => {
        const result = await createSupplier({
            name: 'Test Supplier Unit',
            contactName: 'Nguyen Van A',
            phone: '0281234567',
        })
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        createdSupplierIds.push(result.data!.id)
    })

    it('U-SUP-03: getProcurementStats — should return stats', async () => {
        const stats = await getProcurementStats()
        expect(stats).toHaveProperty('totalSuppliers')
        expect(stats).toHaveProperty('activeConsignments')
        expect(stats.totalSuppliers).toBeGreaterThan(0)
    })
})

describe('Feedback (Real DB)', () => {
    it('U-FDB-01: getAllFeedback — should return sessions and stats', async () => {
        const result = await getAllFeedback()
        expect(result).toHaveProperty('sessions')
        expect(result).toHaveProperty('stats')
        expect(Array.isArray(result.sessions)).toBe(true)
        expect(result.stats).toHaveProperty('total')
        expect(result.stats).toHaveProperty('avgOverall')
        expect(result.stats).toHaveProperty('distribution')
    })
})
