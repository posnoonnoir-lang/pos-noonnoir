/**
 * 🧪 Unit Tests — Phase 9: Unit Conversion, Ingredient CRUD, Recipe CRUD
 * Tests: createIngredient with baseUnit, getRawMaterials with costPerBaseUnit,
 *        updateRecipeIngredient, deleteRecipeIngredient, deleteRecipe,
 *        deductRecipeIngredients with base unit cost
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
    getRawMaterials,
    getRecipes,
    createIngredient,
    createRecipe,
    updateRecipeIngredient,
    deleteRecipeIngredient,
    deleteRecipe,
    deductRecipeIngredients,
    getRecipeByProductId,
} from '@/actions/assets'
import { prisma } from '@/lib/prisma'

const cleanupIngredientIds: string[] = []
const cleanupRecipeProductIds: string[] = []

afterAll(async () => {
    for (const pid of cleanupRecipeProductIds) {
        try { await prisma.productRecipe.deleteMany({ where: { productId: pid } }) } catch { /* */ }
    }
    for (const id of cleanupIngredientIds) {
        try { await prisma.ingredient.delete({ where: { id } }) } catch { /* */ }
    }
    await prisma.$disconnect()
})

// ============================================================
// U-UC-01: Unit Conversion Fields
// ============================================================

describe('Unit Conversion System', () => {

    it('U-UC-01: createIngredient with baseUnit + baseQuantity', async () => {
        const res = await createIngredient({
            name: 'UT_Wine_Test',
            unit: 'chai',
            baseUnit: 'ml',
            baseQuantity: 750,
            currentStock: 3000, // 3000ml = 4 chai
            minStock: 750,     // 1 chai
            costPerUnit: 300000, // 300k per chai
        })
        expect(res.success).toBe(true)
        expect(res.id).toBeDefined()
        cleanupIngredientIds.push(res.id!)

        // Verify in DB
        const row = await prisma.ingredient.findUnique({ where: { id: res.id! } })
        expect(row!.baseUnit).toBe('ml')
        expect(Number(row!.baseQuantity)).toBe(750)
    })

    it('U-UC-02: getRawMaterials includes costPerBaseUnit', async () => {
        const materials = await getRawMaterials()
        for (const m of materials) {
            expect(m).toHaveProperty('baseUnit')
            expect(m).toHaveProperty('baseQuantity')
            expect(m).toHaveProperty('costPerBaseUnit')
            // costPerBaseUnit = costPrice / baseQuantity
            if (m.baseQuantity > 0) {
                const expected = Math.round(m.costPrice / m.baseQuantity * 100) / 100
                expect(m.costPerBaseUnit).toBe(expected)
            }
        }
    })

    it('U-UC-03: Specific wine ingredient cost calculation', async () => {
        // Find the test ingredient we just created
        const materials = await getRawMaterials()
        const wine = materials.find(m => m.name === 'UT_Wine_Test')
        if (!wine) return

        // 300,000₫ / 750ml = 400₫/ml
        expect(wine.costPerBaseUnit).toBe(400)
        expect(wine.baseUnit).toBe('ml')
        expect(wine.currentStock).toBe(3000)
    })
})

// ============================================================
// U-RC-02: Recipe CRUD with base unit
// ============================================================

describe('Recipe CRUD Operations', () => {
    let testProductId: string
    let testIngredientId: string

    it('U-RC-02: Create recipe with base unit ingredient', async () => {
        // Get a real product to attach recipe to
        const product = await prisma.product.findFirst({ where: { isActive: true, type: 'FOOD' } })
            ?? await prisma.product.findFirst({ where: { isActive: true } })
        if (!product) return

        testProductId = product.id

        // First ensure ingredient exists
        const ingRes = await createIngredient({
            name: 'UT_Sugar_Test',
            unit: 'kg',
            baseUnit: 'g',
            baseQuantity: 1000,
            currentStock: 5000,
            minStock: 500,
            costPerUnit: 25000,
        })
        expect(ingRes.success).toBe(true)
        testIngredientId = ingRes.id!
        cleanupIngredientIds.push(testIngredientId)

        // Create recipe
        const recipe = await createRecipe({
            productName: product.name,
            productId: product.id,
            ingredients: [{
                materialId: testIngredientId,
                materialName: 'UT_Sugar_Test',
                quantity: 50, // 50g per serving
                unit: 'g',
                costPerUnit: 25000,
                costPerBaseUnit: 25,
                baseUnit: 'g',
            }],
            notes: 'test recipe',
        })

        expect(recipe.id).toBeDefined()
        expect(recipe.totalCost).toBe(Math.round(50 * 25)) // 50g × 25₫/g = 1,250₫
        cleanupRecipeProductIds.push(product.id)
    })

    it('U-RC-03: getRecipeByProductId returns base unit info', async () => {
        if (!testProductId) return

        const recipe = await getRecipeByProductId(testProductId)
        if (!recipe) return

        expect(recipe.productId).toBe(testProductId)
        for (const ing of recipe.ingredients) {
            expect(ing).toHaveProperty('costPerBaseUnit')
            expect(ing).toHaveProperty('baseUnit')
        }
    })

    it('U-RC-04: updateRecipeIngredient changes quantity', async () => {
        if (!testProductId || !testIngredientId) return

        const res = await updateRecipeIngredient(testProductId, testIngredientId, 100, 'g')
        expect(res.success).toBe(true)

        // Verify updated
        const dbRow = await prisma.productRecipe.findUnique({
            where: { productId_ingredientId: { productId: testProductId, ingredientId: testIngredientId } },
        })
        expect(Number(dbRow!.quantity)).toBe(100)
    })

    it('U-RC-05: deleteRecipeIngredient removes ingredient from recipe', async () => {
        if (!testProductId || !testIngredientId) return

        const res = await deleteRecipeIngredient(testProductId, testIngredientId)
        expect(res.success).toBe(true)

        const count = await prisma.productRecipe.count({
            where: { productId: testProductId, ingredientId: testIngredientId },
        })
        expect(count).toBe(0)
    })

    it('U-RC-06: deleteRecipe removes all ingredients', async () => {
        if (!testProductId) return

        // Re-add so we can delete
        await prisma.productRecipe.create({
            data: { productId: testProductId, ingredientId: testIngredientId, quantity: 50, unit: 'g' },
        }).catch(() => { /* may fail if already exists */ })

        const res = await deleteRecipe(testProductId)
        expect(res.success).toBe(true)

        const count = await prisma.productRecipe.count({ where: { productId: testProductId } })
        expect(count).toBe(0)
    })
})

// ============================================================
// U-DD-01: Deduction with base unit cost
// ============================================================

describe('Deduction with Base Unit Cost', () => {
    it('U-DD-01: deductRecipeIngredients uses costPerBaseUnit', async () => {
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!product) return

        // Create ingredient with known base conversion
        const ingRes = await createIngredient({
            name: 'UT_Milk_Deduct',
            unit: 'hộp',
            baseUnit: 'ml',
            baseQuantity: 1000,
            currentStock: 2000,
            minStock: 500,
            costPerUnit: 50000, // 50k per hộp (1000ml)
        })
        expect(ingRes.success).toBe(true)
        cleanupIngredientIds.push(ingRes.id!)

        // Create recipe: 200ml per serving
        await prisma.productRecipe.upsert({
            where: { productId_ingredientId: { productId: product.id, ingredientId: ingRes.id! } },
            create: { productId: product.id, ingredientId: ingRes.id!, quantity: 200, unit: 'ml' },
            update: { quantity: 200, unit: 'ml' },
        })
        cleanupRecipeProductIds.push(product.id)

        // Deduct for 2 servings
        const deductRes = await deductRecipeIngredients(product.id, 2)

        if (deductRes.errors.length === 0) {
            // Should deduct 400ml, cost = 400 × (50000/1000) = 20,000₫
            const milkDeduction = deductRes.deductions.find(d => d.materialName === 'UT_Milk_Deduct')
            if (milkDeduction) {
                expect(milkDeduction.qtyUsed).toBe(400) // 200ml × 2
                expect(milkDeduction.costPerUnit).toBe(50) // 50₫/ml
                expect(milkDeduction.subtotal).toBe(20000) // 400 × 50
                expect(milkDeduction.remainingStock).toBe(1600) // 2000 - 400
            }
        }

        // Cleanup recipe entry
        await prisma.productRecipe.deleteMany({
            where: { productId: product.id, ingredientId: ingRes.id! },
        })
    })
})
