/**
 * 🧪 Unit Tests — Assets (Equipment, Raw Materials, Recipes)
 */
import { describe, it, expect } from 'vitest'
import {
    getEquipment,
    getEquipmentStats,
    getDepreciationHistory,
    getRawMaterials,
    getRawMaterialStats,
    getRecipes,
} from '@/actions/assets'

describe('Equipment — CCDC (Real DB)', () => {
    it('U-EQ-01: getEquipment — should return equipment list', async () => {
        const equipment = await getEquipment()
        expect(Array.isArray(equipment)).toBe(true)
        for (const e of equipment) {
            expect(e).toHaveProperty('name')
            expect(e).toHaveProperty('code')
            expect(e).toHaveProperty('status')
            expect(e).toHaveProperty('netBookValue')
        }
    })

    it('U-EQ-02: getEquipmentStats — should return aggregate stats', async () => {
        const stats = await getEquipmentStats()
        expect(stats).toHaveProperty('totalItems')
        expect(stats).toHaveProperty('totalOriginalValue')
        expect(stats).toHaveProperty('totalNetBookValue')
        expect(stats).toHaveProperty('totalAccumulatedDep')
    })

    it('U-EQ-03: getDepreciationHistory — should return entries', async () => {
        const history = await getDepreciationHistory()
        expect(Array.isArray(history)).toBe(true)
        if (history.length > 0) {
            expect(history[0]).toHaveProperty('equipmentName')
            expect(history[0]).toHaveProperty('month')
            expect(history[0]).toHaveProperty('amount')
        }
    })
})

describe('Raw Materials / Ingredients (Real DB)', () => {
    it('U-RM-01: getRawMaterials — should return material list', async () => {
        const materials = await getRawMaterials()
        expect(Array.isArray(materials)).toBe(true)
        for (const m of materials) {
            expect(m).toHaveProperty('name')
            expect(m).toHaveProperty('unit')
            expect(m).toHaveProperty('currentStock')
            expect(m).toHaveProperty('status')
            expect(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).toContain(m.status)
        }
    })

    it('U-RM-02: getRawMaterialStats — should return stats', async () => {
        const stats = await getRawMaterialStats()
        expect(stats).toHaveProperty('totalItems')
        expect(stats).toHaveProperty('lowStock')
        expect(stats).toHaveProperty('outOfStock')
        expect(stats).toHaveProperty('totalValue')
    })
})

describe('Recipes (Real DB)', () => {
    it('U-RC-01: getRecipes — should return recipe list', async () => {
        const recipes = await getRecipes()
        expect(Array.isArray(recipes)).toBe(true)
        for (const r of recipes) {
            expect(r).toHaveProperty('productName')
            expect(r).toHaveProperty('ingredients')
            expect(r).toHaveProperty('totalCost')
            expect(Array.isArray(r.ingredients)).toBe(true)
        }
    })
})
