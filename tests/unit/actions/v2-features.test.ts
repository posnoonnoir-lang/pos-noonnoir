/**
 * 🧪 Unit Tests — V2 Features (Forecast, ShiftTargets, PushSale, InventoryAlerts, ServingNotes)
 */
import { describe, it, expect } from 'vitest'
import { calculateForecast, getForecastSummary } from '@/actions/forecast'
import { suggestShiftTargets, evaluateShift, getShiftTargetHistory } from '@/actions/shift-targets'
import { getPushSaleItems, applyPushDiscount } from '@/actions/push-sale'
import { getInventoryAlerts, getAlertSummary } from '@/actions/inventory-alerts'
import { getAllServingNotes, searchServingNotes } from '@/actions/serving-notes'

describe('Forecast — V2 (Real DB)', () => {
    it('U-FC-01: calculateForecast — should return forecast items', async () => {
        const items = await calculateForecast()
        expect(Array.isArray(items)).toBe(true)
        for (const item of items) {
            expect(item).toHaveProperty('productId')
            expect(item).toHaveProperty('productName')
            expect(item).toHaveProperty('suggestedQty')
            expect(item).toHaveProperty('confidence')
            expect(item).toHaveProperty('status')
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
})

describe('Shift Targets — V2 (Real DB)', () => {
    it('U-ST-01: suggestShiftTargets — should return suggested targets', async () => {
        const suggestion = await suggestShiftTargets('fake-shift-id')
        expect(suggestion).toHaveProperty('revenueTarget')
        expect(suggestion).toHaveProperty('orderTarget')
        expect(suggestion).toHaveProperty('customerTarget')
        expect(suggestion).toHaveProperty('pushProducts')
        expect(suggestion).toHaveProperty('basedOn')
        expect(suggestion.revenueTarget).toBeGreaterThan(0)
        expect(Array.isArray(suggestion.pushProducts)).toBe(true)
    })

    it('U-ST-02: evaluateShift — should return grade evaluation', async () => {
        // Use valid UUID format (Prisma validates UUID input)
        const evaluation = await evaluateShift('00000000-0000-0000-0000-000000000000', {
            revenue: 5000000,
            orders: 15,
            customers: 20,
        })
        expect(evaluation).toHaveProperty('revenuePct')
        expect(evaluation).toHaveProperty('orderPct')
        expect(evaluation).toHaveProperty('overallGrade')
        expect(evaluation).toHaveProperty('gradeLabel')
        expect(['EXCELLENT', 'GOOD', 'NEEDS_IMPROVEMENT', 'POOR']).toContain(evaluation.overallGrade)
    })

    it('U-ST-03: getShiftTargetHistory — should return history list', async () => {
        const history = await getShiftTargetHistory(30)
        expect(Array.isArray(history)).toBe(true)
    })
})

describe('Push Sale — V2 (Real DB)', () => {
    it('U-PS-01: getPushSaleItems — should return push sale items', async () => {
        const items = await getPushSaleItems()
        expect(Array.isArray(items)).toBe(true)
        for (const item of items) {
            expect(item).toHaveProperty('productId')
            expect(item).toHaveProperty('reasonType')
            expect(item).toHaveProperty('urgency')
            expect(['OXIDATION', 'LOW_GLASSES', 'SLOW_MOVING', 'NEAR_EXPIRY']).toContain(item.reasonType)
            expect(['HIGH', 'MEDIUM', 'LOW']).toContain(item.urgency)
        }
    })

    it('U-PS-02: applyPushDiscount — invalid PIN should fail', async () => {
        const result = await applyPushDiscount('product-id', 20, '12')
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
    })

    it('U-PS-03: applyPushDiscount — invalid discount range should fail', async () => {
        const result = await applyPushDiscount('product-id', 60, '1234')
        expect(result.success).toBe(false)
        expect(result.error).toContain('5%')
    })
})

describe('Inventory Alerts — V2 (Real DB)', () => {
    it('U-IA-01: getInventoryAlerts — should return severity-sorted alerts', async () => {
        const alerts = await getInventoryAlerts()
        expect(Array.isArray(alerts)).toBe(true)
        for (const alert of alerts) {
            expect(alert).toHaveProperty('severity')
            expect(alert).toHaveProperty('title')
            expect(alert).toHaveProperty('description')
            expect(['CRITICAL', 'WARNING', 'INFO']).toContain(alert.severity)
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

describe('Serving Notes — V2 (Real DB)', () => {
    it('U-SN-01: getAllServingNotes — should return wine serving notes', async () => {
        const notes = await getAllServingNotes()
        expect(Array.isArray(notes)).toBe(true)
        if (notes.length > 0) {
            expect(notes[0]).toHaveProperty('productName')
            expect(notes[0]).toHaveProperty('servingTemp')
            expect(notes[0]).toHaveProperty('glassType')
            expect(notes[0]).toHaveProperty('tastingNotes')
        }
    })

    it('U-SN-02: searchServingNotes — empty query returns all', async () => {
        const all = await getAllServingNotes()
        const searched = await searchServingNotes('')
        expect(searched.length).toBe(all.length)
    })
})
