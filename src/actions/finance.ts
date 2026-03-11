"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { TransactionType } from "@prisma/client"

// ============================================================
// FINANCE — Fund Transactions + Debt Records
// ============================================================

export async function getFundTransactions(params?: { startDate?: Date; endDate?: Date; type?: TransactionType }) {
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

// Types needed by finance page
export type COGSRecord = {
    id: string; orderId: string; orderNo: string; date: Date
    productName?: string; batchesUsed?: number; soldDate?: Date; soldQty?: number
    sellingPrice?: number; fifoCost?: number; grossMargin?: number
    items: Array<{ productName: string; qty: number; ingredientCost: number; sellingPrice: number }>
    totalCOGS: number; totalRevenue: number; grossProfit: number; marginPct: number
}

export type FinanceSummary = {
    todayRevenue: number; todayExpenses: number; todayCOGS: number; todayProfit: number
    totalRevenue?: number; totalCOGS?: number; grossProfit?: number; grossMargin?: number
    operatingExpenses?: number; depreciationExpense?: number; netProfit?: number; netMargin?: number
    monthRevenue: number; monthExpenses: number; monthCOGS: number; monthProfit: number
    totalPayable: number; totalReceivable: number
}

export type ExpenseCategory = {
    category: string; amount: number; percentage: number; color: string
}

// Stub functions for finance page
export async function getCOGSRecords(): Promise<COGSRecord[]> { return [] }
export async function getCOGSSummary() {
    return { todayCOGS: 0, monthCOGS: 0, avgMargin: 0, totalOrders: 0, topMarginProduct: null, lowestMarginProduct: null }
}
export async function getFinanceSummary(): Promise<FinanceSummary> {
    const stats = await getFinanceStats()
    return { ...stats, todayCOGS: 0, monthRevenue: 0, monthExpenses: 0, monthCOGS: 0, monthProfit: 0 }
}
export async function getExpenseBreakdown(): Promise<ExpenseCategory[]> { return [] }
export async function getCOGSByProduct() { return [] }
