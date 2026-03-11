/**
 * 🧪 Unit Tests — Daily P&L, Reports, Consignment, Finance (P1-P2)
 */
import { describe, it, expect, afterAll } from 'vitest'
import { getTodayPnL, getWeeklyPnL, getPnLSummary } from '@/actions/daily-pnl'
import { getDashboardStats, getTopProducts } from '@/actions/reports'
import { getConsignments, getConsignmentStats } from '@/actions/consignment'
import { getFundTransactions, getFinanceStats } from '@/actions/finance'
import { prisma } from '@/lib/prisma'

describe('Daily P&L (Real DB)', () => {
    afterAll(async () => {
        await prisma.$disconnect()
    })

    it('U-PNL-01: getTodayPnL — should return today DailyPnL', async () => {
        const pnl = await getTodayPnL()
        expect(pnl).toBeDefined()
        expect(pnl).toHaveProperty('revenue')
        expect(pnl).toHaveProperty('netProfit')
        expect(pnl).toHaveProperty('grossProfit')
        expect(pnl).toHaveProperty('totalExpenses')
        expect(pnl).toHaveProperty('orderCount')
        expect(typeof pnl.revenue).toBe('number')
        expect(typeof pnl.netProfit).toBe('number')
    })

    it('U-PNL-02: getWeeklyPnL — should return 7 days of data', async () => {
        const weekly = await getWeeklyPnL()
        expect(Array.isArray(weekly)).toBe(true)
        expect(weekly.length).toBe(7)
        for (const day of weekly) {
            expect(day).toHaveProperty('date')
            expect(day).toHaveProperty('revenue')
            expect(day).toHaveProperty('netProfit')
            expect(day).toHaveProperty('orderCount')
        }
    })

    it('U-PNL-03: getPnLSummary — should return summary with today + averages', async () => {
        const summary = await getPnLSummary()
        expect(summary).toBeDefined()
        expect(summary).toHaveProperty('today')
        expect(summary).toHaveProperty('weekAvg')
        expect(summary).toHaveProperty('monthAvg')
        expect(summary).toHaveProperty('weeklyTrend')
        expect(summary.today).toHaveProperty('revenue')
        expect(summary.weekAvg).toHaveProperty('revenue')
    })
})

describe('Reports (Real DB)', () => {
    it('U-REP-01: getDashboardStats — should return dashboard stats', async () => {
        const report = await getDashboardStats()
        expect(report).toBeDefined()
        expect(report).toHaveProperty('todayRevenue')
        expect(report).toHaveProperty('todayOrders')
        expect(typeof report.todayRevenue).toBe('number')
    })

    it('U-REP-02: getTopProducts — should return product ranking', async () => {
        const products = await getTopProducts()
        expect(Array.isArray(products)).toBe(true)
        if (products.length > 0) {
            expect(products[0]).toHaveProperty('name')
            expect(products[0]).toHaveProperty('quantity')
            expect(products[0]).toHaveProperty('revenue')
        }
    })
})

describe('Consignment (Real DB)', () => {
    it('U-CON-01: getConsignments — should return list', async () => {
        const consignments = await getConsignments()
        expect(Array.isArray(consignments)).toBe(true)
    })

    it('U-CON-02: getConsignmentStats — should return aggregate stats', async () => {
        const stats = await getConsignmentStats()
        expect(stats).toBeDefined()
        expect(stats).toHaveProperty('totalConsignments')
        expect(stats).toHaveProperty('activeConsignments')
        expect(stats).toHaveProperty('totalItems')
        expect(stats).toHaveProperty('soldItems')
    })
})

describe('Finance (Real DB)', () => {
    it('U-FIN-01: getFundTransactions — should return fund transactions', async () => {
        const txns = await getFundTransactions()
        expect(Array.isArray(txns)).toBe(true)
    })

    it('U-FIN-02: getFinanceStats — should return revenue/expense breakdown', async () => {
        const summary = await getFinanceStats()
        expect(summary).toBeDefined()
        expect(summary).toHaveProperty('todayRevenue')
        expect(summary).toHaveProperty('todayExpenses')
    })
})
