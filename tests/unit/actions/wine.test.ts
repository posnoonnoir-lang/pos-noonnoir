/**
 * 🧪 Unit Tests — Wine Glass & Bottle Tracking (P0 Critical)
 * Tests wine selling logic against REAL Supabase database
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
    getAllGlassStatuses,
    sellWineGlass,
    sellWineBottle,
    getAllBottles,
    getBottleStats,
    getBottlesByProduct,
} from '@/actions/wine'
import { prisma } from '@/lib/prisma'

describe('Wine — Glass & Bottle Tracking (Real DB)', () => {

    afterAll(async () => {
        await prisma.$disconnect()
    })

    // ─── U-WINE-01: getAllGlassStatuses ────────────────────────
    it('U-WINE-01: getAllGlassStatuses — should return glass config map', async () => {
        const statuses = await getAllGlassStatuses()
        expect(statuses).toBeDefined()
        expect(typeof statuses).toBe('object')

        // Each status should have expected shape
        for (const [productId, status] of Object.entries(statuses)) {
            expect(productId).toBeTruthy()
            expect(status).toHaveProperty('productId')
            expect(status).toHaveProperty('productName')
            expect(status).toHaveProperty('glassesPoured')
            expect(status).toHaveProperty('glassesTotal')
            expect(status).toHaveProperty('glassesRemaining')
            expect(status).toHaveProperty('bottlesInStock')
            expect(status.glassesRemaining).toBeGreaterThanOrEqual(0)
        }
    })

    // ─── U-WINE-02: getAllBottles ──────────────────────────────
    it('U-WINE-02: getAllBottles — should return bottle list', async () => {
        const bottles = await getAllBottles()
        expect(Array.isArray(bottles)).toBe(true)

        if (bottles.length > 0) {
            const bottle = bottles[0]
            expect(bottle).toHaveProperty('id')
            expect(bottle).toHaveProperty('productId')
            expect(bottle).toHaveProperty('productName')
            expect(bottle).toHaveProperty('status')
            expect(bottle).toHaveProperty('source')
            expect(bottle).toHaveProperty('costPrice')
            expect(['IN_STOCK', 'OPENED', 'SOLD', 'RETURNED', 'DAMAGED']).toContain(bottle.status)
            expect(['PURCHASED', 'CONSIGNED']).toContain(bottle.source)
        }
    })

    // ─── U-WINE-03: getBottleStats ────────────────────────────
    it('U-WINE-03: getBottleStats — should return aggregate stats', async () => {
        const stats = await getBottleStats()
        expect(stats).toBeDefined()
        expect(stats).toHaveProperty('total')
        expect(stats).toHaveProperty('inStock')
        expect(stats).toHaveProperty('opened')
        expect(stats).toHaveProperty('sold')
        expect(stats.total).toBeGreaterThanOrEqual(0)
        expect(stats.inStock).toBeGreaterThanOrEqual(0)
    })

    // ─── U-WINE-04: sellWineGlass — basic sell ────────────────
    it('U-WINE-04: sellWineGlass — should sell glass and decrement remaining', async () => {
        // Find a wine product with glass config and available bottles
        const glassConfig = await prisma.wineGlassConfig.findFirst({
            include: {
                glassProduct: true,
                bottleProduct: true,
            },
        })

        if (!glassConfig) {
            console.log('⚠️ No glass config found — skipping sellWineGlass test')
            return
        }

        // Check if there are bottles in stock
        const bottlesInStock = await prisma.wineBottle.count({
            where: { productId: glassConfig.bottleProductId, status: 'IN_STOCK' },
        })
        const bottlesOpened = await prisma.wineBottle.count({
            where: { productId: glassConfig.bottleProductId, status: 'OPENED' },
        })

        if (bottlesInStock === 0 && bottlesOpened === 0) {
            console.log('⚠️ No bottles available — skipping sellWineGlass test')
            return
        }

        const statusBefore = await getAllGlassStatuses()
        const glassBefore = statusBefore[glassConfig.glassProductId]

        const result = await sellWineGlass({
            productId: glassConfig.glassProductId,
            quantity: 1,
            staffName: 'Test Staff',
        })

        expect(result.success).toBe(true)
        expect(result.glassesSold).toBe(1)
        expect(result.currentStatus).toBeDefined()

        // Glass remaining should decrease by 1
        if (glassBefore && result.currentStatus) {
            expect(result.currentStatus.glassesPoured).toBe(glassBefore.glassesPoured + 1)
        }
    })

    // ─── U-WINE-05: sellWineBottle — whole bottle ─────────────
    it('U-WINE-05: sellWineBottle — should mark bottle as SOLD', async () => {
        // Find a wine product with IN_STOCK bottles
        const bottle = await prisma.wineBottle.findFirst({
            where: { status: 'IN_STOCK' },
            include: { product: true },
        })

        if (!bottle) {
            console.log('⚠️ No IN_STOCK bottles — skipping sellWineBottle test')
            return
        }

        const result = await sellWineBottle({
            productId: bottle.productId,
            quantity: 1,
        })

        expect(result.success).toBe(true)
        expect(result.bottlesSold.length).toBe(1)

        // Verify in DB
        const soldBottle = await prisma.wineBottle.findUnique({ where: { id: result.bottlesSold[0] } })
        expect(soldBottle?.status).toBe('SOLD')
    })

    // ─── U-WINE-06: getBottlesByProduct ───────────────────────
    it('U-WINE-06: getBottlesByProduct — should filter by product', async () => {
        const bottle = await prisma.wineBottle.findFirst()
        if (!bottle) return

        const bottles = await getBottlesByProduct(bottle.productId)
        expect(Array.isArray(bottles)).toBe(true)
        for (const b of bottles) {
            expect(b.productId).toBe(bottle.productId)
        }
    })
})
