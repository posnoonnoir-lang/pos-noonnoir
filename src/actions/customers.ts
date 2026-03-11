"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculateTier, TIER_THRESHOLDS, type CustomerTier } from "@/lib/customer-tiers"

// ============================================================
// CRM & CUSTOMER MANAGEMENT
// ============================================================

export async function getAllCustomers() {
    const customers = await prisma.customer.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
    })
    return customers.map((c) => ({
        ...c,
        totalSpent: Number(c.totalSpent),
        tier: c.tier as CustomerTier,
    }))
}

export async function getCustomerProfile(id: string) {
    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            orders: {
                orderBy: { createdAt: "desc" },
                take: 10,
                include: {
                    items: { include: { product: true } },
                    payments: true,
                },
            },
        },
    })
    if (!customer) return null

    return {
        ...customer,
        totalSpent: Number(customer.totalSpent),
        tier: customer.tier as CustomerTier,
        orderHistory: customer.orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNo,
            date: o.createdAt,
            items: o.items.map((i) => i.product.name),
            total: Number(o.totalAmount),
            paymentMethod: o.payments[0]?.method ?? "CASH",
            staffName: "",
        })),
    }
}

export async function searchCRMCustomers(query: string) {
    if (!query || query.length < 2) return []

    const customers = await prisma.customer.findMany({
        where: {
            isActive: true,
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { phone: { contains: query } },
                { email: { contains: query, mode: "insensitive" } },
            ],
        },
        take: 20,
    })

    return customers.map((c) => ({
        ...c,
        fullName: c.name,
        totalSpent: Number(c.totalSpent),
        tier: c.tier as CustomerTier,
    }))
}

export async function createCustomer(params: {
    fullName: string
    phone: string
    email?: string
    birthday?: string
    notes?: string
    winePreferences?: string[]
}) {
    try {
        const customer = await prisma.customer.create({
            data: {
                name: params.fullName,
                phone: params.phone,
                email: params.email,
                birthday: params.birthday ? new Date(params.birthday) : undefined,
                notes: params.notes,
                tier: "REGULAR",
            },
        })
        revalidatePath("/dashboard/customers")
        return {
            success: true,
            data: { ...customer, totalSpent: Number(customer.totalSpent), fullName: customer.name },
        }
    } catch {
        return { success: false }
    }
}

export async function updateCustomerNotes(id: string, notes: string) {
    try {
        await prisma.customer.update({ where: { id }, data: { notes } })
        revalidatePath("/dashboard/customers")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function getCustomerStats() {
    const customers = await prisma.customer.findMany({ where: { isActive: true } })
    const totalRevenue = customers.reduce((s, c) => s + Number(c.totalSpent), 0)
    const totalVisits = customers.reduce((s, c) => s + c.loyaltyPts, 0)

    const byTier: Record<string, number> = { REGULAR: 0, SILVER: 0, GOLD: 0, PLATINUM: 0, VIP: 0 }
    customers.forEach((c) => { byTier[c.tier] = (byTier[c.tier] || 0) + 1 })

    const topSpenders = customers
        .sort((a, b) => Number(b.totalSpent) - Number(a.totalSpent))
        .slice(0, 5)
        .map((c) => ({ name: c.name, spent: Number(c.totalSpent), tier: c.tier }))

    return {
        totalCustomers: customers.length,
        byTier,
        totalRevenue,
        avgSpendPerVisit: totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0,
        monthlyNew: customers.filter((c) => {
            const now = new Date()
            return c.createdAt.getMonth() === now.getMonth() && c.createdAt.getFullYear() === now.getFullYear()
        }).length,
        topSpenders,
    }
}

export { calculateTier, TIER_THRESHOLDS }
export type { CustomerTier }

export type CustomerProfile = {
    id: string; name: string; fullName?: string; phone: string | null; email: string | null
    tier: CustomerTier; totalSpent: number; loyaltyPts: number; loyaltyPoints?: number
    visitCount?: number; notes: string | null; birthday?: Date | null
    winePreferences?: string[]; allergies?: string[]
    orderHistory?: Array<{ id: string; orderNumber: string; date: Date; items: string[]; total: number; paymentMethod: string; staffName: string }>
    createdAt: Date; updatedAt: Date
}

export type CustomerStats = {
    totalCustomers: number
    byTier: Record<string, number>
    totalRevenue: number
    avgSpendPerVisit: number
    monthlyNew: number
    topSpenders: Array<{ name: string; spent: number; tier: string }>
}
