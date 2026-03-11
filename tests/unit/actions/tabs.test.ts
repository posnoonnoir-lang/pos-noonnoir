/**
 * 🧪 Unit Tests — Customer Tabs (P0 Critical)
 * Tests tab lifecycle against REAL Supabase database
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
    openTab,
    getOpenTabs,
    getTabById,
    addTabItem,
    addMultipleTabItems,
    closeTab,
    removeTabItem,
    searchCustomers,
    createQuickCustomer,
} from '@/actions/tabs'
import { prisma } from '@/lib/prisma'

const testTabIds: string[] = []
const testCustomerIds: string[] = []

describe('Tabs — Customer Tab Lifecycle (Real DB)', () => {

    afterAll(async () => {
        // Cleanup: tabs → items → customer
        for (const id of testTabIds) {
            try {
                await prisma.tabItem.deleteMany({ where: { tabId: id } })
                await prisma.customerTab.delete({ where: { id } })
            } catch { /* ignore */ }
        }
        for (const id of testCustomerIds) {
            try {
                await prisma.customer.delete({ where: { id } })
            } catch { /* ignore */ }
        }
        await prisma.$disconnect()
    })

    // ─── U-TAB-01: createQuickCustomer ────────────────────────
    it('U-TAB-01: createQuickCustomer — should create customer', async () => {
        const result = await createQuickCustomer({
            fullName: 'Test Tab Customer',
            phone: '0901234567',
        })

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        const data = result.data as { id: string }
        testCustomerIds.push(data.id)
    })

    // ─── U-TAB-02: openTab ────────────────────────────────────
    it('U-TAB-02: openTab — should create tab with limit', async () => {
        if (testCustomerIds.length === 0) return

        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        if (!staff) throw new Error('Need staff')

        const result = await openTab({
            customerId: testCustomerIds[0],
            staffId: staff.id,
            staffName: staff.fullName,
            tabLimit: 2000000,
            notes: 'Test tab',
        })

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        const data = result.data as { id: string; tabLimit: number; status: string; currentTotal: number }
        expect(data.tabLimit).toBe(2000000)
        expect(data.status).toBe('OPEN')
        expect(data.currentTotal).toBe(0)
        testTabIds.push(data.id)
    })

    // ─── U-TAB-03: addTabItem ─────────────────────────────────
    it('U-TAB-03: addTabItem — should add item and increment total', async () => {
        if (testTabIds.length === 0) return
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        const product = await prisma.product.findFirst({ where: { isActive: true } })
        if (!staff || !product) return

        const result = await addTabItem({
            tabId: testTabIds[0],
            productId: product.id,
            productName: product.name,
            quantity: 2,
            unitPrice: 150000,
            staffId: staff.id,
            staffName: staff.fullName,
        })

        expect(result.success).toBe(true)
        const data = result.data as { currentTotal: number; items: unknown[] }
        expect(data.currentTotal).toBe(300000) // 2 × 150k
        expect(data.items.length).toBe(1)
    })

    // ─── U-TAB-04: addMultipleTabItems ────────────────────────
    it('U-TAB-04: addMultipleTabItems — should add multiple items', async () => {
        if (testTabIds.length === 0) return
        const staff = await prisma.staff.findFirst({ where: { isActive: true } })
        const products = await prisma.product.findMany({ where: { isActive: true }, take: 2 })
        if (!staff || products.length < 2) return

        const result = await addMultipleTabItems({
            tabId: testTabIds[0],
            items: [
                { productId: products[0].id, productName: products[0].name, quantity: 1, unitPrice: 200000 },
                { productId: products[1].id, productName: products[1].name, quantity: 1, unitPrice: 100000 },
            ],
            staffId: staff.id,
            staffName: staff.fullName,
        })

        expect(result.success).toBe(true)
        const data = result.data as { currentTotal: number; items: unknown[] }
        expect(data.currentTotal).toBe(600000) // 300k + 200k + 100k
        expect(data.items.length).toBe(3) // 1 from before + 2 new
    })

    // ─── U-TAB-05: getTabById ─────────────────────────────────
    it('U-TAB-05: getTabById — should return tab with items', async () => {
        if (testTabIds.length === 0) return

        const tab = await getTabById(testTabIds[0])
        expect(tab).toBeDefined()
        expect(tab!.id).toBe(testTabIds[0])
        expect(tab!.items.length).toBeGreaterThan(0)
        expect(tab!.customer).toBeDefined()
        expect(tab!.customer.fullName).toBe('Test Tab Customer')
    })

    // ─── U-TAB-06: getOpenTabs ────────────────────────────────
    it('U-TAB-06: getOpenTabs — should return only open tabs', async () => {
        const tabs = await getOpenTabs()
        expect(Array.isArray(tabs)).toBe(true)
        for (const tab of tabs) {
            expect(tab.status).toBe('OPEN')
        }
    })

    // ─── U-TAB-07: removeTabItem ──────────────────────────────
    it('U-TAB-07: removeTabItem — should remove item and decrement total', async () => {
        if (testTabIds.length === 0) return

        const tab = await getTabById(testTabIds[0])
        if (!tab || tab.items.length === 0) return

        const itemToRemove = tab.items[tab.items.length - 1]
        const totalBefore = tab.currentTotal

        const result = await removeTabItem({
            tabId: testTabIds[0],
            itemId: itemToRemove.id,
        })

        expect(result.success).toBe(true)
        const data = result.data as { currentTotal: number }
        expect(data.currentTotal).toBe(totalBefore - itemToRemove.subtotal)
    })

    // ─── U-TAB-08: closeTab ───────────────────────────────────
    it('U-TAB-08: closeTab — should close tab', async () => {
        if (testTabIds.length === 0) return

        const result = await closeTab({
            tabId: testTabIds[0],
            paymentMethod: 'CASH',
        })

        expect(result.success).toBe(true)
        const data = result.data as { status: string; closedAt: Date }
        expect(data.status).toBe('CLOSED')
        expect(data.closedAt).toBeDefined()
    })

    // ─── U-TAB-09: searchCustomers ────────────────────────────
    it('U-TAB-09: searchCustomers — should find by name', async () => {
        const results = await searchCustomers('Test Tab')
        expect(Array.isArray(results)).toBe(true)
        expect(results.length).toBeGreaterThan(0)
        expect(results[0].fullName).toContain('Test Tab')
    })

    // ─── U-TAB-10: searchCustomers — short query ─────────────
    it('U-TAB-10: searchCustomers — should return empty for short query', async () => {
        const results = await searchCustomers('a')
        expect(results).toEqual([])
    })
})
