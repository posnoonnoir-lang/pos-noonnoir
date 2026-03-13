/**
 * 🧪 Unit Tests — Forecast, Shift Targets, Push Sale, Inventory Alerts (V2 Features)
 * Tests V2 predictive intelligence modules
 */
import { describe, it, expect } from 'vitest'
import { calculateForecast, getForecastSummary } from '@/actions/forecast'
import { suggestShiftTargets, evaluateShift, getShiftTargetHistory } from '@/actions/shift-targets'
import { getPushSaleItems, applyPushDiscount } from '@/actions/push-sale'
import { getInventoryAlerts, getAlertSummary } from '@/actions/inventory-alerts'
import { prisma } from '@/lib/prisma'

// ─── FORECAST ─────────────────────────────────────────────────

describe('Forecast (Real DB)', () => {
    it('U-FC-01: calculateForecast — should return forecast items', async () => {
        const items = await calculateForecast()
        expect(Array.isArray(items)).toBe(true)
        for (const item of items) {
            expect(item).toHaveProperty('productId')
            expect(item).toHaveProperty('productName')
            expect(item).toHaveProperty('avgWeeklySales')
            expect(item).toHaveProperty('predictedDemand')
            expect(item).toHaveProperty('suggestedQty')
            expect(item).toHaveProperty('confidence')
            expect(item).toHaveProperty('reason')
            expect(item).toHaveProperty('status')
            expect(item).toHaveProperty('seasonFactor')
            expect(item).toHaveProperty('trendFactor')
            expect(item).toHaveProperty('safetyStock')
            expect(['PENDING', 'ACCEPTED', 'DISMISSED']).toContain(item.status)
            expect(item.confidence).toBeGreaterThanOrEqual(0)
            expect(item.confidence).toBeLessThanOrEqual(100)
        }
    })

    it('U-FC-02: getForecastSummary — should return summary stats', async () => {
        const summary = await getForecastSummary()
        expect(summary).toHaveProperty('totalItems')
        expect(summary).toHaveProperty('totalEstimatedCost')
        expect(summary).toHaveProperty('avgConfidence')
        expect(summary).toHaveProperty('lastCalculated')
        expect(typeof summary.totalItems).toBe('number')
    })

    it('U-FC-03: getShiftTargetHistory — should return history array', async () => {
        const history = await getShiftTargetHistory(30)
        expect(Array.isArray(history)).toBe(true)
        for (const h of history) {
            expect(h).toHaveProperty('date')
            expect(h).toHaveProperty('staffName')
            expect(h).toHaveProperty('revenueTarget')
            expect(h).toHaveProperty('actualRevenue')
            expect(h).toHaveProperty('revenuePct')
            expect(h).toHaveProperty('grade')
        }
    })
})

// ─── SHIFT TARGETS ────────────────────────────────────────────

describe('Shift Targets (Real DB)', () => {
    it('U-ST-01: suggestShiftTargets — should return suggestion', async () => {
        const shift = await prisma.shiftRecord.findFirst({ orderBy: { openedAt: 'desc' } })
        if (!shift) {
            console.log('⚠️ No shift records — skipping')
            return
        }
        const suggestion = await suggestShiftTargets(shift.id)
        expect(suggestion).toHaveProperty('revenueTarget')
        expect(suggestion).toHaveProperty('orderTarget')
        expect(suggestion).toHaveProperty('customerTarget')
        expect(suggestion).toHaveProperty('pushProducts')
        expect(suggestion).toHaveProperty('basedOn')
        expect(typeof suggestion.revenueTarget).toBe('number')
        expect(suggestion.revenueTarget).toBeGreaterThan(0)
        expect(Array.isArray(suggestion.pushProducts)).toBe(true)
    })

    it('U-ST-02: evaluateShift — should return grade', async () => {
        const shift = await prisma.shiftRecord.findFirst({ orderBy: { openedAt: 'desc' } })
        if (!shift) return

        const evaluation = await evaluateShift(shift.id, {
            revenue: 6000000,
            orders: 15,
            customers: 20,
        })
        expect(evaluation).toHaveProperty('revenueAchieved')
        expect(evaluation).toHaveProperty('revenuePct')
        expect(evaluation).toHaveProperty('overallGrade')
        expect(evaluation).toHaveProperty('gradeLabel')
        expect(evaluation).toHaveProperty('gradeColor')
        expect(['EXCELLENT', 'GOOD', 'NEEDS_IMPROVEMENT', 'POOR']).toContain(evaluation.overallGrade)
    })
})

// ─── PUSH SALE ────────────────────────────────────────────────

describe('Push Sale (Real DB)', () => {
    it('U-PS-01: getPushSaleItems — should return items sorted by urgency', async () => {
        const items = await getPushSaleItems()
        expect(Array.isArray(items)).toBe(true)
        for (const item of items) {
            expect(item).toHaveProperty('productId')
            expect(item).toHaveProperty('productName')
            expect(item).toHaveProperty('reason')
            expect(item).toHaveProperty('reasonType')
            expect(item).toHaveProperty('urgency')
            expect(item).toHaveProperty('suggestedDiscount')
            expect(['OXIDATION', 'LOW_GLASSES', 'SLOW_MOVING', 'NEAR_EXPIRY']).toContain(item.reasonType)
            expect(['HIGH', 'MEDIUM', 'LOW']).toContain(item.urgency)
        }
        // Verify sorted by urgency (HIGH < MEDIUM < LOW)
        const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
        for (let i = 1; i < items.length; i++) {
            expect(urgencyOrder[items[i].urgency]).toBeGreaterThanOrEqual(urgencyOrder[items[i - 1].urgency])
        }
    })

    it('U-PS-02: applyPushDiscount — invalid PIN should fail', async () => {
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!product) return
        const result = await applyPushDiscount(product.id, 20, '9876')
        expect(result.success).toBe(false)
    })

    it('U-PS-03: applyPushDiscount — discount out of range should fail', async () => {
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!product) return
        const result = await applyPushDiscount(product.id, 3, '1234')
        expect(result.success).toBe(false)
        expect(result.error).toContain('5%')
    })

    it('U-PS-04: applyPushDiscount — short PIN should fail', async () => {
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!product) return
        const result = await applyPushDiscount(product.id, 20, '12')
        expect(result.success).toBe(false)
        expect(result.error).toContain('PIN')
    })
})

// ─── INVENTORY ALERTS ─────────────────────────────────────────

describe('Inventory Alerts (Real DB)', () => {
    it('U-IA-01: getInventoryAlerts — should return alert list', async () => {
        const alerts = await getInventoryAlerts()
        expect(Array.isArray(alerts)).toBe(true)
        for (const a of alerts) {
            expect(a).toHaveProperty('id')
            expect(a).toHaveProperty('severity')
            expect(a).toHaveProperty('type')
            expect(a).toHaveProperty('title')
            expect(a).toHaveProperty('description')
            expect(['CRITICAL', 'WARNING', 'INFO']).toContain(a.severity)
        }
        // Verify sorted by severity (CRITICAL first)
        const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 }
        for (let i = 1; i < alerts.length; i++) {
            expect(severityOrder[alerts[i].severity]).toBeGreaterThanOrEqual(severityOrder[alerts[i - 1].severity])
        }
    })

    it('U-IA-02: getAlertSummary — should return severity counts', async () => {
        const summary = await getAlertSummary()
        expect(summary).toHaveProperty('critical')
        expect(summary).toHaveProperty('warning')
        expect(summary).toHaveProperty('info')
        expect(summary).toHaveProperty('total')
        expect(summary.total).toBe(summary.critical + summary.warning + summary.info)
    })
})
