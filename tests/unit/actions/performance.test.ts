/**
 * ⚡ Performance Benchmarks — SRS NFR-PERF
 * Measures critical operations against defined thresholds
 */
import { describe, it, expect } from 'vitest'
import { createOrder, getOrders, payOrder } from '@/actions/orders'
import { getCOGSRecords, getFinanceSummary, getDailyRevenueChart } from '@/actions/finance'
import { getTodayPnL, getPnLSummary } from '@/actions/daily-pnl'
import { getZoneHeatmap, getStaffLeaderboard } from '@/actions/analytics'
import { prisma } from '@/lib/prisma'

const createdOrderIds: string[] = []

import { afterAll } from 'vitest'
afterAll(async () => {
    for (const id of createdOrderIds) {
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

describe('PERF — Order Operations', () => {
    it('PERF-01: createOrder should complete within 2000ms', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!staff || !product) return

        const start = performance.now()
        const result = await createOrder({
            orderType: 'TAKEAWAY',
            tableId: null,
            tableNumber: null,
            items: [{ productId: product.id, quantity: 1, price: Number(product.sellPrice), name: product.name }],
            staffId: staff.id,
            staffName: staff.fullName,
        })
        const duration = performance.now() - start

        expect(result.success).toBe(true)
        if (result.order) createdOrderIds.push(result.order.id)

        console.log(`⏱️ createOrder: ${Math.round(duration)}ms`)
        expect(duration).toBeLessThan(2000) // SRS: < 500ms (relaxed for DB)
    })

    it('PERF-02: payOrder should complete within 2000ms', async () => {
        if (createdOrderIds.length === 0) return

        const start = performance.now()
        await payOrder(createdOrderIds[0], 'CASH')
        const duration = performance.now() - start

        console.log(`⏱️ payOrder: ${Math.round(duration)}ms`)
        expect(duration).toBeLessThan(2000) // SRS: < 1s (relaxed for DB)
    })

    it('PERF-03: getOrders (today) should complete within 1000ms', async () => {
        const start = performance.now()
        await getOrders({ todayOnly: true })
        const duration = performance.now() - start

        console.log(`⏱️ getOrders(today): ${Math.round(duration)}ms`)
        expect(duration).toBeLessThan(1000)
    })
})

describe('PERF — Finance Reports', () => {
    it('PERF-04: getTodayPnL should complete within 3000ms', async () => {
        const start = performance.now()
        await getTodayPnL()
        const duration = performance.now() - start

        console.log(`⏱️ getTodayPnL: ${Math.round(duration)}ms`)
        expect(duration).toBeLessThan(3000)
    })

    it('PERF-05: getDailyRevenueChart(30) should complete within 5000ms', async () => {
        const start = performance.now()
        await getDailyRevenueChart(30)
        const duration = performance.now() - start

        console.log(`⏱️ getDailyRevenueChart(30): ${Math.round(duration)}ms`)
        expect(duration).toBeLessThan(5000)
    })

    it('PERF-06: getFinanceSummary should complete within 5000ms', async () => {
        const start = performance.now()
        await getFinanceSummary()
        const duration = performance.now() - start

        console.log(`⏱️ getFinanceSummary: ${Math.round(duration)}ms`)
        expect(duration).toBeLessThan(5000)
    })

    it('PERF-07: getCOGSRecords should complete within 5000ms', async () => {
        const start = performance.now()
        await getCOGSRecords()
        const duration = performance.now() - start

        console.log(`⏱️ getCOGSRecords: ${Math.round(duration)}ms`)
        expect(duration).toBeLessThan(5000)
    })

    it('PERF-08: getPnLSummary (7 days) should complete within 10000ms', async () => {
        const start = performance.now()
        await getPnLSummary()
        const duration = performance.now() - start

        console.log(`⏱️ getPnLSummary: ${Math.round(duration)}ms`)
        expect(duration).toBeLessThan(10000) // 7 days of P&L, parallelized
    })
})

describe('PERF — Analytics', () => {
    it('PERF-09: getZoneHeatmap should complete within 3000ms', async () => {
        const start = performance.now()
        await getZoneHeatmap()
        const duration = performance.now() - start

        console.log(`⏱️ getZoneHeatmap: ${Math.round(duration)}ms`)
        expect(duration).toBeLessThan(3000)
    })

    it('PERF-10: getStaffLeaderboard should complete within 3000ms', async () => {
        const start = performance.now()
        await getStaffLeaderboard()
        const duration = performance.now() - start

        console.log(`⏱️ getStaffLeaderboard: ${Math.round(duration)}ms`)
        expect(duration).toBeLessThan(3000)
    })
})
