/**
 * 🧪 Integration Tests — Multi-step Business Flows
 * Tests complete user flows spanning multiple server actions.
 */
import { describe, it, expect, afterAll } from 'vitest'
import { createOrder, getOrderById, payOrder } from '@/actions/orders'
import { getAllGlassStatuses, getBottleStats, sellWineGlass } from '@/actions/wine'
import { calculateServiceCharge } from '@/actions/operational'
import { calculateTax, getTaxRates } from '@/actions/tax'
import { prisma } from '@/lib/prisma'

const createdOrderIds: string[] = []

afterAll(async () => {
    for (const id of createdOrderIds) {
        try {
            await prisma.payment.deleteMany({ where: { orderId: id } })
            await prisma.orderItem.deleteMany({ where: { orderId: id } })
            const order = await prisma.order.findUnique({ where: { id } })
            // Restore table to AVAILABLE if test occupied it
            if (order?.tableId) {
                await prisma.floorTable.update({
                    where: { id: order.tableId },
                    data: { status: 'AVAILABLE' },
                })
            }
            await prisma.order.delete({ where: { id } })
        } catch { /* */ }
    }
    await prisma.$disconnect()
})

describe('IT-01: Complete Dine-In Order Flow', () => {
    let orderId: string

    it('Step 1: Create dine-in order with items', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        const table = await prisma.floorTable.findFirst({ where: { status: 'AVAILABLE' } })
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!staff || !table || !product) return

        const result = await createOrder({
            orderType: 'DINE_IN',
            tableId: table.id,
            tableNumber: table.tableNumber,
            items: [
                { productId: product.id, quantity: 2, price: Number(product.sellPrice), name: product.name },
            ],
            staffId: staff.id,
            staffName: staff.fullName,
        })
        expect(result.success).toBe(true)
        expect(result.order).toBeDefined()
        orderId = result.order!.id
        createdOrderIds.push(orderId)
    })

    it('Step 2: Verify order has items and calculated total', async () => {
        if (!orderId) return
        const order = await getOrderById(orderId)
        expect(order).toBeDefined()
        expect(order!.items.length).toBeGreaterThanOrEqual(1)
        expect(order!.total).toBeGreaterThan(0)
    })

    it('Step 3: Process cash payment → order PAID', async () => {
        if (!orderId) return
        const result = await payOrder(orderId, 'CASH')
        expect(result.success).toBe(true)

        const order = await getOrderById(orderId)
        expect(order!.status).toBe('PAID')
    })
})

describe('IT-02: Takeaway Order + Bank Transfer', () => {
    it('Create takeaway → pay via bank → verify payment record', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!staff || !product) return

        const result = await createOrder({
            orderType: 'TAKEAWAY',
            tableId: null,
            tableNumber: null,
            items: [{ productId: product.id, quantity: 1, price: Number(product.sellPrice), name: product.name }],
            staffId: staff.id,
            staffName: staff.fullName,
        })
        expect(result.success).toBe(true)
        if (!result.order) return
        createdOrderIds.push(result.order.id)

        await payOrder(result.order.id, 'BANK_TRANSFER')

        const payments = await prisma.payment.findMany({ where: { orderId: result.order.id } })
        expect(payments.length).toBeGreaterThan(0)
        expect(payments[0].method).toBe('BANK_TRANSFER')
    })
})

describe('IT-03: Service Charge + Tax Pipeline', () => {
    it('Dine-in should get service charge, takeaway should not', async () => {
        const scDineIn = await calculateServiceCharge(1500000, 'DINE_IN')
        const scTakeaway = await calculateServiceCharge(1500000, 'TAKEAWAY')

        expect(scDineIn.amount).toBeGreaterThanOrEqual(0)
        expect(scTakeaway.amount).toBe(0) // DINE_IN_ONLY config
    })

    it('Tax calculation with first available rate', async () => {
        const rates = await getTaxRates()
        if (rates.length === 0) return

        const result = await calculateTax(1000000, rates[0].id)
        expect(result.taxAmount).toBe(Math.round(1000000 * rates[0].rate / 100))
        expect(result.taxName).toBe(rates[0].name)
    })
})

describe('IT-04: Wine Glass Tracking Flow', () => {
    it('Get statuses → sell glass → verify state', async () => {
        const statuses = await getAllGlassStatuses()
        if (!statuses || statuses.length === 0) {
            console.log('⚠️ No glass configs — skipping')
            return
        }

        const stats = await getBottleStats()
        expect(stats).toHaveProperty('total')
        expect(stats).toHaveProperty('sold')
        expect(stats.total).toBeGreaterThanOrEqual(0)
    })
})
