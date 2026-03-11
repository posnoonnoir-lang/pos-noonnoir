"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { OrderStatus, PaymentMethod } from "@prisma/client"

export type { OrderStatus, PaymentMethod } from "@prisma/client"

export type Order = {
    id: string
    orderNumber: string
    tableId: string | null
    tableNumber: string | null
    orderType: string
    status: OrderStatus
    items: Array<{
        id: string
        productId: string
        productName: string
        quantity: number
        unitPrice: number
        subtotal: number
        notes: string | null
        status: string
    }>
    subtotal: number
    discount: number
    tax: number
    total: number
    paymentMethod: string | null
    paidAt: Date | null
    staffId: string | null
    staffName: string
    guestCount: number
    createdAt: Date
    updatedAt: Date
}

// ============================================================
// HELPERS
// ============================================================

async function generateOrderNumber(): Promise<string> {
    const today = new Date()
    const prefix = `ORD-${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`
    const todayCount = await prisma.order.count({
        where: {
            orderNo: { startsWith: prefix },
        },
    })
    return `${prefix}-${String(todayCount + 1).padStart(3, "0")}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { serializeOrder } from "@/lib/order-serializer"

// ============================================================
// ORDERS CRUD
// ============================================================

export async function createOrder(params: {
    tableId: string | null
    tableNumber: string | null
    orderType: "DINE_IN" | "TAKEAWAY"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[]
    staffId: string
    staffName: string
    guestCount?: number
}) {
    try {
        const orderNo = await generateOrderNumber()
        // Normalize items — accept both { productId, price } and { product: { id }, unitPrice }
        const normalizedItems = params.items.map((item: any) => ({
            productId: item.productId ?? item.product?.id,
            name: item.name ?? item.product?.name ?? "",
            quantity: item.quantity,
            price: item.price ?? item.unitPrice,
            notes: item.notes ?? item.note,
        }))
        const subtotal = normalizedItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0)

        const order = await prisma.order.create({
            data: {
                orderNo,
                tableId: params.tableId,
                orderType: params.orderType,
                createdBy: params.staffId,
                subtotal,
                totalAmount: subtotal,
                status: "OPEN",
                items: {
                    create: normalizedItems.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        subtotal: item.price * item.quantity,
                        notes: item.notes,
                    })),
                },
            },
            include: {
                items: { include: { product: true } },
                table: true,
                staff: true,
            },
        })

        if (params.tableId) {
            await prisma.floorTable.update({
                where: { id: params.tableId },
                data: { status: "OCCUPIED" },
            })
        }

        revalidatePath("/pos")
        revalidatePath("/dashboard/tables")
        return { success: true, order: serializeOrder(order) }
    } catch (e) {
        console.error("createOrder error:", e)
        const msg = e instanceof Error ? e.message : String(e)
        return { success: false, error: `Không thể tạo đơn hàng: ${msg}` }
    }
}

export async function getOrders(params?: { status?: OrderStatus; limit?: number }) {
    const orders = await prisma.order.findMany({
        where: params?.status ? { status: params.status } : {},
        include: {
            items: { include: { product: true } },
            table: true,
            staff: true,
            payments: true,
        },
        orderBy: { createdAt: "desc" },
        take: params?.limit ?? 50,
    })
    return orders.map(serializeOrder)
}

export async function getOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: { include: { product: true } },
            table: true,
            staff: true,
            payments: true,
        },
    })
    return serializeOrder(order)
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                ...(status === "PAID" ? { closedAt: new Date() } : {}),
            },
        })
        revalidatePath("/pos")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function payOrder(orderId: string, method: PaymentMethod) {
    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } })
        if (!order) return { success: false }

        await prisma.$transaction([
            prisma.payment.create({
                data: {
                    orderId,
                    method,
                    amount: order.totalAmount,
                    receivedAmount: order.totalAmount,
                },
            }),
            prisma.order.update({
                where: { id: orderId },
                data: {
                    status: "PAID",
                    paymentStatus: "PAID",
                    closedAt: new Date(),
                },
            }),
            ...(order.tableId
                ? [prisma.floorTable.update({ where: { id: order.tableId }, data: { status: "CLEANING" } })]
                : []),
        ])

        revalidatePath("/pos")
        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function getActiveOrderByTable(tableId: string) {
    const order = await prisma.order.findFirst({
        where: {
            tableId,
            status: { in: ["OPEN", "PREPARING", "SERVED"] },
        },
        include: {
            items: { include: { product: true } },
            table: true,
            staff: true,
            payments: true,
        },
        orderBy: { createdAt: "desc" },
    })
    return order ? serializeOrder(order) : null
}

export async function addItemsToOrder(
    orderId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rawItems: any[]
) {
    try {
        const newItems = rawItems.map((item: any) => ({
            productId: item.productId ?? item.product?.id,
            quantity: item.quantity,
            price: item.price ?? item.unitPrice,
            notes: item.notes ?? item.note,
        }))
        const addedSubtotal = newItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0)

        await prisma.$transaction([
            ...newItems.map((item: any) =>
                prisma.orderItem.create({
                    data: {
                        orderId,
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        subtotal: item.price * item.quantity,
                        notes: item.notes,
                    },
                })
            ),
            prisma.order.update({
                where: { id: orderId },
                data: {
                    subtotal: { increment: addedSubtotal },
                    totalAmount: { increment: addedSubtotal },
                },
            }),
        ])

        const updated = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { include: { product: true } },
                table: true,
                staff: true,
                payments: true,
            },
        })

        revalidatePath("/pos")
        return { success: true, order: serializeOrder(updated) }
    } catch {
        return { success: false, error: "Không thể thêm món" }
    }
}

export async function getActiveOrders() {
    const orders = await prisma.order.findMany({
        where: { status: { in: ["OPEN", "PREPARING", "SERVED"] } },
        include: {
            items: { include: { product: true } },
            table: true,
            staff: true,
        },
        orderBy: { createdAt: "desc" },
    })
    return orders.map(serializeOrder)
}

export async function getTodayStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const orders = await prisma.order.findMany({
        where: { createdAt: { gte: today } },
        include: { payments: true },
    })

    const paidOrders = orders.filter((o) => o.status === "PAID")

    return {
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        totalRevenue: paidOrders.reduce((s, o) => s + Number(o.totalAmount), 0),
        avgOrderValue:
            paidOrders.length > 0
                ? Math.round(paidOrders.reduce((s, o) => s + Number(o.totalAmount), 0) / paidOrders.length)
                : 0,
        cancelled: orders.filter((o) => o.status === "CANCELLED").length,
        activeOrders: orders.filter((o) => ["OPEN", "PREPARING", "SERVED"].includes(o.status)).length,
    }
}

// COGS placeholder — will be implemented when assets module is migrated
export async function processOrderWithCOGS(orderId: string, paymentMethod: PaymentMethod) {
    const result = await payOrder(orderId, paymentMethod)
    return {
        success: result.success,
        orderId,
        deductions: [],
        stockWarnings: [],
        totalIngredientCost: 0,
        errors: [],
    }
}
