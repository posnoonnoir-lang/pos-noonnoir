/**
 * 🧪 Integration Tests — Shift, Tab, Inventory Flows
 */
import { describe, it, expect, afterAll } from 'vitest'
import { openShift, closeShift, getCurrentShift } from '@/actions/shifts'
import { createQuickCustomer, openTab, addTabItem, closeTab, getTabById } from '@/actions/tabs'
import { createIngredient, updateIngredientStock, getInventoryStats } from '@/actions/inventory'
import { suggestShiftTargets, evaluateShift } from '@/actions/shift-targets'
import { getInventoryAlerts, getAlertSummary } from '@/actions/inventory-alerts'
import { prisma } from '@/lib/prisma'

const cleanupShiftIds: string[] = []
const cleanupTabIds: string[] = []
const cleanupCustomerIds: string[] = []
const cleanupIngredientIds: string[] = []

afterAll(async () => {
    for (const id of cleanupTabIds) {
        try {
            await prisma.tabItem.deleteMany({ where: { tabId: id } })
            await prisma.customerTab.delete({ where: { id } })
        } catch { /* */ }
    }
    for (const id of cleanupCustomerIds) {
        try { await prisma.customer.delete({ where: { id } }) } catch { /* */ }
    }
    for (const id of cleanupIngredientIds) {
        try { await prisma.ingredient.delete({ where: { id } }) } catch { /* */ }
    }
    for (const id of cleanupShiftIds) {
        try {
            await prisma.shiftTarget.deleteMany({ where: { shiftRecordId: id } })
            await prisma.shiftRecord.delete({ where: { id } })
        } catch { /* */ }
    }

    // Ensure a shift is open for POS operation
    const openShift = await prisma.shiftRecord.findFirst({ where: { closedAt: null } })
    if (!openShift) {
        const owner = await prisma.staff.findFirst({ where: { role: 'OWNER', isActive: true } })
        if (owner) {
            await prisma.shiftRecord.create({ data: { staffId: owner.id, openingCash: 500000 } })
        }
    }

    await prisma.$disconnect()
})

describe('IT-05: Shift Lifecycle + Target Evaluation', () => {
    it('Open shift → get targets → close → evaluate', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) return

        // Close existing shift first
        const existing = await getCurrentShift()
        if (existing) {
            await closeShift({ shiftId: existing.id, closingCash: Number(existing.openingCash) })
        }

        // Open new shift
        const openResult = await openShift({
            staffId: staff.id,
            staffName: staff.fullName,
            openingCash: 1000000,
        })
        expect(openResult.success).toBe(true)
        if (!openResult.data) return
        cleanupShiftIds.push(openResult.data.id)

        // Get suggested targets
        const suggestion = await suggestShiftTargets(openResult.data.id)
        expect(suggestion.revenueTarget).toBeGreaterThan(0)

        // Close shift
        const closeResult = await closeShift({
            shiftId: openResult.data.id,
            closingCash: 1050000,
        })
        expect(closeResult.success).toBe(true)

        // Evaluate with actual results
        const evaluation = await evaluateShift(openResult.data.id, {
            revenue: 4500000,
            orders: 12,
            customers: 18,
        })
        expect(evaluation).toHaveProperty('overallGrade')
        expect(['EXCELLENT', 'GOOD', 'NEEDS_IMPROVEMENT', 'POOR']).toContain(evaluation.overallGrade)
    })
})

describe('IT-06: Customer Tab Full Lifecycle', () => {
    it('Create customer → open tab → add items → verify → close', async () => {
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) return

        // Create customer
        const cusResult = await createQuickCustomer({ fullName: 'Int Test Customer', phone: '0988887777' })
        expect(cusResult.success).toBe(true)
        if (!cusResult.data) return
        const customer = cusResult.data as { id: string }
        cleanupCustomerIds.push(customer.id)

        // Open tab
        const tabResult = await openTab({
            customerId: customer.id,
            staffId: staff.id,
            staffName: staff.fullName,
            tabLimit: 3000000,
        })
        expect(tabResult.success).toBe(true)
        if (!tabResult.data) return
        const tab = tabResult.data as { id: string }
        cleanupTabIds.push(tab.id)

        // Add items
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!product) return

        const addResult = await addTabItem({
            tabId: tab.id,
            productId: product.id,
            productName: product.name,
            unitPrice: Number(product.sellPrice),
            quantity: 2,
            staffId: staff.id,
            staffName: staff.fullName,
        })
        expect(addResult.success).toBe(true)

        // Verify tab total
        const fetchedTab = await getTabById(tab.id)
        expect(fetchedTab).toBeDefined()
        expect(Number(fetchedTab!.currentTotal)).toBeGreaterThan(0)

        // Close tab
        const closeResult = await closeTab({ tabId: tab.id, paymentMethod: 'CASH' })
        expect(closeResult.success).toBe(true)

        // Verify closed
        const closedTab = await getTabById(tab.id)
        expect(closedTab!.status).toBe('CLOSED')
    })
})

describe('IT-07: Inventory Alert Pipeline', () => {
    it('Create low-stock ingredient → verify alerts update', async () => {
        const result = await createIngredient({
            name: 'ITTest Low Stock Item',
            unit: 'kg',
            currentStock: 0.5,
            minStock: 5,
            costPerUnit: 30000,
        })
        expect(result.success).toBe(true)
        if (!result.data) return
        cleanupIngredientIds.push(result.data.id)

        // Check alerts include our low stock
        const summary = await getAlertSummary()
        expect(summary.total).toBeGreaterThan(0)
        expect(summary.warning + summary.critical).toBeGreaterThan(0)

        // Fix stock level
        await updateIngredientStock(result.data.id, 10)
        const ingredient = await prisma.ingredient.findUnique({ where: { id: result.data.id } })
        expect(Number(ingredient!.currentStock)).toBe(10)
    })
})

describe('IT-08: Inventory Stats Consistency', () => {
    it('Stats should have valid non-negative values', async () => {
        const stats = await getInventoryStats()
        expect(stats.totalBottles).toBeGreaterThanOrEqual(0)
        expect(stats.totalIngredients).toBeGreaterThanOrEqual(0)
        expect(stats.totalItems).toBeGreaterThanOrEqual(0)
    })
})
