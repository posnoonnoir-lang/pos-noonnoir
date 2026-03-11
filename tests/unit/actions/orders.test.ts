/**
 * 🧪 Unit Tests — Orders (P0 Critical)
 * Tests server actions against REAL Supabase database
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    payOrder,
    getActiveOrders,
    getTodayStats,
    addItemsToOrder,
} from '@/actions/orders'
import { prisma } from '@/lib/prisma'

// Track test data for cleanup
const testOrderIds: string[] = []

// Get real IDs from DB
async function getTestIds() {
    const staff = await prisma.staff.findFirst({ where: { isActive: true } })
    const product = await prisma.product.findFirst({ where: { isActive: true } })
    const table = await prisma.floorTable.findFirst({ where: { status: 'AVAILABLE' } })
    return { staff, product, table }
}

describe('Orders — Server Actions (Real DB)', () => {

    afterAll(async () => {
        // Cleanup: delete test orders and their items
        for (const id of testOrderIds) {
            try {
                await prisma.payment.deleteMany({ where: { orderId: id } })
                await prisma.orderItem.deleteMany({ where: { orderId: id } })
                await prisma.order.delete({ where: { id } })
            } catch { /* ignore if already deleted */ }
        }
        await prisma.$disconnect()
    })

    // ─── U-ORD-01: createOrder — TAKEAWAY ─────────────────────
    it('U-ORD-01: createOrder TAKEAWAY — should create order without table', async () => {
        const { staff, product } = await getTestIds()
        if (!staff || !product) throw new Error('Need at least 1 staff and 1 product in DB')

        const result = await createOrder({
            tableId: null,
            tableNumber: null,
            orderType: 'TAKEAWAY',
            items: [{
                productId: product.id,
                name: product.name,
                quantity: 1,
                price: Number(product.sellPrice),
            }],
            staffId: staff.id,
            staffName: staff.fullName,
        })

        expect(result.success).toBe(true)
        expect(result.order).toBeDefined()
        expect(result.order!.orderNumber).toMatch(/^ORD-/)
        expect(result.order!.tableId).toBeNull()
        expect(result.order!.orderType).toBe('TAKEAWAY')
        expect(result.order!.status).toBe('OPEN')
        expect(result.order!.items.length).toBe(1)
        expect(result.order!.total).toBeGreaterThan(0)

        testOrderIds.push(result.order!.id)
    })

    // ─── U-ORD-02: createOrder — DINE_IN with table ───────────
    it('U-ORD-02: createOrder DINE_IN — should create order and occupy table', async () => {
        const { staff, product, table } = await getTestIds()
        if (!staff || !product) throw new Error('Need staff + product')

        // Use table if available, else skip table portion
        const result = await createOrder({
            tableId: table?.id ?? null,
            tableNumber: table?.tableNumber ?? null,
            orderType: table ? 'DINE_IN' : 'TAKEAWAY',
            items: [{
                productId: product.id,
                name: product.name,
                quantity: 2,
                price: Number(product.sellPrice),
            }],
            staffId: staff.id,
            staffName: staff.fullName,
            guestCount: 2,
        })

        expect(result.success).toBe(true)
        expect(result.order).toBeDefined()
        expect(result.order!.items.length).toBe(1)
        expect(result.order!.items[0].quantity).toBe(2)

        testOrderIds.push(result.order!.id)

        // Verify table status changed if DINE_IN
        if (table) {
            const updatedTable = await prisma.floorTable.findUnique({ where: { id: table.id } })
            expect(updatedTable?.status).toBe('OCCUPIED')
            // Reset table for other tests
            await prisma.floorTable.update({ where: { id: table.id }, data: { status: 'AVAILABLE' } })
        }
    })

    // ─── U-ORD-03: getOrders — list ───────────────────────────
    it('U-ORD-03: getOrders — should return list of orders', async () => {
        const orders = await getOrders({ limit: 5 })
        expect(Array.isArray(orders)).toBe(true)
        expect(orders.length).toBeGreaterThan(0)
        expect(orders[0]).toHaveProperty('id')
        expect(orders[0]).toHaveProperty('orderNumber')
        expect(orders[0]).toHaveProperty('status')
        expect(orders[0]).toHaveProperty('items')
    })

    // ─── U-ORD-04: getOrderById ───────────────────────────────
    it('U-ORD-04: getOrderById — should return specific order', async () => {
        if (testOrderIds.length === 0) return

        const order = await getOrderById(testOrderIds[0])
        expect(order).toBeDefined()
        expect(order!.id).toBe(testOrderIds[0])
        expect(order!.items).toBeDefined()
    })

    // ─── U-ORD-05: addItemsToOrder ────────────────────────────
    it('U-ORD-05: addItemsToOrder — should add items and update total', async () => {
        if (testOrderIds.length === 0) return
        const { product } = await getTestIds()
        if (!product) return

        const orderBefore = await getOrderById(testOrderIds[0])
        const totalBefore = orderBefore!.total

        const result = await addItemsToOrder(testOrderIds[0], [{
            productId: product.id,
            name: product.name,
            quantity: 1,
            price: Number(product.sellPrice),
        }])

        expect(result.success).toBe(true)
        expect(result.order!.total).toBeGreaterThan(totalBefore)
    })

    // ─── U-ORD-06: payOrder — cash payment ────────────────────
    it('U-ORD-06: payOrder — should mark order PAID and create payment', async () => {
        if (testOrderIds.length === 0) return

        const result = await payOrder(testOrderIds[0], 'CASH')
        expect(result.success).toBe(true)

        // Verify in DB
        const order = await prisma.order.findUnique({
            where: { id: testOrderIds[0] },
            include: { payments: true },
        })
        expect(order?.status).toBe('PAID')
        expect(order?.paymentStatus).toBe('PAID')
        expect(order?.payments.length).toBeGreaterThan(0)
        expect(order?.payments[0].method).toBe('CASH')
    })

    // ─── U-ORD-07: updateOrderStatus ──────────────────────────
    it('U-ORD-07: updateOrderStatus — should update status', async () => {
        if (testOrderIds.length < 2) return

        const result = await updateOrderStatus(testOrderIds[1], 'CANCELLED')
        expect(result.success).toBe(true)

        const order = await prisma.order.findUnique({ where: { id: testOrderIds[1] } })
        expect(order?.status).toBe('CANCELLED')
    })

    // ─── U-ORD-08: getActiveOrders ────────────────────────────
    it('U-ORD-08: getActiveOrders — should return only OPEN/PREPARING/SERVED', async () => {
        const orders = await getActiveOrders()
        expect(Array.isArray(orders)).toBe(true)
        for (const o of orders) {
            expect(['OPEN', 'PREPARING', 'SERVED']).toContain(o.status)
        }
    })

    // ─── U-ORD-09: getTodayStats ──────────────────────────────
    it('U-ORD-09: getTodayStats — should return daily statistics', async () => {
        const stats = await getTodayStats()
        expect(stats).toHaveProperty('totalOrders')
        expect(stats).toHaveProperty('paidOrders')
        expect(stats).toHaveProperty('totalRevenue')
        expect(stats).toHaveProperty('avgOrderValue')
        expect(stats.totalOrders).toBeGreaterThanOrEqual(0)
        expect(stats.totalRevenue).toBeGreaterThanOrEqual(0)
    })

    // ─── U-ORD-10: createOrder — order number format ──────────
    it('U-ORD-10: Order number should follow ORD-MMDD-XXX format', async () => {
        const { staff, product } = await getTestIds()
        if (!staff || !product) return

        const result = await createOrder({
            tableId: null,
            tableNumber: null,
            orderType: 'TAKEAWAY',
            items: [{ productId: product.id, name: product.name, quantity: 1, price: Number(product.sellPrice) }],
            staffId: staff.id,
            staffName: staff.fullName,
        })

        expect(result.success).toBe(true)
        // Format: ORD-MMDD-001
        expect(result.order!.orderNumber).toMatch(/^ORD-\d{4}-\d{3}$/)
        testOrderIds.push(result.order!.id)
    })
})
