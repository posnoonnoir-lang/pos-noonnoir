/**
 * 🧪 Unit Tests — Daily P&L Report (P0 Critical)
 * Tests daily P&L building, summary, and weekly trend
 */
import { describe, it, expect } from 'vitest'
import {
    getTodayPnL,
    getPnLByDate,
    getPnLSummary,
    getWeeklyPnL,
} from '@/actions/daily-pnl'

describe('Daily P&L — Report Building (Real DB)', () => {
    it('U-PNL-01: getTodayPnL — should return full P&L structure', async () => {
        const pnl = await getTodayPnL()
        expect(pnl).toHaveProperty('date')
        expect(pnl).toHaveProperty('revenue')
        expect(pnl).toHaveProperty('costOfGoods')
        expect(pnl).toHaveProperty('grossProfit')
        expect(pnl).toHaveProperty('grossMargin')
        expect(pnl).toHaveProperty('expenses')
        expect(pnl).toHaveProperty('totalExpenses')
        expect(pnl).toHaveProperty('netProfit')
        expect(pnl).toHaveProperty('netMargin')
        expect(pnl).toHaveProperty('orderCount')
        expect(pnl).toHaveProperty('avgOrderValue')
        expect(pnl).toHaveProperty('topProducts')
        expect(pnl).toHaveProperty('paymentBreakdown')
        expect(pnl).toHaveProperty('wasteAndSpoilage')
        expect(typeof pnl.revenue).toBe('number')
        expect(typeof pnl.costOfGoods).toBe('number')
    })

    it('U-PNL-02: getTodayPnL — grossProfit = revenue - costOfGoods', async () => {
        const pnl = await getTodayPnL()
        expect(pnl.grossProfit).toBe(pnl.revenue - pnl.costOfGoods)
    })

    it('U-PNL-03: getTodayPnL — paymentBreakdown has cash/card/qr', async () => {
        const pnl = await getTodayPnL()
        expect(pnl.paymentBreakdown).toHaveProperty('cash')
        expect(pnl.paymentBreakdown).toHaveProperty('card')
        expect(pnl.paymentBreakdown).toHaveProperty('qr')
    })

    it('U-PNL-04: getPnLByDate — should accept specific date and return report', async () => {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const pnl = await getPnLByDate(yesterday)
        expect(pnl).not.toBeNull()
        expect(pnl!.date).toBe(yesterday)
        expect(pnl).toHaveProperty('revenue')
        expect(pnl).toHaveProperty('netProfit')
    })

    it('U-PNL-05: getPnLByDate — topProducts should be sorted by revenue desc', async () => {
        const today = new Date().toISOString().split('T')[0]
        const pnl = await getPnLByDate(today)
        if (pnl && pnl.topProducts.length > 1) {
            for (let i = 1; i < pnl.topProducts.length; i++) {
                expect(pnl.topProducts[i].revenue).toBeLessThanOrEqual(pnl.topProducts[i - 1].revenue)
            }
        }
    })
})

describe('Daily P&L — Summary & Trends (Real DB)', () => {
    it('U-PNL-06: getPnLSummary — should return today + week/month averages', async () => {
        const summary = await getPnLSummary()
        expect(summary).toHaveProperty('today')
        expect(summary).toHaveProperty('weekAvg')
        expect(summary).toHaveProperty('monthAvg')
        expect(summary).toHaveProperty('revenueChangeVsYesterday')
        expect(summary).toHaveProperty('profitChangeVsYesterday')
        expect(summary).toHaveProperty('weeklyTrend')

        expect(summary.weekAvg).toHaveProperty('revenue')
        expect(summary.weekAvg).toHaveProperty('profit')
        expect(summary.weekAvg).toHaveProperty('orders')
    })

    it('U-PNL-07: getPnLSummary — weeklyTrend should have 7 entries', async () => {
        const summary = await getPnLSummary()
        expect(summary.weeklyTrend.length).toBe(7)
        for (const day of summary.weeklyTrend) {
            expect(day).toHaveProperty('date')
            expect(day).toHaveProperty('revenue')
            expect(day).toHaveProperty('profit')
            expect(day).toHaveProperty('orders')
        }
    })

    it('U-PNL-08: getWeeklyPnL — should return 7 days of full P&L data', async () => {
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

    it('U-PNL-09: getWeeklyPnL — dates should be chronologically ordered', async () => {
        const weekly = await getWeeklyPnL()
        for (let i = 1; i < weekly.length; i++) {
            expect(weekly[i].date >= weekly[i - 1].date).toBe(true)
        }
    })
})
