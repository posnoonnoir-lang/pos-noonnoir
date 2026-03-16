"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { TransactionType } from "@prisma/client"
import { withRbac } from "@/lib/with-rbac"

// ============================================================
// FINANCE — Fund Transactions + Debt Records + REAL COGS
// ============================================================

export async function getFundTransactions(params?: { startDate?: Date; endDate?: Date; type?: TransactionType }) {
    const guard = await withRbac("finance", "view")
    if (!guard.ok) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const txns = await prisma.fundTransaction.findMany({
        where: {
            ...(params?.type ? { transactionType: params.type } : {}),
            date: {
                gte: params?.startDate ?? today,
                ...(params?.endDate ? { lte: params.endDate } : {}),
            },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    })

    return txns.map((t) => ({
        id: t.id,
        type: t.transactionType,
        category: t.category,
        amount: Number(t.amount),
        description: t.description,
        orderId: t.orderId,
        date: t.date,
        createdAt: t.createdAt,
    }))
}

export async function createFundTransaction(data: {
    type: TransactionType
    category: string
    amount: number
    description?: string
    orderId?: string
}) {
    try {
        const guard = await withRbac("finance", "edit")
        if (!guard.ok) return { success: false, error: guard.error }
        const txn = await prisma.fundTransaction.create({
            data: {
                transactionType: data.type,
                category: data.category,
                amount: data.amount,
                description: data.description,
                orderId: data.orderId,
            },
        })
        revalidatePath("/dashboard/finance")
        return { success: true, data: txn }
    } catch {
        return { success: false }
    }
}

export async function getDebtRecords() {
    const debts = await prisma.debtRecord.findMany({
        include: { supplier: true, customer: true },
        orderBy: { createdAt: "desc" },
    })
    return debts.map((d) => ({
        id: d.id,
        type: d.debtType,
        entityName: d.supplier?.name ?? d.customer?.name ?? "Unknown",
        entityId: d.supplierId ?? d.customerId,
        amount: Number(d.amount),
        paidAmount: Number(d.paidAmount),
        remaining: Number(d.amount) - Number(d.paidAmount),
        dueDate: d.dueDate,
        status: d.status,
        createdAt: d.createdAt,
    }))
}

export async function createDebtRecord(data: {
    type: "PAYABLE" | "RECEIVABLE"
    supplierId?: string
    customerId?: string
    amount: number
    dueDate?: Date
}) {
    try {
        const guard = await withRbac("finance", "edit")
        if (!guard.ok) return { success: false, error: guard.error }
        const debt = await prisma.debtRecord.create({
            data: {
                debtType: data.type,
                supplierId: data.supplierId,
                customerId: data.customerId,
                amount: data.amount,
                dueDate: data.dueDate,
            },
        })
        revalidatePath("/dashboard/finance")
        return { success: true, data: debt }
    } catch {
        return { success: false }
    }
}

export async function payDebt(debtId: string, amount: number) {
    try {
        const guard = await withRbac("finance", "edit")
        if (!guard.ok) return { success: false, error: guard.error }

        const debt = await prisma.debtRecord.findUnique({ where: { id: debtId } })
        if (!debt) return { success: false }

        const newPaid = Number(debt.paidAmount) + amount
        const remaining = Number(debt.amount) - newPaid

        await prisma.debtRecord.update({
            where: { id: debtId },
            data: {
                paidAmount: newPaid,
                status: remaining <= 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "OUTSTANDING",
            },
        })
        revalidatePath("/dashboard/finance")
        return { success: true }
    } catch {
        return { success: false }
    }
}

export async function getFinanceStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [revenue, expenses, debts] = await Promise.all([
        prisma.fundTransaction.aggregate({
            where: { transactionType: "REVENUE", date: { gte: today } },
            _sum: { amount: true },
        }),
        prisma.fundTransaction.aggregate({
            where: { transactionType: "EXPENSE", date: { gte: today } },
            _sum: { amount: true },
        }),
        prisma.debtRecord.findMany({
            where: { status: { in: ["OUTSTANDING", "PARTIAL"] } },
        }),
    ])

    return {
        todayRevenue: Number(revenue._sum.amount ?? 0),
        todayExpenses: Number(expenses._sum.amount ?? 0),
        todayProfit: Number(revenue._sum.amount ?? 0) - Number(expenses._sum.amount ?? 0),
        totalPayable: debts.filter((d) => d.debtType === "PAYABLE").reduce((s, d) => s + Number(d.amount) - Number(d.paidAmount), 0),
        totalReceivable: debts.filter((d) => d.debtType === "RECEIVABLE").reduce((s, d) => s + Number(d.amount) - Number(d.paidAmount), 0),
    }
}

// Journal entries, trial balance, ledger — kept as stubs
export async function getJournalEntries() { return [] }
export async function getTrialBalance() { return { accounts: [], totalDebit: 0, totalCredit: 0, isBalanced: true } }
export async function getAccountLedger() { return { account: null, entries: [], openingBalance: 0, closingBalance: 0 } }

// ============================================================
// TYPES
// ============================================================

export type COGSRecord = {
    id: string; orderId: string; orderNo: string; date: Date
    productName?: string; batchesUsed?: number; soldDate?: Date; soldQty?: number
    sellingPrice?: number; fifoCost?: number; grossMargin?: number
    items: Array<{ productName: string; qty: number; ingredientCost: number; sellingPrice: number }>
    totalCOGS: number; totalRevenue: number; grossProfit: number; marginPct: number
}

export type FinanceSummary = {
    todayRevenue: number; todayExpenses: number; todayCOGS: number; todayProfit: number
    totalRevenue: number; totalCOGS: number; grossProfit: number; grossMargin: number
    operatingExpenses: number; depreciationExpense: number; netProfit: number; netMargin: number
    monthRevenue: number; monthExpenses: number; monthCOGS: number; monthProfit: number
    totalPayable: number; totalReceivable: number
}

export type ExpenseCategory = {
    category: string; amount: number; percentage: number; color: string
}

/**
 * Get COGS records from PAID orders.
 * Calculates cost for EVERY item:
 *   1. Recipe-based (food/drink with ingredients) → sum ingredient costs
 *   2. Wine bottles → WineBottle.costPrice (prorated for glass pours)
 *   3. Fallback → Product.costPrice
 */
export async function getCOGSRecords(): Promise<COGSRecord[]> {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const paidOrders = await prisma.order.findMany({
        where: {
            status: "PAID",
            closedAt: { gte: monthStart },
        },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            recipes: { include: { ingredient: true } },
                        },
                    },
                    wineBottle: true,
                },
            },
        },
        orderBy: { closedAt: "desc" },
        take: 200,
    })

    const records: COGSRecord[] = []

    for (const order of paidOrders) {
        let orderCOGS = 0
        let orderRevenue = 0
        const items: COGSRecord["items"] = []

        for (const item of order.items) {
            const product = item.product
            const sellingPrice = Number(item.unitPrice) * item.quantity
            orderRevenue += sellingPrice

            let itemCOGS = 0

            // CASE 1: Recipe-based (food, cocktails, etc.)
            if (product.recipes.length > 0) {
                for (const recipe of product.recipes) {
                    const mat = recipe.ingredient
                    const qtyNeeded = Number(recipe.quantity) * item.quantity
                    const baseQty = Number(mat.baseQuantity)
                    const costPerDisplayUnit = Number(mat.costPerUnit)
                    const costPerBase = baseQty > 0 ? costPerDisplayUnit / baseQty : costPerDisplayUnit
                    itemCOGS += qtyNeeded * costPerBase
                }
            }
            // CASE 2: Wine bottle with costPrice
            else if (item.wineBottle && Number(item.wineBottle.costPrice ?? 0) > 0) {
                const bottleCost = Number(item.wineBottle.costPrice!)
                if (item.isGlassPour && product.glassesPerBottle > 0) {
                    itemCOGS = (bottleCost / product.glassesPerBottle) * item.quantity
                } else {
                    itemCOGS = bottleCost * item.quantity
                }
            }
            // CASE 3: Fallback to product costPrice
            else if (Number(product.costPrice) > 0) {
                itemCOGS = Number(product.costPrice) * item.quantity
            }

            itemCOGS = Math.round(itemCOGS)
            orderCOGS += itemCOGS

            // Only include items with calculable cost
            if (itemCOGS > 0 || sellingPrice > 0) {
                items.push({
                    productName: product.name,
                    qty: item.quantity,
                    ingredientCost: itemCOGS,
                    sellingPrice,
                })
            }
        }

        // Skip orders where we have nothing to report
        if (items.length === 0) continue

        const grossProfit = orderRevenue - orderCOGS
        const marginPct = orderRevenue > 0 ? Math.round((grossProfit / orderRevenue) * 100) : 0

        records.push({
            id: order.id,
            orderId: order.id,
            orderNo: order.orderNo,
            date: order.closedAt ?? order.createdAt,
            productName: items.map(i => i.productName).join(", "),
            soldDate: order.closedAt ?? order.createdAt,
            soldQty: items.reduce((s, i) => s + i.qty, 0),
            sellingPrice: orderRevenue,
            fifoCost: orderCOGS,
            grossMargin: marginPct,
            batchesUsed: items.length,
            items,
            totalCOGS: orderCOGS,
            totalRevenue: orderRevenue,
            grossProfit,
            marginPct,
        })
    }

    return records
}

/**
 * COGS Summary — aggregated from real order data
 */
export async function getCOGSSummary() {
    const records = await getCOGSRecords()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayRecords = records.filter(r => new Date(r.date) >= todayStart)

    const totalCOGS = records.reduce((s, r) => s + r.totalCOGS, 0)
    const todayCOGS = todayRecords.reduce((s, r) => s + r.totalCOGS, 0)
    const avgMargin = records.length > 0
        ? Math.round(records.reduce((s, r) => s + r.marginPct, 0) / records.length)
        : 0

    // Find top/lowest margin products
    const productMap = new Map<string, { revenue: number; cogs: number }>()
    for (const r of records) {
        for (const item of r.items) {
            const existing = productMap.get(item.productName) ?? { revenue: 0, cogs: 0 }
            existing.revenue += item.sellingPrice
            existing.cogs += item.ingredientCost
            productMap.set(item.productName, existing)
        }
    }
    const products = Array.from(productMap.entries()).map(([name, data]) => ({
        name,
        margin: data.revenue > 0 ? Math.round(((data.revenue - data.cogs) / data.revenue) * 100) : 0,
    }))
    products.sort((a, b) => b.margin - a.margin)

    return {
        todayCOGS,
        monthCOGS: totalCOGS,
        avgMargin,
        totalOrders: records.length,
        topMarginProduct: products[0] ? `${products[0].name} (${products[0].margin}%)` : "N/A",
        lowestMarginProduct: products.length > 0
            ? `${products[products.length - 1].name} (${products[products.length - 1].margin}%)`
            : "N/A",
    }
}

/**
 * COGS by product — real breakdown per product
 */
export async function getCOGSByProduct() {
    const records = await getCOGSRecords()

    const productMap = new Map<string, { revenue: number; cogs: number; qty: number }>()
    for (const r of records) {
        for (const item of r.items) {
            const existing = productMap.get(item.productName) ?? { revenue: 0, cogs: 0, qty: 0 }
            existing.revenue += item.sellingPrice
            existing.cogs += item.ingredientCost
            existing.qty += item.qty
            productMap.set(item.productName, existing)
        }
    }

    return Array.from(productMap.entries())
        .map(([productName, data]) => ({
            productName,
            totalRevenue: data.revenue,
            totalCOGS: data.cogs,
            grossProfit: data.revenue - data.cogs,
            grossMargin: data.revenue > 0 ? Math.round(((data.revenue - data.cogs) / data.revenue) * 100) : 0,
            totalQty: data.qty,
        }))
        .sort((a, b) => b.grossProfit - a.grossProfit)
}

/**
 * Finance Summary — REAL data from Orders, FundTransactions, Equipment
 */
export async function getFinanceSummary(): Promise<FinanceSummary> {
    const guard = await withRbac("finance", "view")
    if (!guard.ok) return { todayRevenue: 0, todayExpenses: 0, todayCOGS: 0, todayProfit: 0, totalRevenue: 0, totalCOGS: 0, grossProfit: 0, grossMargin: 0, operatingExpenses: 0, depreciationExpense: 0, netProfit: 0, netMargin: 0, monthRevenue: 0, monthExpenses: 0, monthCOGS: 0, monthProfit: 0, totalPayable: 0, totalReceivable: 0 }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // Revenue from PAID orders
    const [todayOrders, monthOrders] = await Promise.all([
        prisma.order.findMany({
            where: { status: "PAID", closedAt: { gte: todayStart } },
            select: { totalAmount: true },
        }),
        prisma.order.findMany({
            where: { status: "PAID", closedAt: { gte: monthStart } },
            select: { totalAmount: true },
        }),
    ])

    const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.totalAmount), 0)
    const monthRevenue = monthOrders.reduce((s, o) => s + Number(o.totalAmount), 0)

    // COGS from recipes
    const cogsSummary = await getCOGSSummary()
    const todayCOGS = cogsSummary.todayCOGS
    const monthCOGS = cogsSummary.monthCOGS

    // Operating expenses from FundTransaction
    const [todayExpAgg, monthExpAgg] = await Promise.all([
        prisma.fundTransaction.aggregate({
            where: { transactionType: "EXPENSE", date: { gte: todayStart } },
            _sum: { amount: true },
        }),
        prisma.fundTransaction.aggregate({
            where: { transactionType: "EXPENSE", date: { gte: monthStart } },
            _sum: { amount: true },
        }),
    ])
    const todayExpenses = Number(todayExpAgg._sum.amount ?? 0)
    const monthExpenses = Number(monthExpAgg._sum.amount ?? 0)

    // Depreciation from Equipment
    const depreciationExpense = await prisma.equipment.aggregate({
        where: { status: "ACTIVE" },
        _sum: { monthlyDepreciation: true },
    }).then(r => Number(r._sum.monthlyDepreciation ?? 0))

    // Debt
    const debts = await prisma.debtRecord.findMany({
        where: { status: { in: ["OUTSTANDING", "PARTIAL"] } },
    })
    const totalPayable = debts.filter(d => d.debtType === "PAYABLE").reduce((s, d) => s + Number(d.amount) - Number(d.paidAmount), 0)
    const totalReceivable = debts.filter(d => d.debtType === "RECEIVABLE").reduce((s, d) => s + Number(d.amount) - Number(d.paidAmount), 0)

    // Calculations
    const totalRevenue = monthRevenue
    const totalCOGS = monthCOGS
    const grossProfit = totalRevenue - totalCOGS
    const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0
    const operatingExpenses = monthExpenses
    const netProfit = grossProfit - operatingExpenses - depreciationExpense
    const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0

    return {
        todayRevenue,
        todayExpenses,
        todayCOGS,
        todayProfit: todayRevenue - todayCOGS - todayExpenses,
        totalRevenue,
        totalCOGS,
        grossProfit,
        grossMargin,
        operatingExpenses,
        depreciationExpense,
        netProfit,
        netMargin,
        monthRevenue,
        monthExpenses,
        monthCOGS,
        monthProfit: grossProfit - operatingExpenses - depreciationExpense,
        totalPayable,
        totalReceivable,
    }
}

/**
 * Expense Breakdown — categorize by COGS vs Operating vs Depreciation
 */
export async function getExpenseBreakdown(): Promise<ExpenseCategory[]> {
    const summary = await getFinanceSummary()

    const categories: ExpenseCategory[] = []
    const total = summary.totalCOGS + summary.operatingExpenses + summary.depreciationExpense

    if (total === 0) return []

    if (summary.totalCOGS > 0) {
        categories.push({
            category: "Giá vốn hàng bán (COGS)",
            amount: summary.totalCOGS,
            percentage: Math.round((summary.totalCOGS / total) * 100),
            color: "#991b1b",
        })
    }

    // Break down operating expenses by category from FundTransaction
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const expByCategory = await prisma.fundTransaction.groupBy({
        by: ["category"],
        where: { transactionType: "EXPENSE", date: { gte: monthStart } },
        _sum: { amount: true },
    })

    const colors = ["#1e40af", "#047857", "#b45309", "#6d28d9", "#be185d", "#0f766e"]
    for (let i = 0; i < expByCategory.length; i++) {
        const exp = expByCategory[i]
        const amount = Number(exp._sum.amount ?? 0)
        if (amount > 0) {
            categories.push({
                category: exp.category,
                amount,
                percentage: Math.round((amount / total) * 100),
                color: colors[i % colors.length],
            })
        }
    }

    if (summary.depreciationExpense > 0) {
        categories.push({
            category: "Khấu hao CCDC/Thiết bị",
            amount: summary.depreciationExpense,
            percentage: Math.round((summary.depreciationExpense / total) * 100),
            color: "#92400e",
        })
    }

    return categories.sort((a, b) => b.amount - a.amount)
}

// ============================================================
// DAILY REVENUE CHART + TOP PRODUCTS
// ============================================================

/** Last N days revenue/COGS/profit for chart */
export async function getDailyRevenueChart(days: number = 30): Promise<DailyChartPoint[]> {
    const since = new Date(); since.setDate(since.getDate() - days); since.setHours(0, 0, 0, 0)

    const orders = await prisma.order.findMany({
        where: { status: "PAID", createdAt: { gte: since } },
        select: { totalAmount: true, createdAt: true },
    })

    const cogsTransactions = await prisma.fundTransaction.findMany({
        where: {
            transactionType: "EXPENSE",
            category: "Giá vốn hàng bán (COGS)",
            createdAt: { gte: since },
        },
        select: { amount: true, createdAt: true },
    })

    // Build day map
    const dayMap = new Map<string, { revenue: number; cogs: number }>()
    for (let d = 0; d < days; d++) {
        const dt = new Date(since); dt.setDate(dt.getDate() + d)
        dayMap.set(dt.toISOString().slice(0, 10), { revenue: 0, cogs: 0 })
    }

    for (const o of orders) {
        const key = o.createdAt.toISOString().slice(0, 10)
        const entry = dayMap.get(key)
        if (entry) entry.revenue += Number(o.totalAmount)
    }

    for (const t of cogsTransactions) {
        const key = t.createdAt.toISOString().slice(0, 10)
        const entry = dayMap.get(key)
        if (entry) entry.cogs += Number(t.amount)
    }

    return Array.from(dayMap.entries()).map(([date, { revenue, cogs }]) => ({
        date,
        label: new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        revenue: Math.round(revenue),
        cogs: Math.round(cogs),
        profit: Math.round(revenue - cogs),
    }))
}

/** Top selling products by revenue */
export async function getTopProductsRevenue(limit: number = 10) {
    const since = new Date(); since.setDate(1); since.setHours(0, 0, 0, 0) // First of month

    const items = await prisma.orderItem.findMany({
        where: {
            order: { status: "PAID", createdAt: { gte: since } },
        },
        select: {
            productId: true,
            quantity: true,
            subtotal: true,
            product: { select: { name: true, type: true } },
        },
    })

    const productMap = new Map<string, { name: string; type: string; qty: number; revenue: number }>()
    for (const item of items) {
        const existing = productMap.get(item.productId)
        if (existing) {
            existing.qty += item.quantity
            existing.revenue += Number(item.subtotal)
        } else {
            productMap.set(item.productId, {
                name: item.product.name,
                type: item.product.type,
                qty: item.quantity,
                revenue: Number(item.subtotal),
            })
        }
    }

    return Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
}

export type DailyChartPoint = {
    date: string
    label: string
    revenue: number
    cogs: number
    profit: number
}
