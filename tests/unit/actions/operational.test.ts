/**
 * 🧪 Unit Tests — Operational (P1)
 * Tests service charge, 86 status, discount auth, table transfer
 */
import { describe, it, expect } from 'vitest'
import {
    calculateServiceCharge,
    getServiceChargeConfig,
    markProduct86,
    unmark86,
    get86List,
    isProduct86,
    get86ProductIds,
    authorizeDiscount,
    getDiscountLogs,
    transferTable,
    getTransferHistory,
} from '@/actions/operational'
import { prisma } from '@/lib/prisma'

describe('Operational — Service Charge (Real DB)', () => {
    it('U-OPS-01: calculateServiceCharge — DINE_IN should have charge', async () => {
        const result = await calculateServiceCharge(1500000, 'DINE_IN')
        expect(result).toHaveProperty('amount')
        expect(result).toHaveProperty('rate')
        expect(result).toHaveProperty('label')
        expect(result.amount).toBeGreaterThanOrEqual(0)
    })

    it('U-OPS-02: calculateServiceCharge — TAKEAWAY should have 0 charge', async () => {
        const result = await calculateServiceCharge(1500000, 'TAKEAWAY')
        expect(result.amount).toBe(0)
    })

    it('U-OPS-03: getServiceChargeConfig — should return config shape', async () => {
        const config = await getServiceChargeConfig()
        expect(config).toHaveProperty('enabled')
        expect(config).toHaveProperty('rate')
        expect(config).toHaveProperty('label')
        expect(config).toHaveProperty('applyTo')
    })
})

describe('Operational — 86 Out of Stock (Real DB)', () => {
    it('U-OPS-04: get86List — should return current 86 products', async () => {
        const list = await get86List()
        expect(Array.isArray(list)).toBe(true)
        for (const item of list) {
            expect(item).toHaveProperty('productId')
            expect(item).toHaveProperty('productName')
            expect(item).toHaveProperty('isAvailable')
        }
    })

    it('U-OPS-05: get86ProductIds — should return array of IDs', async () => {
        const ids = await get86ProductIds()
        expect(Array.isArray(ids)).toBe(true)
    })

    it('U-OPS-06: isProduct86 — should return boolean', async () => {
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!product) return
        const result = await isProduct86(product.id)
        expect(typeof result).toBe('boolean')
    })
})

describe('Operational — Discount Authorization (Real DB)', () => {
    it('U-OPS-07: authorizeDiscount — invalid PIN should reject without DB error', async () => {
        const result = await authorizeDiscount({
            managerPin: '9999',
            orderId: null,
            discountType: 'PERCENTAGE',
            discountValue: 10,
            originalTotal: 500000,
            reason: 'Test',
            requestedBy: '00000000-0000-0000-0000-000000000000',
            requestedByName: 'Test',
        })
        // PIN not found → returns early without auditLog creation
        expect(result.authorized).toBe(false)
        expect(result.success).toBe(false)
    })

    it('U-OPS-08: getDiscountLogs — should return discount auth history', async () => {
        const logs = await getDiscountLogs()
        expect(Array.isArray(logs)).toBe(true)
    })
})

describe('Operational — Transfer History (Real DB)', () => {
    it('U-OPS-10: getTransferHistory — should return transfer log', async () => {
        const history = await getTransferHistory()
        expect(Array.isArray(history)).toBe(true)
        if (history.length > 0) {
            expect(history[0]).toHaveProperty('orderId')
            expect(history[0]).toHaveProperty('fromTableNumber')
            expect(history[0]).toHaveProperty('toTableNumber')
        }
    })
})
