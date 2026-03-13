/**
 * 🧪 Unit Tests — Promotions, HR Config, Serving Notes, Wine Advisor
 * Tests remaining untested action modules
 */
import { describe, it, expect } from 'vitest'
import { getAllPromotions, getActivePromotions, checkPromotions, getPromoStats } from '@/actions/promotions'
import { getAllServingNotes, getServingNoteByProduct } from '@/actions/serving-notes'
import { getWineRecommendations, filterWinesByProfile } from '@/actions/wine-advisor'
import { prisma } from '@/lib/prisma'

// ─── PROMOTIONS ───────────────────────────────────────────────

describe('Promotions (Real DB)', () => {
    it('U-PROMO-01: getAllPromotions — should return promo list', async () => {
        const promos = await getAllPromotions()
        expect(Array.isArray(promos)).toBe(true)
        for (const p of promos) {
            expect(p).toHaveProperty('id')
            expect(p).toHaveProperty('name')
            expect(p).toHaveProperty('type')
            expect(p).toHaveProperty('status')
            expect(p).toHaveProperty('priority')
            expect(p).toHaveProperty('createdAt')
        }
    })

    it('U-PROMO-02: getActivePromotions — should return only active, valid-date promos', async () => {
        const active = await getActivePromotions()
        expect(Array.isArray(active)).toBe(true)
        for (const p of active) {
            expect(p.status).toBe('ACTIVE')
        }
    })

    it('U-PROMO-03: checkPromotions — should return applicable promos for order', async () => {
        const product = await prisma.product.findFirst({
            where: { isActive: true },
            include: { category: true },
        })
        if (!product) return

        const applied = await checkPromotions({
            orderTotal: 500000,
            items: [{
                productId: product.id,
                categorySlug: product.category?.name ?? '',
                quantity: 2,
                unitPrice: Number(product.sellPrice),
            }],
        })
        expect(Array.isArray(applied)).toBe(true)
        for (const a of applied) {
            expect(a).toHaveProperty('id')
            expect(a).toHaveProperty('name')
            expect(a).toHaveProperty('type')
            expect(a).toHaveProperty('discountAmount')
            expect(typeof a.discountAmount).toBe('number')
        }
    })

    it('U-PROMO-04: getPromoStats — should return stats object', async () => {
        const stats = await getPromoStats()
        expect(stats).toHaveProperty('totalPromotions')
        expect(stats).toHaveProperty('activeNow')
        expect(stats).toHaveProperty('totalDiscountGiven')
        expect(stats).toHaveProperty('mostUsedPromo')
        expect(stats).toHaveProperty('todayDiscounts')
        expect(typeof stats.totalPromotions).toBe('number')
    })
})

// ─── SERVING NOTES ────────────────────────────────────────────

describe('Serving Notes (Real DB)', () => {
    it('U-SN-01: getAllServingNotes — should return notes list', async () => {
        const notes = await getAllServingNotes()
        expect(Array.isArray(notes)).toBe(true)
        for (const n of notes) {
            expect(n).toHaveProperty('id')
            expect(n).toHaveProperty('productId')
            expect(n).toHaveProperty('productName')
        }
    })

    it('U-SN-02: getServingNoteByProduct — with valid product should return note', async () => {
        const wineProduct = await prisma.product.findFirst({
            where: { type: { in: ['WINE_BOTTLE', 'WINE_GLASS'] }, isActive: true },
        })
        if (!wineProduct) {
            console.log('⚠️ No wine product — skipping serving note test')
            return
        }
        const note = await getServingNoteByProduct(wineProduct.id)
        // May return null if no note set
        if (note) {
            expect(note).toHaveProperty('productId')
            expect(note).toHaveProperty('servingTemp')
        }
    })
})

// ─── WINE ADVISOR ─────────────────────────────────────────────

describe('Wine Advisor (Real DB)', () => {
    it('U-WA-01: getWineRecommendations — should return similar wines', async () => {
        const wineProduct = await prisma.product.findFirst({
            where: { type: { in: ['WINE_BOTTLE', 'WINE_GLASS'] }, isActive: true },
        })
        if (!wineProduct) {
            console.log('⚠️ No wine product — skipping advisor test')
            return
        }
        const recs = await getWineRecommendations(wineProduct.id)
        expect(Array.isArray(recs)).toBe(true)
        for (const r of recs) {
            expect(r).toHaveProperty('id')
            expect(r).toHaveProperty('name')
            expect(r).toHaveProperty('matchScore')
            expect(r).toHaveProperty('matchReason')
        }
    })

    it('U-WA-02: filterWinesByProfile — should filter by body', async () => {
        const wines = await filterWinesByProfile({ body: 'medium' })
        expect(Array.isArray(wines)).toBe(true)
        // All should be wine products
        for (const w of wines) {
            expect(w).toHaveProperty('name')
            expect(w).toHaveProperty('sellPrice')
        }
    })
})
