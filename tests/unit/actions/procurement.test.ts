/**
 * 🧪 Unit Tests — Procurement (P1)
 * Tests suppliers, purchase receipts (BQGQ), and procurement stats
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
    getSuppliers,
    createSupplier,
    getPurchaseReceipts,
    createPurchaseReceipt,
    getProcurementStats,
    getIngredientPurchaseHistory,
} from '@/actions/procurement'
import { prisma } from '@/lib/prisma'

const testSupplierIds: string[] = []

afterAll(async () => {
    for (const id of testSupplierIds) {
        try { await prisma.supplier.delete({ where: { id } }) } catch { /* */ }
    }
    await prisma.$disconnect()
})

describe('Procurement — Suppliers (Real DB)', () => {
    it('U-PROC-01: getSuppliers — should return supplier list', async () => {
        const suppliers = await getSuppliers()
        expect(Array.isArray(suppliers)).toBe(true)
        if (suppliers.length > 0) {
            expect(suppliers[0]).toHaveProperty('id')
            expect(suppliers[0]).toHaveProperty('name')
            expect(suppliers[0]).toHaveProperty('isActive')
        }
    })

    it('U-PROC-02: createSupplier — should create new supplier', async () => {
        const result = await createSupplier({
            name: `Test Supplier ${Date.now()}`,
            contactName: 'Test Contact',
            phone: '0909123456',
        })
        expect(result).toHaveProperty('success')
        expect(result.success).toBe(true)
        if (result.success && result.data) testSupplierIds.push(result.data.id)
    })

    it('U-PROC-03: getSuppliers — created supplier should appear in list', async () => {
        if (testSupplierIds.length === 0) return
        const suppliers = await getSuppliers()
        const found = suppliers.find(s => s.id === testSupplierIds[0])
        expect(found).toBeDefined()
    })
})

describe('Procurement — Purchase Receipts (Real DB)', () => {
    it('U-PROC-04: getPurchaseReceipts — should return receipt history', async () => {
        const receipts = await getPurchaseReceipts()
        expect(Array.isArray(receipts)).toBe(true)
        if (receipts.length > 0) {
            expect(receipts[0]).toHaveProperty('receiptNo')
            expect(receipts[0]).toHaveProperty('supplierName')
            expect(receipts[0]).toHaveProperty('items')
            expect(receipts[0]).toHaveProperty('totalAmount')
        }
    })

    it('U-PROC-05: createPurchaseReceipt — should create receipt and update stock (BQGQ)', async () => {
        const suppliers = await getSuppliers()
        if (suppliers.length === 0) {
            console.log('⚠️ No suppliers — skipping purchase receipt test')
            return
        }

        const ingredient = await prisma.ingredient.findFirst({ where: { isActive: true } })
        if (!ingredient) {
            console.log('⚠️ No active ingredients — skipping purchase receipt test')
            return
        }

        const stockBefore = Number(ingredient.currentStock)
        const result = await createPurchaseReceipt({
            supplierId: suppliers[0].id,
            items: [{
                ingredientId: ingredient.id,
                quantity: 1,
                unitCost: 50000,
            }],
            notes: 'Test purchase receipt',
        })

        expect(result).toHaveProperty('success')
        expect(result.success).toBe(true)
        expect(result).toHaveProperty('receiptNo')

        // Verify stock increased
        const updated = await prisma.ingredient.findUnique({ where: { id: ingredient.id } })
        const stockAfter = Number(updated?.currentStock ?? 0)
        expect(stockAfter).toBeGreaterThan(stockBefore)
    })

    it('U-PROC-06: getIngredientPurchaseHistory — should return history for ingredient', async () => {
        const ingredient = await prisma.ingredient.findFirst()
        if (!ingredient) return

        const history = await getIngredientPurchaseHistory(ingredient.id)
        expect(Array.isArray(history)).toBe(true)
    })
})

describe('Procurement — Stats (Real DB)', () => {
    it('U-PROC-07: getProcurementStats — should return procurement KPIs', async () => {
        const stats = await getProcurementStats()
        expect(stats).toHaveProperty('totalSuppliers')
        expect(stats).toHaveProperty('totalPurchases')
        expect(stats).toHaveProperty('totalSpent')
        expect(typeof stats.totalSuppliers).toBe('number')
    })
})
