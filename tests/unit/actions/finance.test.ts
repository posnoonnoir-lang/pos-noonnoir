/**
 * 🧪 Unit Tests — Finance (P0 Critical)
 * Tests COGS, P&L, expense breakdown, revenue charts against REAL DB
 */
import { describe, it, expect } from 'vitest'
import {
    getCOGSRecords,
    getCOGSSummary,
    getCOGSByProduct,
    getFinanceSummary,
    getExpenseBreakdown,
    getDailyRevenueChart,
    getTopProductsRevenue,
    getFundTransactions,
    getDebtRecords,
    getFinanceStats,
} from '@/actions/finance'

describe('Finance — COGS (Real DB)', () => {
    it('U-FIN-01: getCOGSRecords — should return COGS array with required fields', async () => {
        const records = await getCOGSRecords()
        expect(Array.isArray(records)).toBe(true)
        for (const r of records) {
            expect(r).toHaveProperty('orderId')
            expect(r).toHaveProperty('orderNo')
            expect(r).toHaveProperty('totalCOGS')
            expect(r).toHaveProperty('totalRevenue')
            expect(r).toHaveProperty('grossProfit')
            expect(r).toHaveProperty('marginPct')
            expect(typeof r.totalCOGS).toBe('number')
            expect(typeof r.totalRevenue).toBe('number')
        }
    })

    it('U-FIN-02: getCOGSSummary — should return aggregated COGS stats', async () => {
        const summary = await getCOGSSummary()
        expect(summary).toHaveProperty('todayCOGS')
        expect(summary).toHaveProperty('monthCOGS')
        expect(summary).toHaveProperty('avgMargin')
        expect(summary).toHaveProperty('totalOrders')
        expect(summary).toHaveProperty('topMarginProduct')
        expect(summary).toHaveProperty('lowestMarginProduct')
        expect(typeof summary.todayCOGS).toBe('number')
        expect(typeof summary.monthCOGS).toBe('number')
    })

    it('U-FIN-03: getCOGSByProduct — should return per-product COGS breakdown', async () => {
        const products = await getCOGSByProduct()
        expect(Array.isArray(products)).toBe(true)
        for (const p of products) {
            expect(p).toHaveProperty('productName')
            expect(p).toHaveProperty('totalCOGS')
            expect(p).toHaveProperty('totalRevenue')
            expect(p).toHaveProperty('grossMargin')
        }
    })
})

describe('Finance — P&L Summary (Real DB)', () => {
    it('U-FIN-04: getFinanceSummary — should return full P&L breakdown', async () => {
        const summary = await getFinanceSummary()
        expect(summary).toHaveProperty('todayRevenue')
        expect(summary).toHaveProperty('todayExpenses')
        expect(summary).toHaveProperty('todayCOGS')
        expect(summary).toHaveProperty('todayProfit')
        expect(summary).toHaveProperty('totalRevenue')
        expect(summary).toHaveProperty('totalCOGS')
        expect(summary).toHaveProperty('grossProfit')
        expect(summary).toHaveProperty('grossMargin')
        expect(summary).toHaveProperty('netProfit')
        expect(summary).toHaveProperty('netMargin')
        expect(summary).toHaveProperty('totalPayable')
        expect(summary).toHaveProperty('totalReceivable')
        expect(typeof summary.todayRevenue).toBe('number')
    })

    it('U-FIN-05: getExpenseBreakdown — should return categorized expenses', async () => {
        const breakdown = await getExpenseBreakdown()
        expect(Array.isArray(breakdown)).toBe(true)
        for (const cat of breakdown) {
            expect(cat).toHaveProperty('category')
            expect(cat).toHaveProperty('amount')
            expect(cat).toHaveProperty('percentage')
            expect(cat).toHaveProperty('color')
            expect(typeof cat.amount).toBe('number')
            expect(cat.percentage).toBeGreaterThanOrEqual(0)
            expect(cat.percentage).toBeLessThanOrEqual(100)
        }
    })

    it('U-FIN-06: getExpenseBreakdown — percentages should sum to ~100', async () => {
        const breakdown = await getExpenseBreakdown()
        if (breakdown.length > 0) {
            const totalPct = breakdown.reduce((s, c) => s + c.percentage, 0)
            expect(totalPct).toBeGreaterThanOrEqual(99)
            expect(totalPct).toBeLessThanOrEqual(101)
        }
    })
})

describe('Finance — Charts (Real DB)', () => {
    it('U-FIN-07: getDailyRevenueChart — should return array for last 30 days', async () => {
        const chart = await getDailyRevenueChart(30)
        expect(Array.isArray(chart)).toBe(true)
        expect(chart.length).toBe(30)
        for (const point of chart) {
            expect(point).toHaveProperty('date')
            expect(point).toHaveProperty('label')
            expect(point).toHaveProperty('revenue')
            expect(point).toHaveProperty('cogs')
            expect(point).toHaveProperty('profit')
            expect(typeof point.revenue).toBe('number')
        }
    })

    it('U-FIN-08: getDailyRevenueChart — dates should be chronologically ordered', async () => {
        const chart = await getDailyRevenueChart(7)
        for (let i = 1; i < chart.length; i++) {
            expect(chart[i].date >= chart[i - 1].date).toBe(true)
        }
    })

    it('U-FIN-09: getTopProductsRevenue — should return top N products sorted by revenue desc', async () => {
        const top = await getTopProductsRevenue(10)
        expect(Array.isArray(top)).toBe(true)
        expect(top.length).toBeLessThanOrEqual(10)
        for (const p of top) {
            expect(p).toHaveProperty('name')
            expect(p).toHaveProperty('type')
            expect(p).toHaveProperty('qty')
            expect(p).toHaveProperty('revenue')
        }
        // Should be sorted by revenue descending
        for (let i = 1; i < top.length; i++) {
            expect(top[i].revenue).toBeLessThanOrEqual(top[i - 1].revenue)
        }
    })
})

describe('Finance — Fund Transactions & Debt (Real DB)', () => {
    it('U-FIN-10: getFundTransactions — should return transaction list', async () => {
        const txns = await getFundTransactions()
        expect(Array.isArray(txns)).toBe(true)
        if (txns.length > 0) {
            expect(txns[0]).toHaveProperty('id')
            expect(txns[0]).toHaveProperty('type')
            expect(txns[0]).toHaveProperty('amount')
            expect(txns[0]).toHaveProperty('category')
        }
    })

    it('U-FIN-11: getDebtRecords — should return debt list', async () => {
        const debts = await getDebtRecords()
        expect(Array.isArray(debts)).toBe(true)
        if (debts.length > 0) {
            expect(debts[0]).toHaveProperty('id')
            expect(debts[0]).toHaveProperty('type')
            expect(debts[0]).toHaveProperty('amount')
            expect(debts[0]).toHaveProperty('status')
        }
    })

    it('U-FIN-12: getFinanceStats — should return aggregated stats', async () => {
        const stats = await getFinanceStats()
        expect(stats).toBeDefined()
        expect(typeof stats).toBe('object')
    })
})
