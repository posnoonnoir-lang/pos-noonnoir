/**
 * 🧪 Unit Tests — Customers CRM (P2)
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
    getAllCustomers,
    getCustomerProfile,
    searchCRMCustomers,
    createCustomer,
    updateCustomerNotes,
    getCustomerStats,
} from '@/actions/customers'
import { prisma } from '@/lib/prisma'

const createdCustomerIds: string[] = []

describe('Customers — CRM (Real DB)', () => {
    afterAll(async () => {
        for (const id of createdCustomerIds) {
            try { await prisma.customer.delete({ where: { id } }) } catch { /* */ }
        }
        await prisma.$disconnect()
    })

    it('U-CUS-01: createCustomer — should create customer with tier', async () => {
        const result = await createCustomer({
            fullName: 'Test CRM Customer',
            phone: '0987654321',
            email: 'test@crm.com',
        })
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        createdCustomerIds.push(result.data!.id)
    })

    it('U-CUS-02: getAllCustomers — should return customer list', async () => {
        const customers = await getAllCustomers()
        expect(Array.isArray(customers)).toBe(true)
        expect(customers.length).toBeGreaterThan(0)
        expect(customers[0]).toHaveProperty('name')
        expect(customers[0]).toHaveProperty('tier')
        expect(customers[0]).toHaveProperty('totalSpent')
    })

    it('U-CUS-03: getCustomerProfile — should return profile with order history', async () => {
        if (createdCustomerIds.length === 0) return
        const profile = await getCustomerProfile(createdCustomerIds[0])
        expect(profile).toBeDefined()
        expect(profile!.name).toBe('Test CRM Customer')
        expect(profile!).toHaveProperty('orderHistory')
        expect(profile!).toHaveProperty('tier')
    })

    it('U-CUS-04: searchCRMCustomers — should find by name', async () => {
        const results = await searchCRMCustomers('Test CRM')
        expect(Array.isArray(results)).toBe(true)
        expect(results.length).toBeGreaterThan(0)
    })

    it('U-CUS-05: searchCRMCustomers — short query returns empty', async () => {
        const results = await searchCRMCustomers('a')
        expect(results).toEqual([])
    })

    it('U-CUS-06: updateCustomerNotes — should update notes', async () => {
        if (createdCustomerIds.length === 0) return
        const result = await updateCustomerNotes(createdCustomerIds[0], 'Thích Cabernet Sauvignon')
        expect(result.success).toBe(true)

        const customer = await prisma.customer.findUnique({ where: { id: createdCustomerIds[0] } })
        expect(customer?.notes).toBe('Thích Cabernet Sauvignon')
    })

    it('U-CUS-07: getCustomerStats — should return aggregated stats', async () => {
        const stats = await getCustomerStats()
        expect(stats).toHaveProperty('totalCustomers')
        expect(stats).toHaveProperty('byTier')
        expect(stats).toHaveProperty('totalRevenue')
        expect(stats).toHaveProperty('topSpenders')
        expect(stats.totalCustomers).toBeGreaterThan(0)
    })
})
