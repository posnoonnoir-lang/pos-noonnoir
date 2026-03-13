/**
 * 🧪 Unit Tests — Analytics (P2)
 * Tests zone heatmap, hourly heatmap, staff leaderboard, category revenue
 */
import { describe, it, expect } from 'vitest'
import {
    getZoneHeatmap,
    getHourlyHeatmap,
    getStaffLeaderboard,
    getMonthlyRevenue,
    getCategoryRevenue,
    getAnalyticsSummary,
} from '@/actions/analytics'

describe('Analytics — Revenue (Real DB)', () => {
    it('U-ANA-01: getMonthlyRevenue — should return 6 months of revenue', async () => {
        const monthly = await getMonthlyRevenue()
        expect(Array.isArray(monthly)).toBe(true)
        for (const m of monthly) {
            expect(m).toHaveProperty('month')
            expect(m).toHaveProperty('revenue')
            expect(m).toHaveProperty('profit')
            expect(m).toHaveProperty('orders')
            expect(m).toHaveProperty('avgTicket')
        }
    })

    it('U-ANA-02: getCategoryRevenue — should return category breakdown', async () => {
        const cats = await getCategoryRevenue()
        expect(Array.isArray(cats)).toBe(true)
        for (const c of cats) {
            expect(c).toHaveProperty('name')
            expect(c).toHaveProperty('revenue')
            expect(c).toHaveProperty('quantity')
            expect(c).toHaveProperty('percentage')
            expect(c).toHaveProperty('color')
        }
    })

    it('U-ANA-03: getAnalyticsSummary — should return month summary', async () => {
        const summary = await getAnalyticsSummary()
        expect(summary).toHaveProperty('totalRevenue')
        expect(summary).toHaveProperty('totalOrders')
        expect(summary).toHaveProperty('avgTicket')
        expect(summary).toHaveProperty('totalCustomers')
        expect(summary).toHaveProperty('revenueGrowth')
        expect(summary).toHaveProperty('bestDay')
        expect(summary).toHaveProperty('peakHour')
    })
})

describe('Analytics — Heatmaps (Real DB)', () => {
    it('U-ANA-04: getZoneHeatmap — should return zone × table revenue data', async () => {
        const heatmap = await getZoneHeatmap()
        expect(Array.isArray(heatmap)).toBe(true)
        for (const zone of heatmap) {
            expect(zone).toHaveProperty('zoneId')
            expect(zone).toHaveProperty('zoneName')
            expect(zone).toHaveProperty('tables')
            expect(zone).toHaveProperty('totalRevenue')
            expect(zone).toHaveProperty('totalOrders')
            expect(Array.isArray(zone.tables)).toBe(true)
            for (const t of zone.tables) {
                expect(t).toHaveProperty('tableId')
                expect(t).toHaveProperty('tableNumber')
                expect(t).toHaveProperty('revenue')
                expect(t).toHaveProperty('heatLevel')
                expect(t.heatLevel).toBeGreaterThanOrEqual(0)
                expect(t.heatLevel).toBeLessThanOrEqual(100)
            }
        }
    })

    it('U-ANA-05: getHourlyHeatmap — should return 7-day × hour matrix', async () => {
        const heatmap = await getHourlyHeatmap()
        expect(Array.isArray(heatmap)).toBe(true)
        expect(heatmap.length).toBe(7)
        for (const day of heatmap) {
            expect(day).toHaveProperty('day')
            expect(day).toHaveProperty('dayIndex')
            expect(day).toHaveProperty('hours')
            expect(Array.isArray(day.hours)).toBe(true)
            for (const h of day.hours) {
                expect(h).toHaveProperty('hour')
                expect(h).toHaveProperty('orders')
                expect(h).toHaveProperty('revenue')
                expect(h).toHaveProperty('intensity')
            }
        }
    })
})

describe('Analytics — Staff Leaderboard (Real DB)', () => {
    it('U-ANA-06: getStaffLeaderboard — should return staff ranked by revenue', async () => {
        const leaderboard = await getStaffLeaderboard()
        expect(Array.isArray(leaderboard)).toBe(true)
        for (const s of leaderboard) {
            expect(s).toHaveProperty('id')
            expect(s).toHaveProperty('name')
            expect(s).toHaveProperty('role')
            expect(s).toHaveProperty('orders')
            expect(s).toHaveProperty('revenue')
            expect(s).toHaveProperty('avgTicket')
            expect(s).toHaveProperty('rank')
        }
        // Should be sorted by revenue desc (rank ascending)
        for (let i = 1; i < leaderboard.length; i++) {
            expect(leaderboard[i].revenue).toBeLessThanOrEqual(leaderboard[i - 1].revenue)
        }
    })
})
