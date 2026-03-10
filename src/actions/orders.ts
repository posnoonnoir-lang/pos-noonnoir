"use server"

import type { OrderItem } from "@/stores/cart-store"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED"
export type PaymentMethod = "CASH" | "CARD" | "QR" | "MIXED"

export type Order = {
    id: string
    orderNumber: string
    tableId: string | null
    tableNumber: string | null
    orderType: "DINE_IN" | "TAKEAWAY"
    status: OrderStatus
    items: {
        id: string
        productId: string
        productName: string
        quantity: number
        unitPrice: number
        note?: string
    }[]
    subtotal: number
    discount: number
    tax: number
    total: number
    paymentMethod: PaymentMethod | null
    paidAt: Date | null
    staffId: string
    staffName: string
    guestCount?: number
    createdAt: Date
    updatedAt: Date
}

// In-memory store for demo — pre-seeded with active orders for occupied tables
const now = new Date()
const ORDERS: Order[] = [
    {
        id: "order-seed-1",
        orderNumber: "ORD-0310-001",
        tableId: "t-02",
        tableNumber: "T02",
        orderType: "DINE_IN",
        status: "SERVED",
        items: [
            { id: "oi-s1-1", productId: "p-1", productName: "Château Margaux 2018", quantity: 1, unitPrice: 5_900_000 },
            { id: "oi-s1-2", productId: "p-12", productName: "Cheese Board", quantity: 1, unitPrice: 250_000 },
            { id: "oi-s1-3", productId: "p-9", productName: "Negroni", quantity: 2, unitPrice: 150_000 },
        ],
        subtotal: 6_450_000,
        discount: 0,
        tax: 0,
        total: 6_450_000,
        paymentMethod: null,
        paidAt: null,
        staffId: "staff-3",
        staffName: "Minh Le",
        guestCount: 3,
        createdAt: new Date(now.getTime() - 45 * 60000),
        updatedAt: new Date(now.getTime() - 10 * 60000),
    },
    {
        id: "order-seed-2",
        orderNumber: "ORD-0310-002",
        tableId: "t-04",
        tableNumber: "T04",
        orderType: "DINE_IN",
        status: "PREPARING",
        items: [
            { id: "oi-s2-1", productId: "p-2", productName: "Opus One 2019", quantity: 1, unitPrice: 9_800_000 },
            { id: "oi-s2-2", productId: "p-8", productName: "Aperol Spritz", quantity: 3, unitPrice: 120_000 },
            { id: "oi-s2-3", productId: "p-14", productName: "Truffle Fries", quantity: 1, unitPrice: 150_000 },
            { id: "oi-s2-4", productId: "p-11", productName: "Bruschetta", quantity: 2, unitPrice: 120_000, note: "Thêm phô mai" },
        ],
        subtotal: 10_550_000,
        discount: 0,
        tax: 0,
        total: 10_550_000,
        paymentMethod: null,
        paidAt: null,
        staffId: "staff-2",
        staffName: "Linh Tran",
        guestCount: 5,
        createdAt: new Date(now.getTime() - 72 * 60000),
        updatedAt: new Date(now.getTime() - 5 * 60000),
    },
    {
        id: "order-seed-3",
        orderNumber: "ORD-0310-003",
        tableId: "t-08",
        tableNumber: "T08",
        orderType: "DINE_IN",
        status: "SERVED",
        items: [
            { id: "oi-s3-1", productId: "p-7", productName: "Chardonnay Glass", quantity: 2, unitPrice: 85_000 },
            { id: "oi-s3-2", productId: "p-10", productName: "Gin & Tonic", quantity: 1, unitPrice: 110_000 },
            { id: "oi-s3-3", productId: "p-14", productName: "Truffle Fries", quantity: 1, unitPrice: 150_000 },
        ],
        subtotal: 430_000,
        discount: 0,
        tax: 0,
        total: 430_000,
        paymentMethod: null,
        paidAt: null,
        staffId: "staff-4",
        staffName: "Hoa Pham",
        guestCount: 2,
        createdAt: new Date(now.getTime() - 20 * 60000),
        updatedAt: new Date(now.getTime() - 8 * 60000),
    },
    {
        id: "order-seed-4",
        orderNumber: "ORD-0310-004",
        tableId: "t-10",
        tableNumber: "B01",
        orderType: "DINE_IN",
        status: "SERVED",
        items: [
            { id: "oi-s4-1", productId: "p-9", productName: "Negroni", quantity: 1, unitPrice: 150_000 },
            { id: "oi-s4-2", productId: "p-13", productName: "Cold Cut Board", quantity: 1, unitPrice: 320_000, note: "Không hành" },
        ],
        subtotal: 470_000,
        discount: 0,
        tax: 0,
        total: 470_000,
        paymentMethod: null,
        paidAt: null,
        staffId: "staff-3",
        staffName: "Minh Le",
        guestCount: 1,
        createdAt: new Date(now.getTime() - 15 * 60000),
        updatedAt: new Date(now.getTime() - 3 * 60000),
    },
]
let orderCounter = 5

function generateOrderNumber(): string {
    const date = new Date()
    const prefix = `ORD-${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
    return `${prefix}-${String(orderCounter++).padStart(3, "0")}`
}

export async function createOrder(params: {
    tableId: string | null
    tableNumber: string | null
    orderType: "DINE_IN" | "TAKEAWAY"
    items: OrderItem[]
    staffId: string
    staffName: string
    guestCount?: number
}): Promise<{ success: boolean; order?: Order; error?: string }> {
    await delay(300)

    if (params.items.length === 0) {
        return { success: false, error: "Giỏ hàng trống" }
    }

    // Import tax calculation
    const { calculateItemTax, getTaxConfig } = await import("./tax")
    const taxConfig = await getTaxConfig()

    const subtotal = params.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
    )

    // Calculate tax for each item
    let totalTax = 0
    if (taxConfig.enabled) {
        for (const item of params.items) {
            const itemSubtotal = item.unitPrice * item.quantity
            const taxResult = await calculateItemTax(itemSubtotal, item.product.taxRateId)
            totalTax += taxResult.taxAmount
        }
    }

    const total = taxConfig.enabled && !taxConfig.inclusive
        ? subtotal + totalTax
        : subtotal

    const order: Order = {
        id: `order-${Date.now()}`,
        orderNumber: generateOrderNumber(),
        tableId: params.tableId,
        tableNumber: params.tableNumber,
        orderType: params.orderType,
        status: "PENDING",
        items: params.items.map((item) => ({
            id: item.id,
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            note: item.note,
        })),
        subtotal,
        discount: 0,
        tax: totalTax,
        total,
        paymentMethod: null,
        paidAt: null,
        staffId: params.staffId,
        staffName: params.staffName,
        guestCount: params.guestCount,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    ORDERS.unshift(order)
    return { success: true, order }
}

export async function getOrders(params?: {
    status?: OrderStatus
    limit?: number
}): Promise<Order[]> {
    await delay(150)
    let orders = [...ORDERS]
    if (params?.status) {
        orders = orders.filter((o) => o.status === params.status)
    }
    if (params?.limit) {
        orders = orders.slice(0, params.limit)
    }
    return orders
}

export async function getOrderById(orderId: string): Promise<Order | null> {
    await delay(100)
    return ORDERS.find((o) => o.id === orderId) ?? null
}

export async function updateOrderStatus(
    orderId: string,
    status: OrderStatus
): Promise<{ success: boolean }> {
    await delay(200)
    const order = ORDERS.find((o) => o.id === orderId)
    if (!order) return { success: false }
    order.status = status
    order.updatedAt = new Date()
    return { success: true }
}

export async function payOrder(
    orderId: string,
    method: PaymentMethod
): Promise<{ success: boolean }> {
    await delay(300)
    const order = ORDERS.find((o) => o.id === orderId)
    if (!order) return { success: false }
    order.paymentMethod = method
    order.paidAt = new Date()
    order.status = "COMPLETED"
    order.updatedAt = new Date()
    return { success: true }
}

export async function getActiveOrderByTable(tableId: string): Promise<Order | null> {
    return ORDERS.find(
        (o) => o.tableId === tableId && !["COMPLETED", "CANCELLED"].includes(o.status)
    ) ?? null
}

export async function addItemsToOrder(
    orderId: string,
    newItems: OrderItem[]
): Promise<{ success: boolean; order?: Order; error?: string }> {
    await delay(200)
    const order = ORDERS.find((o) => o.id === orderId)
    if (!order) return { success: false, error: "Không tìm thấy đơn hàng" }
    if (["COMPLETED", "CANCELLED"].includes(order.status)) return { success: false, error: "Đơn hàng đã đóng" }

    // Import tax calculation
    const { calculateItemTax, getTaxConfig } = await import("./tax")
    const taxConfig = await getTaxConfig()

    for (const newItem of newItems) {
        const existing = order.items.find((i) => i.productId === newItem.product.id)
        if (existing) {
            existing.quantity += newItem.quantity
        } else {
            order.items.push({
                id: newItem.id,
                productId: newItem.product.id,
                productName: newItem.product.name,
                quantity: newItem.quantity,
                unitPrice: newItem.unitPrice,
                note: newItem.note,
            })
        }
    }

    // Recalculate totals
    order.subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    let totalTax = 0
    if (taxConfig.enabled) {
        for (const item of order.items) {
            const itemSubtotal = item.unitPrice * item.quantity
            const taxResult = await calculateItemTax(itemSubtotal)
            totalTax += taxResult.taxAmount
        }
    }
    order.tax = totalTax
    order.total = taxConfig.enabled && !taxConfig.inclusive ? order.subtotal + totalTax : order.subtotal
    order.updatedAt = new Date()

    return { success: true, order }
}

export async function getActiveOrders(): Promise<Order[]> {
    await delay(100)
    return ORDERS.filter(
        (o) => !["COMPLETED", "CANCELLED"].includes(o.status)
    )
}

export async function getTodayStats() {
    await delay(100)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayOrders = ORDERS.filter(
        (o) => o.createdAt >= today
    )
    const completed = todayOrders.filter((o) => o.status === "COMPLETED")

    return {
        totalOrders: todayOrders.length,
        completedOrders: completed.length,
        totalRevenue: completed.reduce((sum, o) => sum + o.total, 0),
        averageOrderValue: completed.length > 0
            ? Math.round(completed.reduce((sum, o) => sum + o.total, 0) / completed.length)
            : 0,
    }
}

// --- Auto NPL Deduction + COGS on Payment ---
import { deductRecipeIngredients, type DeductionResult } from "./assets"

export type StockWarning = {
    materialName: string
    level: "LOW" | "OUT"
    remaining: number
    unit: string
}

export type OrderCOGSResult = {
    success: boolean
    orderId: string
    deductions: {
        productName: string
        qty: number
        ingredientCost: number
        sellingPrice: number
        grossProfit: number
        marginPct: number
    }[]
    stockWarnings: StockWarning[]
    totalIngredientCost: number
    errors: string[]
}

export async function processOrderWithCOGS(
    orderId: string,
    paymentMethod: PaymentMethod
): Promise<OrderCOGSResult> {
    await delay(100)

    const order = ORDERS.find((o) => o.id === orderId)
    if (!order) return { success: false, orderId, deductions: [], stockWarnings: [], totalIngredientCost: 0, errors: ["Order not found"] }

    // Pay the order
    order.paymentMethod = paymentMethod
    order.paidAt = new Date()
    order.status = "COMPLETED"
    order.updatedAt = new Date()

    const deductions: OrderCOGSResult["deductions"] = []
    const stockWarnings: StockWarning[] = []
    const errors: string[] = []
    let totalIngredientCost = 0

    // Process each item — try deducting recipe ingredients
    for (const item of order.items) {
        const result: DeductionResult = await deductRecipeIngredients(item.productId, item.quantity)

        if (result.success) {
            totalIngredientCost += result.totalIngredientCost
            const grossProfit = (item.unitPrice * item.quantity) - result.totalIngredientCost
            const marginPct = (item.unitPrice * item.quantity) > 0
                ? Math.round((grossProfit / (item.unitPrice * item.quantity)) * 1000) / 10
                : 0

            deductions.push({
                productName: item.productName,
                qty: item.quantity,
                ingredientCost: result.totalIngredientCost,
                sellingPrice: item.unitPrice * item.quantity,
                grossProfit,
                marginPct,
            })

            // Collect stock warnings
            for (const d of result.deductions) {
                if (d.warning) {
                    stockWarnings.push({
                        materialName: d.materialName,
                        level: d.remainingStock === 0 ? "OUT" : "LOW",
                        remaining: d.remainingStock,
                        unit: d.unit,
                    })
                }
            }
        } else if (result.errors.length > 0 && !result.errors[0]?.includes("Không tìm thấy công thức")) {
            // Only log errors that aren't "no recipe found" (wine bottles, etc. don't have recipes)
            errors.push(...result.errors)
        }
        // Products without recipes (wine bottles, spirits) — COGS comes from FIFO batches directly, handled separately
    }

    return {
        success: true,
        orderId,
        deductions,
        stockWarnings,
        totalIngredientCost,
        errors,
    }
}
