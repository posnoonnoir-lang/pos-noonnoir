/**
 * 🧪 Unit Tests — Menu & Products (P1)
 * Tests product management against REAL Supabase database
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
    getProducts,
    getCategories,
    getProductById,
    toggleProductActive,
} from '@/actions/menu'
import { prisma } from '@/lib/prisma'

describe('Menu — Products & Categories (Real DB)', () => {

    afterAll(async () => {
        await prisma.$disconnect()
    })

    // ─── U-MEN-01: getCategories ──────────────────────────────
    it('U-MEN-01: getCategories — should return category list', async () => {
        const categories = await getCategories()
        expect(Array.isArray(categories)).toBe(true)
        expect(categories.length).toBeGreaterThan(0)
        expect(categories[0]).toHaveProperty('id')
        expect(categories[0]).toHaveProperty('name')
    })

    // ─── U-MEN-02: getProducts — all ──────────────────────────
    it('U-MEN-02: getProducts — should return product list', async () => {
        const products = await getProducts()
        expect(Array.isArray(products)).toBe(true)
        expect(products.length).toBeGreaterThan(0)
        expect(products[0]).toHaveProperty('id')
        expect(products[0]).toHaveProperty('name')
        expect(products[0]).toHaveProperty('sellPrice')
        expect(products[0]).toHaveProperty('category')
    })

    // ─── U-MEN-03: getProductById ─────────────────────────────
    it('U-MEN-03: getProductById — should return specific product', async () => {
        const products = await getProducts()
        if (products.length === 0) return

        const result = await getProductById(products[0].id)
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data!.id).toBe(products[0].id)
    })

    // ─── U-MEN-04: toggleProductActive ────────────────────────
    it('U-MEN-04: toggleProductActive — should flip isActive', async () => {
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!product) return

        // Toggle off
        const result1 = await toggleProductActive(product.id)
        expect(result1.success).toBe(true)

        const after1 = await prisma.product.findUnique({ where: { id: product.id } })
        expect(after1?.isActive).toBe(false)

        // Toggle back on (cleanup)
        const result2 = await toggleProductActive(product.id)
        expect(result2.success).toBe(true)

        const after2 = await prisma.product.findUnique({ where: { id: product.id } })
        expect(after2?.isActive).toBe(true)
    })
})
