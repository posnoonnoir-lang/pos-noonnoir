"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types"
import { serializeTab } from "@/lib/tab-serializer"

// ============================================================
// CUSTOMER SEARCH (for Tab)
// ============================================================

export async function searchCustomers(query: string) {
    if (!query || query.length < 2) return []
    const customers = await prisma.customer.findMany({
        where: {
            isActive: true,
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { phone: { contains: query } },
            ],
        },
        take: 10,
    })
    return customers.map((c) => ({
        id: c.id,
        fullName: c.name,
        phone: c.phone,
        email: c.email,
        tier: c.tier,
        totalSpent: Number(c.totalSpent),
        visitCount: c.loyaltyPts,
        notes: c.notes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
    }))
}

export async function getCustomerById(id: string) {
    const c = await prisma.customer.findUnique({ where: { id } })
    if (!c) return null
    return { id: c.id, fullName: c.name, phone: c.phone, email: c.email, tier: c.tier, totalSpent: Number(c.totalSpent), visitCount: c.loyaltyPts, notes: c.notes, createdAt: c.createdAt, updatedAt: c.updatedAt }
}

export async function createQuickCustomer(data: { fullName: string; phone?: string }) {
    try {
        const customer = await prisma.customer.create({
            data: { name: data.fullName, phone: data.phone, tier: "REGULAR" },
        })
        return { success: true, data: { id: customer.id, fullName: customer.name, phone: customer.phone, email: customer.email, tier: customer.tier, totalSpent: 0, visitCount: 0, notes: null, createdAt: customer.createdAt, updatedAt: customer.updatedAt } } as ActionResult
    } catch {
        return { success: false, error: { code: "ERR_CREATE", message: "Không thể tạo khách hàng" } }
    }
}

// ============================================================
// TAB ACTIONS
// ============================================================

export async function openTab(params: {
    customerId: string
    staffId: string
    staffName: string
    tabLimit?: number
    notes?: string
}) {
    try {
        const tab = await prisma.customerTab.create({
            data: {
                customerId: params.customerId,
                openedBy: params.staffId,
                tabLimit: params.tabLimit ?? 2000000,
                notes: params.notes,
            },
            include: {
                customer: true,
                items: { include: { product: true, table: true, staff: true } },
            },
        })
        revalidatePath("/pos")
        return { success: true, data: serializeTab(tab) }
    } catch {
        return { success: false, error: { code: "ERR_CREATE", message: "Không thể mở tab" } }
    }
}

export async function getOpenTabs() {
    const tabs = await prisma.customerTab.findMany({
        where: { status: "OPEN" },
        include: {
            customer: true,
            items: { include: { product: true, table: true, staff: true } },
            openedByStaff: true,
        },
        orderBy: { openedAt: "desc" },
    })
    return tabs.map(serializeTab)
}

export async function getTabById(id: string) {
    const tab = await prisma.customerTab.findUnique({
        where: { id },
        include: {
            customer: true,
            items: { include: { product: true, table: true, staff: true } },
            openedByStaff: true,
        },
    })
    return tab ? serializeTab(tab) : null
}

export async function addTabItem(params: {
    tabId: string
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    tableId?: string
    tableNumber?: string
    staffId: string
    staffName: string
}) {
    try {
        const subtotal = params.quantity * params.unitPrice

        await prisma.$transaction([
            prisma.tabItem.create({
                data: {
                    tabId: params.tabId,
                    productId: params.productId,
                    quantity: params.quantity,
                    unitPrice: params.unitPrice,
                    subtotal,
                    tableId: params.tableId,
                    addedBy: params.staffId,
                },
            }),
            prisma.customerTab.update({
                where: { id: params.tabId },
                data: { currentTotal: { increment: subtotal } },
            }),
        ])

        const tab = await getTabById(params.tabId)
        revalidatePath("/pos")
        return { success: true, data: tab }
    } catch {
        return { success: false, error: { code: "ERR_ADD", message: "Không thể thêm món" } }
    }
}

export async function addMultipleTabItems(params: {
    tabId: string
    items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>
    tableId?: string
    tableNumber?: string
    staffId: string
    staffName: string
}) {
    try {
        const totalAdded = params.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

        await prisma.$transaction([
            ...params.items.map((item) =>
                prisma.tabItem.create({
                    data: {
                        tabId: params.tabId,
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        subtotal: item.quantity * item.unitPrice,
                        tableId: params.tableId,
                        addedBy: params.staffId,
                    },
                })
            ),
            prisma.customerTab.update({
                where: { id: params.tabId },
                data: { currentTotal: { increment: totalAdded } },
            }),
        ])

        const tab = await getTabById(params.tabId)
        revalidatePath("/pos")
        return { success: true, data: tab }
    } catch {
        return { success: false, error: { code: "ERR_ADD", message: "Không thể thêm món" } }
    }
}

export async function closeTab(params: { tabId: string; paymentMethod: string }) {
    try {
        await prisma.customerTab.update({
            where: { id: params.tabId },
            data: { status: "CLOSED", closedAt: new Date() },
        })
        const tab = await getTabById(params.tabId)
        revalidatePath("/pos")
        return { success: true, data: tab }
    } catch {
        return { success: false, error: { code: "ERR_CLOSE", message: "Không thể đóng tab" } }
    }
}

export async function removeTabItem(params: { tabId: string; itemId: string }) {
    try {
        const item = await prisma.tabItem.findUnique({ where: { id: params.itemId } })
        if (!item) return { success: false, error: { code: "ERR_NOT_FOUND", message: "Không tìm thấy" } }

        await prisma.$transaction([
            prisma.tabItem.delete({ where: { id: params.itemId } }),
            prisma.customerTab.update({
                where: { id: params.tabId },
                data: { currentTotal: { decrement: Number(item.subtotal) } },
            }),
        ])

        const tab = await getTabById(params.tabId)
        revalidatePath("/pos")
        return { success: true, data: tab }
    } catch {
        return { success: false, error: { code: "ERR_REMOVE", message: "Không thể xóa" } }
    }
}


