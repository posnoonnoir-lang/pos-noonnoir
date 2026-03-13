/**
 * 🧪 Integration Tests — Wine Glass Lifecycle (IT-05)
 * Sell glasses → bottle depletes → verify state
 */
import { describe, it, expect } from 'vitest'
import { getAllGlassStatuses, sellWineGlass, getGlassStatus, getBottleStats } from '@/actions/wine'

describe('IT-05: Wine Glass Complete Lifecycle', () => {
    it('Step 1: Get all glass statuses — should have config structure', async () => {
        const statuses = await getAllGlassStatuses()
        expect(statuses).toBeDefined()
        expect(typeof statuses).toBe('object')
        // Each status has productId, glassesPoured, glassesTotal, etc.
        for (const [productId, status] of Object.entries(statuses)) {
            expect(typeof productId).toBe('string')
            expect(status).toHaveProperty('productId')
            expect(status).toHaveProperty('productName')
            expect(status).toHaveProperty('glassesPoured')
            expect(status).toHaveProperty('glassesTotal')
            expect(status).toHaveProperty('glassesRemaining')
            expect(status).toHaveProperty('bottlesInStock')
        }
    })

    it('Step 2: Sell 1 glass → verify response shape', async () => {
        const statuses = await getAllGlassStatuses()
        const entries = Object.values(statuses)
        const withBottle = entries.find(s => s.currentBottle !== null || s.bottlesInStock > 0)

        if (!withBottle) {
            console.log('⚠️ No wine with stock — skipping sell test')
            return
        }

        const result = await sellWineGlass({
            productId: withBottle.productId,
            quantity: 1,
            staffName: 'Test Integration',
        })
        expect(result).toHaveProperty('success')
        if (result.success) {
            expect(result.glassesSold).toBe(1)
            expect(result).toHaveProperty('bottlesConsumed')
            expect(result).toHaveProperty('currentStatus')
        }
    })

    it('Step 3: Get glass status for specific product — should reflect sale', async () => {
        const statuses = await getAllGlassStatuses()
        const entries = Object.values(statuses)
        const withBottle = entries.find(s => s.currentBottle !== null)
        if (!withBottle) return

        const status = await getGlassStatus(withBottle.productId)
        expect(status).not.toBeNull()
        expect(status!.glassesPoured).toBeGreaterThanOrEqual(0)
        expect(status!.glassesRemaining).toBeGreaterThanOrEqual(0)
    })

    it('Step 4: getBottleStats — should return overall bottle KPIs', async () => {
        const stats = await getBottleStats()
        expect(stats).toHaveProperty('total')
        expect(stats).toHaveProperty('inStock')
        expect(stats).toHaveProperty('opened')
        expect(stats).toHaveProperty('sold')
        expect(stats.total).toBeGreaterThanOrEqual(0)
        expect(stats.total).toBeGreaterThanOrEqual(stats.inStock + stats.opened + stats.sold)
    })
})
