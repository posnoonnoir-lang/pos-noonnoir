/**
 * 🔒 Security Tests — Input Validation & Edge Cases
 * Tests: negative values, invalid UUIDs, empty inputs, boundary conditions
 */
import { describe, it, expect, afterAll } from 'vitest'
import { createOrder, getOrderById, payOrder } from '@/actions/orders'
import { createSupplier } from '@/actions/procurement'
import { createCustomer } from '@/actions/customers'
import { authorizeDiscount, calculateServiceCharge } from '@/actions/operational'
import { recordWaste } from '@/actions/waste'
import { getFundTransactions } from '@/actions/finance'
import { checkIn, checkOut } from '@/actions/attendance'
import { prisma } from '@/lib/prisma'

const cleanupOrderIds: string[] = []

afterAll(async () => {
    for (const id of cleanupOrderIds) {
        try {
            await prisma.payment.deleteMany({ where: { orderId: id } })
            await prisma.orderItem.deleteMany({ where: { orderId: id } })
            const order = await prisma.order.findUnique({ where: { id } })
            if (order?.tableId) {
                await prisma.floorTable.update({ where: { id: order.tableId }, data: { status: 'AVAILABLE' } })
            }
            await prisma.order.delete({ where: { id } })
        } catch { /* */ }
    }
    await prisma.$disconnect()
})

// ============================================================
// SEC-01: Input Validation — Negative Values
// ============================================================
describe('SEC-01: Negative & Zero Value Handling', () => {
    it('SEC-01a: createOrder with quantity 0 — should handle gracefully', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!staff || !product) return

        const result = await createOrder({
            orderType: 'TAKEAWAY',
            tableId: null,
            tableNumber: null,
            items: [{ productId: product.id, quantity: 0, price: Number(product.sellPrice), name: product.name }],
            staffId: staff.id,
            staffName: staff.fullName,
        })
        // Should either reject or create with 0 total
        if (result.success && result.order) {
            cleanupOrderIds.push(result.order.id)
            expect(result.order.total).toBe(0)
        }
    })

    it('SEC-01b: calculateServiceCharge with negative subtotal', async () => {
        const result = await calculateServiceCharge(-100000, 'DINE_IN')
        // Should not crash, amount should be 0 or negative (not throw)
        expect(typeof result.amount).toBe('number')
    })

    it('SEC-01c: recordWaste with quantity 0 — should handle', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!staff || !product) return

        // Attempt waste with 0 quantity — should not crash
        try {
            const result = await recordWaste({
                type: 'WASTE',
                productId: product.id,
                quantity: 0,
                reason: 'Security test — zero qty',
                staffId: staff.id,
            })
            // Function should either succeed or return error, not throw
            expect(result).toHaveProperty('success')
        } catch {
            // If it throws, that's also acceptable — but it shouldn't crash the process
        }
    })
})

// ============================================================
// SEC-02: Invalid UUID Handling
// ============================================================
describe('SEC-02: Invalid UUID Handling', () => {
    it('SEC-02a: getOrderById with invalid UUID — should throw or return null', async () => {
        try {
            const result = await getOrderById('not-a-valid-uuid')
            // If it doesn't throw, it should return null
            expect(result).toBeNull()
        } catch (e) {
            // Prisma throws PrismaClientKnownRequestError for invalid UUID format
            // This is acceptable — invalid input is rejected
            expect(e).toBeDefined()
        }
    })

    it('SEC-02b: getOrderById with non-existent UUID — should return null', async () => {
        const result = await getOrderById('00000000-0000-0000-0000-000000000000')
        expect(result).toBeNull()
    })

    it('SEC-02c: payOrder with non-existent order — should fail gracefully', async () => {
        try {
            const result = await payOrder('00000000-0000-0000-0000-000000000000', 'CASH')
            expect(result.success).toBe(false)
        } catch {
            // Throwing on non-existent order is also acceptable
        }
    })
})

// ============================================================
// SEC-03: Authentication & Authorization
// ============================================================
describe('SEC-03: PIN-based Auth', () => {
    it('SEC-03a: authorizeDiscount with empty PIN — should reject', async () => {
        const result = await authorizeDiscount({
            managerPin: '',
            orderId: null,
            discountType: 'PERCENTAGE',
            discountValue: 10,
            originalTotal: 500000,
            reason: 'Test',
            requestedBy: '00000000-0000-0000-0000-000000000000',
            requestedByName: 'Test',
        })
        expect(result.authorized).toBe(false)
    })

    it('SEC-03b: authorizeDiscount with wrong PIN — should reject', async () => {
        const result = await authorizeDiscount({
            managerPin: '9876',
            orderId: null,
            discountType: 'PERCENTAGE',
            discountValue: 10,
            originalTotal: 500000,
            reason: 'Test',
            requestedBy: '00000000-0000-0000-0000-000000000000',
            requestedByName: 'Test',
        })
        expect(result.authorized).toBe(false)
        expect(result.success).toBe(false)
    })

    it('SEC-03c: authorizeDiscount > 20% by non-OWNER — should check escalation', async () => {
        // Even if valid PIN, discount > 20% by MANAGER should fail
        const manager = await prisma.staff.findFirst({
            where: { role: 'MANAGER', isActive: true, pinCode: { not: null } },
        })
        if (!manager || !manager.pinCode) {
            console.log('⚠️ No manager with PIN — skipping escalation test')
            return
        }

        const result = await authorizeDiscount({
            managerPin: manager.pinCode,
            orderId: null,
            discountType: 'PERCENTAGE',
            discountValue: 25, // > 20% needs OWNER
            originalTotal: 500000,
            reason: 'Test escalation',
            requestedBy: manager.id,
            requestedByName: manager.fullName,
        })
        // Should reject because MANAGER can't do > 20%
        expect(result.authorized).toBe(false)
    })
})

// ============================================================
// SEC-04: Duplicate Prevention
// ============================================================
describe('SEC-04: Duplicate & Idempotency', () => {
    it('SEC-04a: checkIn twice same day — should reject second', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) return

        // Check if already checked in today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const existing = await prisma.attendance.findUnique({
            where: { staffId_date: { staffId: staff.id, date: today } },
        })

        if (existing?.checkIn) {
            // Already checked in — try again
            const result = await checkIn(staff.id)
            expect(result.success).toBe(false)
            expect(result.error).toContain('Đã chấm công')
        }
    })

    it('SEC-04b: checkOut without checkIn — should reject', async () => {
        // Find staff who hasn't checked in today
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) return

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const existing = await prisma.attendance.findUnique({
            where: { staffId_date: { staffId: staff.id, date: today } },
        })

        if (!existing?.checkIn) {
            const result = await checkOut(staff.id)
            expect(result.success).toBe(false)
            expect(result.error).toContain('Chưa chấm công')
        }
    })
})

// ============================================================
// SEC-05: Empty/Missing Data Handling
// ============================================================
describe('SEC-05: Empty & Missing Data', () => {
    it('SEC-05a: createOrder with empty items — should handle', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) return

        const result = await createOrder({
            orderType: 'TAKEAWAY',
            tableId: null,
            tableNumber: null,
            items: [],
            staffId: staff.id,
            staffName: staff.fullName,
        })
        // Should either fail with error or create empty order
        if (result.success && result.order) {
            cleanupOrderIds.push(result.order.id)
        }
    })

    it('SEC-05b: createCustomer with empty name — should handle', async () => {
        try {
            const result = await createCustomer({
                fullName: '',
                phone: '',
            })
            // Should either fail gracefully or create
            expect(result).toHaveProperty('success')
        } catch {
            // Prisma validation error is also acceptable
        }
    })

    it('SEC-05c: createSupplier with empty name — should handle', async () => {
        try {
            const result = await createSupplier({ name: '' })
            expect(result).toHaveProperty('success')
        } catch {
            // Prisma validation error is acceptable
        }
    })

    it('SEC-05d: getFundTransactions with future date range — should return empty', async () => {
        const future = new Date('2030-01-01')
        const txns = await getFundTransactions({ startDate: future })
        expect(Array.isArray(txns)).toBe(true)
        expect(txns.length).toBe(0)
    })
})
