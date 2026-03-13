/**
 * 🧪 Integration Tests — Shift Lifecycle (IT-08)
 * Open shift → process orders → close shift → verify summary
 */
import { describe, it, expect, afterAll } from 'vitest'
import { openShift, closeShift, getCurrentShift, getShifts } from '@/actions/shifts'
import { createOrder, payOrder } from '@/actions/orders'
import { prisma } from '@/lib/prisma'

const cleanupIds = { shiftIds: [] as string[], orderIds: [] as string[] }

afterAll(async () => {
    for (const id of cleanupIds.orderIds) {
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
    for (const id of cleanupIds.shiftIds) {
        try { await prisma.shiftRecord.delete({ where: { id } }) } catch { /* */ }
    }
    await prisma.$disconnect()
})

describe('IT-08: Shift Open → Orders → Close → Summary', () => {
    let shiftId: string
    let staffId: string

    it('Step 1: Open shift with opening cash', async () => {
        // First close any existing open shift
        const existing = await getCurrentShift()
        if (existing) {
            await closeShift({ shiftId: existing.id, closingCash: Number(existing.openingCash) })
        }

        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) return
        staffId = staff.id

        const result = await openShift({
            staffId: staff.id,
            openingCash: 500000,
            staffName: staff.fullName,
        })
        expect(result.success).toBe(true)
        if (result.data) {
            shiftId = result.data.id
            cleanupIds.shiftIds.push(shiftId)
        }
    })

    it('Step 2: getCurrentShift should return the open shift', async () => {
        if (!shiftId) return
        const current = await getCurrentShift()
        expect(current).not.toBeNull()
        expect(current!.id).toBe(shiftId)
        expect(current!.status).toBe('OPEN')
        expect(current!.openingCash).toBe(500000)
    })

    it('Step 3: Create and pay an order during shift', async () => {
        if (!shiftId || !staffId) return
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!product) return

        const result = await createOrder({
            orderType: 'TAKEAWAY',
            tableId: null,
            tableNumber: null,
            items: [{ productId: product.id, quantity: 1, price: Number(product.sellPrice), name: product.name }],
            staffId,
            staffName: 'Test Staff',
        })
        if (result.order) {
            cleanupIds.orderIds.push(result.order.id)
            await payOrder(result.order.id, 'CASH')
        }
    })

    it('Step 4: Close shift and verify summary', async () => {
        if (!shiftId) return
        const result = await closeShift({
            shiftId,
            closingCash: 600000,
        })
        expect(result.success).toBe(true)
        if (result.data) {
            expect(result.data).toHaveProperty('expectedCash')
            expect(result.data).toHaveProperty('variance')
            expect(result.data).toHaveProperty('totalRevenue')
            expect(typeof result.data.expectedCash).toBe('number')
            expect(typeof result.data.totalRevenue).toBe('number')
        }
    })

    it('Step 5: Shift should appear in history as CLOSED', async () => {
        if (!shiftId) return
        const shifts = await getShifts()
        const found = shifts.find(s => s.id === shiftId)
        expect(found).toBeDefined()
        expect(found!.status).toBe('CLOSED')
        expect(found!.closingCash).toBe(600000)
    })
})
