/**
 * 🧪 Unit Tests — Inventory (P1)
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
    getInventoryItems,
    getStockMovements,
    createStockMovement,
    getInventoryStats,
    createIngredient,
    updateIngredientStock,
} from '@/actions/inventory'
import { prisma } from '@/lib/prisma'

const createdIngredientIds: string[] = []
const createdMovementIds: string[] = []

describe('Inventory — Stock & Ingredients (Real DB)', () => {
    afterAll(async () => {
        for (const id of createdMovementIds) {
            try { await prisma.stockMovement.delete({ where: { id } }) } catch { /* */ }
        }
        for (const id of createdIngredientIds) {
            try { await prisma.ingredient.delete({ where: { id } }) } catch { /* */ }
        }
        await prisma.$disconnect()
    })

    it('U-INV-01: getInventoryItems — should return products, bottles, ingredients', async () => {
        const data = await getInventoryItems()
        expect(data).toHaveProperty('products')
        expect(data).toHaveProperty('bottles')
        expect(data).toHaveProperty('ingredients')
        expect(Array.isArray(data.products)).toBe(true)
        expect(Array.isArray(data.bottles)).toBe(true)
        expect(Array.isArray(data.ingredients)).toBe(true)
    })

    it('U-INV-02: getInventoryStats — should return bottle/ingredient counts', async () => {
        const stats = await getInventoryStats()
        expect(stats).toHaveProperty('totalBottles')
        expect(stats).toHaveProperty('totalIngredients')
        expect(stats).toHaveProperty('lowStockAlerts')
        expect(stats).toHaveProperty('totalItems')
        expect(stats.totalBottles).toBeGreaterThanOrEqual(0)
    })

    it('U-INV-03: createIngredient — should add new ingredient', async () => {
        const result = await createIngredient({
            name: 'Test Lime',
            unit: 'kg',
            currentStock: 10,
            minStock: 2,
            costPerUnit: 50000,
        })
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        createdIngredientIds.push(result.data!.id)
    })

    it('U-INV-04: updateIngredientStock — should update stock level', async () => {
        if (createdIngredientIds.length === 0) return
        const result = await updateIngredientStock(createdIngredientIds[0], 5)
        expect(result.success).toBe(true)

        const updated = await prisma.ingredient.findUnique({ where: { id: createdIngredientIds[0] } })
        expect(Number(updated?.currentStock)).toBe(5)
    })

    it('U-INV-05: createStockMovement — should record WASTE movement', async () => {
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!product) return

        const result = await createStockMovement({
            type: 'WASTE',
            productId: product.id,
            quantity: 1,
            reason: 'Test breakage',
        })
        expect(result.success).toBe(true)
    })

    it('U-INV-06: getStockMovements — should return movement list', async () => {
        const movements = await getStockMovements({ limit: 10 })
        expect(Array.isArray(movements)).toBe(true)
        if (movements.length > 0) {
            expect(movements[0]).toHaveProperty('id')
            expect(movements[0]).toHaveProperty('type')
            expect(movements[0]).toHaveProperty('quantity')
        }
    })
})
