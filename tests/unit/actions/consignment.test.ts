/**
 * 🧪 Unit Tests — Consignment (P1)
 * Tests consignment CRUD, settlement, and stats
 */
import { describe, it, expect } from 'vitest'
import {
    getConsignments,
    getConsignmentStats,
    getConsignmentById,
    getSettlements,
} from '@/actions/consignment'

describe('Consignment — Read Operations (Real DB)', () => {
    it('U-CON-01: getConsignments — should return consignment list', async () => {
        const consignments = await getConsignments()
        expect(Array.isArray(consignments)).toBe(true)
        if (consignments.length > 0) {
            const c = consignments[0]
            expect(c).toHaveProperty('id')
            expect(c).toHaveProperty('consignmentNo')
            expect(c).toHaveProperty('supplierName')
            expect(c).toHaveProperty('status')
            expect(c).toHaveProperty('totalItems')
            expect(c).toHaveProperty('soldItems')
            expect(c).toHaveProperty('totalRevenue')
        }
    })

    it('U-CON-02: getConsignmentStats — should return aggregate stats', async () => {
        const stats = await getConsignmentStats()
        expect(stats).toHaveProperty('totalConsignments')
        expect(stats).toHaveProperty('activeConsignments')
        expect(stats).toHaveProperty('totalItems')
        expect(stats).toHaveProperty('soldItems')
        expect(stats).toHaveProperty('totalRevenue')
        expect(typeof stats.totalConsignments).toBe('number')
        expect(typeof stats.activeConsignments).toBe('number')
    })

    it('U-CON-03: getConsignmentById — valid ID should return consignment detail', async () => {
        const consignments = await getConsignments()
        if (consignments.length === 0) {
            console.log('⚠️ No consignments — skipping')
            return
        }
        const detail = await getConsignmentById(consignments[0].id)
        expect(detail).not.toBeNull()
        expect(detail).toHaveProperty('id')
        expect(detail).toHaveProperty('items')
        expect(Array.isArray(detail!.items)).toBe(true)
    })

    it('U-CON-04: getConsignmentById — fake ID should return null', async () => {
        const detail = await getConsignmentById('00000000-0000-0000-0000-000000000000')
        expect(detail).toBeNull()
    })
})

describe('Consignment — Settlements (Real DB)', () => {
    it('U-CON-05: getSettlements — should return settlement list', async () => {
        const settlements = await getSettlements()
        expect(Array.isArray(settlements)).toBe(true)
        if (settlements.length > 0) {
            const s = settlements[0]
            expect(s).toHaveProperty('id')
            expect(s).toHaveProperty('consignmentNo')
            expect(s).toHaveProperty('supplierName')
            expect(s).toHaveProperty('totalRevenue')
            expect(s).toHaveProperty('commissionAmount')
            expect(s).toHaveProperty('amountDue')
            expect(s).toHaveProperty('status')
        }
    })

    it('U-CON-06: getConsignmentStats — total includes all statuses', async () => {
        const stats = await getConsignmentStats()
        expect(stats.totalConsignments).toBeGreaterThanOrEqual(stats.activeConsignments)
    })
})
