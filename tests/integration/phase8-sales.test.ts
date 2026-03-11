/**
 * 🧪 Integration Tests — Phase 8 Critical Sales Flows
 * Tests: Split Payment, KDS Flow, Merge/Split Table, Recipe Deduction
 */
import { describe, it, expect, afterAll } from 'vitest'
import { createOrder, payOrder, sendToKitchen, updateItemStatus, getKitchenOrders, removeItemFromOrder, processOrderWithCOGS } from '@/actions/orders'
import { mergeTables, unmergeTables, splitBill } from '@/actions/tables'
import { prisma } from '@/lib/prisma'

const cleanupOrderIds: string[] = []

async function getTestIds() {
    const staff = await prisma.staff.findFirst({ where: { isActive: true } })
    const product = await prisma.product.findFirst({ where: { isActive: true } })
    const table = await prisma.floorTable.findFirst({ where: { status: 'AVAILABLE' } })
    return { staff, product, table }
}

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
// IT-09: Split Payment
// ============================================================

describe('IT-09: Split Payment Flow', () => {
    it('should accept single PaymentMethod string (backward compat)', async () => {
        const { staff, product } = await getTestIds()
        if (!staff || !product) return

        const orderRes = await createOrder({
            tableId: null, tableNumber: null, orderType: 'TAKEAWAY',
            items: [{ productId: product.id, name: product.name, quantity: 1, price: Number(product.sellPrice) }],
            staffId: staff.id, staffName: staff.fullName,
        })
        expect(orderRes.success).toBe(true)
        cleanupOrderIds.push(orderRes.order!.id)

        const payRes = await payOrder(orderRes.order!.id, 'CASH')
        expect(payRes.success).toBe(true)
        expect(payRes.paymentCount).toBe(1)
    })

    it('should accept split payment array', async () => {
        const { staff, product } = await getTestIds()
        if (!staff || !product) return

        const price = Number(product.sellPrice)
        const orderRes = await createOrder({
            tableId: null, tableNumber: null, orderType: 'TAKEAWAY',
            items: [{ productId: product.id, name: product.name, quantity: 2, price }],
            staffId: staff.id, staffName: staff.fullName,
        })
        expect(orderRes.success).toBe(true)
        cleanupOrderIds.push(orderRes.order!.id)

        const halfAmount = Math.ceil(price)
        const payRes = await payOrder(orderRes.order!.id, [
            { method: 'CASH', amount: halfAmount },
            { method: 'BANK_TRANSFER', amount: price * 2 - halfAmount },
        ])
        expect(payRes.success).toBe(true)
        expect(payRes.paymentCount).toBe(2)

        // Verify 2 payment records
        const payments = await prisma.payment.findMany({ where: { orderId: orderRes.order!.id } })
        expect(payments.length).toBe(2)
    })

    it('should fail if split payment total is insufficient', async () => {
        const { staff, product } = await getTestIds()
        if (!staff || !product) return

        const orderRes = await createOrder({
            tableId: null, tableNumber: null, orderType: 'TAKEAWAY',
            items: [{ productId: product.id, name: product.name, quantity: 1, price: Number(product.sellPrice) }],
            staffId: staff.id, staffName: staff.fullName,
        })
        expect(orderRes.success).toBe(true)
        cleanupOrderIds.push(orderRes.order!.id)

        const payRes = await payOrder(orderRes.order!.id, [
            { method: 'CASH', amount: 1000 }, // way too little
        ])
        expect(payRes.success).toBe(false)
        expect(payRes.error).toBeDefined()
    })
})

// ============================================================
// IT-10: KDS Flow
// ============================================================

describe('IT-10: KDS Kitchen Flow', () => {
    it('should send items to kitchen and track status', async () => {
        const { staff, product } = await getTestIds()
        if (!staff || !product) return

        // Create order
        const orderRes = await createOrder({
            tableId: null, tableNumber: null, orderType: 'TAKEAWAY',
            items: [
                { productId: product.id, name: product.name, quantity: 1, price: Number(product.sellPrice) },
            ],
            staffId: staff.id, staffName: staff.fullName,
        })
        expect(orderRes.success).toBe(true)
        cleanupOrderIds.push(orderRes.order!.id)

        // Send to kitchen
        const sendRes = await sendToKitchen(orderRes.order!.id)
        expect(sendRes.success).toBe(true)
        expect(sendRes.itemsSent).toBeGreaterThan(0)

        // Verify order status → PREPARING
        const order = await prisma.order.findUnique({ where: { id: orderRes.order!.id } })
        expect(order?.status).toBe('PREPARING')

        // Get kitchen orders — should include this order
        const kitchenOrders = await getKitchenOrders()
        const found = kitchenOrders.find(o => o.orderId === orderRes.order!.id)
        expect(found).toBeDefined()
        expect(found!.items.length).toBeGreaterThan(0)

        // Mark first item as READY
        const itemId = found!.items[0].id
        const readyRes = await updateItemStatus(itemId, 'READY')
        expect(readyRes.success).toBe(true)

        // Mark as SERVED
        const servedRes = await updateItemStatus(itemId, 'SERVED')
        expect(servedRes.success).toBe(true)

        // After all served, order should be SERVED
        const finalOrder = await prisma.order.findUnique({ where: { id: orderRes.order!.id } })
        expect(finalOrder?.status).toBe('SERVED')
    })
})

// ============================================================
// IT-11: Remove Item from Order
// ============================================================

describe('IT-11: Remove Item from Order', () => {
    it('should remove item before sent to kitchen', async () => {
        const { staff, product } = await getTestIds()
        if (!staff || !product) return

        const orderRes = await createOrder({
            tableId: null, tableNumber: null, orderType: 'TAKEAWAY',
            items: [
                { productId: product.id, name: product.name, quantity: 2, price: Number(product.sellPrice) },
            ],
            staffId: staff.id, staffName: staff.fullName,
        })
        expect(orderRes.success).toBe(true)
        cleanupOrderIds.push(orderRes.order!.id)

        const itemId = orderRes.order!.items[0].id
        const removeRes = await removeItemFromOrder(orderRes.order!.id, itemId)
        expect(removeRes.success).toBe(true)

        // Verify no items left
        const items = await prisma.orderItem.findMany({ where: { orderId: orderRes.order!.id } })
        expect(items.length).toBe(0)
    })

    it('should block removal of item already sent to kitchen', async () => {
        const { staff, product } = await getTestIds()
        if (!staff || !product) return

        const orderRes = await createOrder({
            tableId: null, tableNumber: null, orderType: 'TAKEAWAY',
            items: [{ productId: product.id, name: product.name, quantity: 1, price: Number(product.sellPrice) }],
            staffId: staff.id, staffName: staff.fullName,
        })
        expect(orderRes.success).toBe(true)
        cleanupOrderIds.push(orderRes.order!.id)

        // Send to kitchen
        await sendToKitchen(orderRes.order!.id)

        // Try to remove — should fail
        const itemId = orderRes.order!.items[0].id
        const removeRes = await removeItemFromOrder(orderRes.order!.id, itemId)
        expect(removeRes.success).toBe(false)
        expect(removeRes.error).toContain('bếp')
    })
})

// ============================================================
// IT-12: Split Bill
// ============================================================

describe('IT-12: Split Bill', () => {
    it('should split selected items into new order', async () => {
        const { staff, product } = await getTestIds()
        if (!staff || !product) return
        const product2 = await prisma.product.findFirst({ where: { isActive: true, id: { not: product.id } } })
        if (!product2) return

        const orderRes = await createOrder({
            tableId: null, tableNumber: null, orderType: 'TAKEAWAY',
            items: [
                { productId: product.id, name: product.name, quantity: 1, price: Number(product.sellPrice) },
                { productId: product2.id, name: product2.name, quantity: 1, price: Number(product2.sellPrice) },
            ],
            staffId: staff.id, staffName: staff.fullName,
        })
        expect(orderRes.success).toBe(true)
        cleanupOrderIds.push(orderRes.order!.id)

        // Split 2nd item
        const item2Id = orderRes.order!.items[1].id
        const splitRes = await splitBill({
            orderId: orderRes.order!.id,
            itemIds: [item2Id],
        })
        expect(splitRes.success).toBe(true)
        expect(splitRes.newOrderId).toBeDefined()
        expect(splitRes.newOrderNo).toMatch(/^ORD-/)
        cleanupOrderIds.push(splitRes.newOrderId!)

        // Verify original has 1 item, new order has 1 item
        const origItems = await prisma.orderItem.findMany({ where: { orderId: orderRes.order!.id } })
        const newItems = await prisma.orderItem.findMany({ where: { orderId: splitRes.newOrderId! } })
        expect(origItems.length).toBe(1)
        expect(newItems.length).toBe(1)
    })
})

// ============================================================
// IT-13: Merge Tables
// ============================================================

describe('IT-13: Merge / Unmerge Tables', () => {
    it('should merge and unmerge tables', async () => {
        const tables = await prisma.floorTable.findMany({
            where: { status: 'AVAILABLE', isActive: true },
            take: 3,
        })
        if (tables.length < 2) {
            console.log('⚠️ Need 2+ AVAILABLE tables to test merge — skipping')
            return
        }

        const master = tables[0]
        const child = tables[1]
        const origSeats1 = master.seats
        const origSeats2 = child.seats

        // Merge
        const mergeRes = await mergeTables(master.id, [child.id])
        expect(mergeRes.success).toBe(true)
        expect(mergeRes.totalSeats).toBe(origSeats1 + origSeats2)

        // Verify child is MERGED
        const childAfter = await prisma.floorTable.findUnique({ where: { id: child.id } })
        expect(childAfter?.status).toBe('MERGED')
        expect(childAfter?.mergedIntoId).toBe(master.id)

        // Unmerge
        const unmergeRes = await unmergeTables(master.id)
        expect(unmergeRes.success).toBe(true)

        // Verify restored
        const childRestored = await prisma.floorTable.findUnique({ where: { id: child.id } })
        expect(childRestored?.status).toBe('AVAILABLE')
        expect(childRestored?.mergedIntoId).toBeNull()

        // Reset master
        await prisma.floorTable.update({ where: { id: master.id }, data: { status: 'AVAILABLE', seats: origSeats1 } })
    })
})
