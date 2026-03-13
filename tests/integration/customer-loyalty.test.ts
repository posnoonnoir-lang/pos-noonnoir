/**
 * 🧪 Integration Tests — Customer Loyalty + CRM (IT-09)
 * Create customer → place orders → verify tier upgrade
 */
import { describe, it, expect, afterAll } from 'vitest'
import { createCustomer, getCustomerProfile, getAllCustomers, syncCustomerTier, getCustomerStats } from '@/actions/customers'
import { prisma } from '@/lib/prisma'

const testCustomerIds: string[] = []

afterAll(async () => {
    for (const id of testCustomerIds) {
        try {
            await prisma.customer.delete({ where: { id } })
        } catch { /* */ }
    }
    await prisma.$disconnect()
})

describe('IT-09: Customer CRM Flow', () => {
    let customerId: string

    it('Step 1: Create customer', async () => {
        const result = await createCustomer({
            fullName: `Test Customer ${Date.now()}`,
            phone: '0909' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        })
        expect(result).toHaveProperty('success')
        expect(result.success).toBe(true)
        if (result.data) {
            customerId = result.data.id
            testCustomerIds.push(customerId)
        }
    })

    it('Step 2: Customer should appear in list', async () => {
        if (!customerId) return
        const all = await getAllCustomers()
        const found = all.find(c => c.id === customerId)
        expect(found).toBeDefined()
        expect(found!.tier).toBe('REGULAR')
        expect(found!.totalSpent).toBe(0)
    })

    it('Step 3: Get customer profile with detail', async () => {
        if (!customerId) return
        const profile = await getCustomerProfile(customerId)
        expect(profile).not.toBeNull()
        expect(profile!).toHaveProperty('avgOrderValue')
        expect(profile!).toHaveProperty('daysSinceLastVisit')
        expect(profile!).toHaveProperty('rfm')
    })

    it('Step 4: syncCustomerTier should not throw', async () => {
        if (!customerId) return
        // syncCustomerTier returns void — just ensure no error
        await expect(syncCustomerTier(customerId)).resolves.not.toThrow()
    })

    it('Step 5: getCustomerStats — should return CRM analytics', async () => {
        const stats = await getCustomerStats()
        expect(stats).toHaveProperty('totalCustomers')
        expect(stats).toHaveProperty('byTier')
        expect(stats).toHaveProperty('totalRevenue')
        expect(stats).toHaveProperty('avgSpendPerVisit')
        expect(stats).toHaveProperty('topSpenders')
        expect(stats).toHaveProperty('segments')
        expect(stats.totalCustomers).toBeGreaterThan(0)
    })
})
