"use server"

import type { ActionResult, Customer, CustomerTab, TabItem } from "@/types"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ============================================================
// MOCK CUSTOMERS
// ============================================================

const MOCK_CUSTOMERS: Customer[] = [
    {
        id: "cust-1",
        fullName: "Nguyễn Hoàng Anh",
        phone: "0901234567",
        email: "anh@gmail.com",
        tier: "GOLD",
        totalSpent: 45000000,
        visitCount: 32,
        notes: "Thích Cabernet Sauvignon. Dị ứng hải sản.",
        createdAt: new Date("2025-06-15"),
        updatedAt: new Date("2026-03-01"),
    },
    {
        id: "cust-2",
        fullName: "Trần Minh Châu",
        phone: "0912345678",
        email: null,
        tier: "PLATINUM",
        totalSpent: 120000000,
        visitCount: 85,
        notes: "VIP — không giới hạn tab. Ưa chuộng Burgundy.",
        createdAt: new Date("2024-12-01"),
        updatedAt: new Date("2026-03-08"),
    },
    {
        id: "cust-3",
        fullName: "Lê Phương Thảo",
        phone: "0923456789",
        email: "thao.le@company.com",
        tier: "SILVER",
        totalSpent: 18000000,
        visitCount: 14,
        notes: null,
        createdAt: new Date("2025-09-20"),
        updatedAt: new Date("2026-02-15"),
    },
    {
        id: "cust-4",
        fullName: "Phạm Đức Long",
        phone: "0934567890",
        email: null,
        tier: "REGULAR",
        totalSpent: 5200000,
        visitCount: 5,
        notes: "Khách mới. Thử wine flight lần đầu.",
        createdAt: new Date("2026-02-01"),
        updatedAt: new Date("2026-03-05"),
    },
    {
        id: "cust-5",
        fullName: "Vũ Thị Mai Hương",
        phone: "0945678901",
        email: "huong.vu@email.com",
        tier: "GOLD",
        totalSpent: 38000000,
        visitCount: 28,
        notes: "Thích Champagne, đặc biệt Rosé.",
        createdAt: new Date("2025-03-10"),
        updatedAt: new Date("2026-03-09"),
    },
]

// ============================================================
// MOCK TABS (in-memory state)
// ============================================================

const OPEN_TABS: CustomerTab[] = []

// ============================================================
// CUSTOMER ACTIONS
// ============================================================

export async function searchCustomers(query: string): Promise<Customer[]> {
    await delay(150)
    if (!query) return MOCK_CUSTOMERS
    const q = query.toLowerCase()
    return MOCK_CUSTOMERS.filter(
        (c) =>
            c.fullName.toLowerCase().includes(q) ||
            c.phone?.includes(q) ||
            c.email?.toLowerCase().includes(q)
    )
}

export async function getCustomerById(id: string): Promise<Customer | null> {
    await delay(100)
    return MOCK_CUSTOMERS.find((c) => c.id === id) ?? null
}

export async function createQuickCustomer(data: {
    fullName: string
    phone?: string
}): Promise<ActionResult<Customer>> {
    await delay(200)
    const customer: Customer = {
        id: `cust-${Date.now()}`,
        fullName: data.fullName,
        phone: data.phone ?? null,
        email: null,
        tier: "REGULAR",
        totalSpent: 0,
        visitCount: 0,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
    MOCK_CUSTOMERS.push(customer)
    return { success: true, data: customer }
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
}): Promise<ActionResult<CustomerTab>> {
    await delay(200)

    const customer = MOCK_CUSTOMERS.find((c) => c.id === params.customerId)
    if (!customer) {
        return { success: false, error: { code: "NOT_FOUND", message: "Không tìm thấy khách hàng" } }
    }

    // Check if customer already has an open tab
    const existingTab = OPEN_TABS.find(
        (t) => t.customerId === params.customerId && t.status === "OPEN"
    )
    if (existingTab) {
        return { success: false, error: { code: "DUPLICATE", message: "Khách đã có tab đang mở" } }
    }

    // Default limits by tier
    const defaultLimits: Record<string, number> = {
        REGULAR: 2000000,
        SILVER: 5000000,
        GOLD: 10000000,
        PLATINUM: 50000000,
    }

    const tab: CustomerTab = {
        id: `tab-${Date.now()}`,
        customerId: params.customerId,
        customer,
        openedBy: params.staffId,
        openedByName: params.staffName,
        tabLimit: params.tabLimit ?? defaultLimits[customer.tier] ?? 2000000,
        currentTotal: 0,
        status: "OPEN",
        notes: params.notes ?? null,
        items: [],
        openedAt: new Date(),
        closedAt: null,
    }

    OPEN_TABS.push(tab)
    return { success: true, data: tab }
}

export async function getOpenTabs(): Promise<CustomerTab[]> {
    await delay(100)
    return OPEN_TABS.filter((t) => t.status === "OPEN")
}

export async function getTabById(id: string): Promise<CustomerTab | null> {
    await delay(100)
    return OPEN_TABS.find((t) => t.id === id) ?? null
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
}): Promise<ActionResult<CustomerTab>> {
    await delay(150)

    const tab = OPEN_TABS.find((t) => t.id === params.tabId)
    if (!tab) {
        return { success: false, error: { code: "NOT_FOUND", message: "Tab không tồn tại" } }
    }
    if (tab.status !== "OPEN") {
        return { success: false, error: { code: "CLOSED", message: "Tab đã đóng" } }
    }

    const itemSubtotal = params.unitPrice * params.quantity
    const newTotal = tab.currentTotal + itemSubtotal

    // Check limit
    if (newTotal > tab.tabLimit) {
        tab.status = "EXCEEDED"
        return {
            success: false,
            error: {
                code: "LIMIT_EXCEEDED",
                message: `Tab vượt giới hạn! Tổng: ₫${newTotal.toLocaleString("vi-VN")} / Limit: ₫${tab.tabLimit.toLocaleString("vi-VN")}`,
            },
        }
    }

    const item: TabItem = {
        id: `tab-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tabId: params.tabId,
        productId: params.productId,
        productName: params.productName,
        quantity: params.quantity,
        unitPrice: params.unitPrice,
        subtotal: itemSubtotal,
        tableId: params.tableId ?? null,
        tableNumber: params.tableNumber ?? null,
        addedBy: params.staffId,
        addedByName: params.staffName,
        addedAt: new Date(),
    }

    tab.items.push(item)
    tab.currentTotal = newTotal

    // Warn at 80% limit
    return { success: true, data: { ...tab } }
}

export async function addMultipleTabItems(params: {
    tabId: string
    items: Array<{
        productId: string
        productName: string
        quantity: number
        unitPrice: number
    }>
    tableId?: string
    tableNumber?: string
    staffId: string
    staffName: string
}): Promise<ActionResult<CustomerTab>> {
    await delay(200)

    const tab = OPEN_TABS.find((t) => t.id === params.tabId)
    if (!tab) {
        return { success: false, error: { code: "NOT_FOUND", message: "Tab không tồn tại" } }
    }
    if (tab.status !== "OPEN") {
        return { success: false, error: { code: "CLOSED", message: "Tab đã đóng" } }
    }

    const batchTotal = params.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const newTotal = tab.currentTotal + batchTotal

    if (newTotal > tab.tabLimit) {
        return {
            success: false,
            error: {
                code: "LIMIT_EXCEEDED",
                message: `Vượt giới hạn tab! Tổng mới: ₫${newTotal.toLocaleString("vi-VN")}`,
            },
        }
    }

    for (const item of params.items) {
        tab.items.push({
            id: `tab-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            tabId: params.tabId,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
            tableId: params.tableId ?? null,
            tableNumber: params.tableNumber ?? null,
            addedBy: params.staffId,
            addedByName: params.staffName,
            addedAt: new Date(),
        })
    }
    tab.currentTotal = newTotal

    return { success: true, data: { ...tab } }
}

export async function closeTab(params: {
    tabId: string
    paymentMethod: string
}): Promise<ActionResult<CustomerTab>> {
    await delay(300)

    const tab = OPEN_TABS.find((t) => t.id === params.tabId)
    if (!tab) {
        return { success: false, error: { code: "NOT_FOUND", message: "Tab không tồn tại" } }
    }

    tab.status = "CLOSED"
    tab.closedAt = new Date()

    // Update customer spend
    const customer = MOCK_CUSTOMERS.find((c) => c.id === tab.customerId)
    if (customer) {
        customer.totalSpent += tab.currentTotal
        customer.visitCount += 1
    }

    return { success: true, data: { ...tab } }
}

export async function removeTabItem(params: {
    tabId: string
    itemId: string
}): Promise<ActionResult<CustomerTab>> {
    await delay(100)

    const tab = OPEN_TABS.find((t) => t.id === params.tabId)
    if (!tab) {
        return { success: false, error: { code: "NOT_FOUND", message: "Tab không tồn tại" } }
    }

    const itemIdx = tab.items.findIndex((i) => i.id === params.itemId)
    if (itemIdx === -1) {
        return { success: false, error: { code: "NOT_FOUND", message: "Item không tồn tại" } }
    }

    tab.currentTotal -= tab.items[itemIdx].subtotal
    tab.items.splice(itemIdx, 1)

    if (tab.status === "EXCEEDED" && tab.currentTotal <= tab.tabLimit) {
        tab.status = "OPEN"
    }

    return { success: true, data: { ...tab } }
}
