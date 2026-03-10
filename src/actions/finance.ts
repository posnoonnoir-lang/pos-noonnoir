"use server"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// COGS using FIFO method
export type COGSRecord = {
    id: string
    productName: string
    sku: string
    sellingPrice: number
    fifoCost: number
    grossProfit: number
    grossMargin: number
    batchesUsed: { poNumber: string; qty: number; unitCost: number; subtotal: number }[]
    soldDate: string
    soldQty: number
}

export type FinanceSummary = {
    totalRevenue: number
    totalCOGS: number
    grossProfit: number
    grossMargin: number
    operatingExpenses: number
    depreciationExpense: number
    netProfit: number
    netMargin: number
}

export type ExpenseCategory = {
    category: string
    amount: number
    percentage: number
    color: string
}

const MOCK_COGS: COGSRecord[] = [
    {
        id: "cogs-1", productName: "Château Margaux 2018", sku: "WB-CM-2018",
        sellingPrice: 8_500_000, fifoCost: 4_200_000, grossProfit: 4_300_000, grossMargin: 50.6,
        batchesUsed: [{ poNumber: "PO-2026-001", qty: 1, unitCost: 4_200_000, subtotal: 4_200_000 }],
        soldDate: "2026-03-10", soldQty: 1,
    },
    {
        id: "cogs-2", productName: "Château Margaux 2018", sku: "WB-CM-2018",
        sellingPrice: 8_500_000, fifoCost: 4_200_000, grossProfit: 4_300_000, grossMargin: 50.6,
        batchesUsed: [{ poNumber: "PO-2026-001", qty: 1, unitCost: 4_200_000, subtotal: 4_200_000 }],
        soldDate: "2026-03-09", soldQty: 1,
    },
    {
        id: "cogs-3", productName: "Opus One 2019", sku: "WB-OO-2019",
        sellingPrice: 15_000_000, fifoCost: 7_800_000, grossProfit: 7_200_000, grossMargin: 48.0,
        batchesUsed: [{ poNumber: "PO-2026-001", qty: 1, unitCost: 7_800_000, subtotal: 7_800_000 }],
        soldDate: "2026-03-10", soldQty: 1,
    },
    {
        id: "cogs-4", productName: "Aperol Spritz (ly)", sku: "CK-APR-01",
        sellingPrice: 180_000, fifoCost: 52_500, grossProfit: 127_500, grossMargin: 70.8,
        batchesUsed: [{ poNumber: "PO-2025-018", qty: 0.125, unitCost: 420_000, subtotal: 52_500 }],
        soldDate: "2026-03-10", soldQty: 3,
    },
    {
        id: "cogs-5", productName: "Cheese Board", sku: "FD-CB-01",
        sellingPrice: 320_000, fifoCost: 130_500, grossProfit: 189_500, grossMargin: 59.2,
        batchesUsed: [
            { poNumber: "PO-2026-002", qty: 0.1, unitCost: 320_000, subtotal: 32_000 },
            { poNumber: "PO-2026-002", qty: 0.08, unitCost: 450_000, subtotal: 36_000 },
        ],
        soldDate: "2026-03-10", soldQty: 2,
    },
    {
        id: "cogs-6", productName: "Truffle Fries", sku: "FD-TF-01",
        sellingPrice: 120_000, fifoCost: 15_400, grossProfit: 104_600, grossMargin: 87.2,
        batchesUsed: [
            { poNumber: "PO-2026-002", qty: 0.2, unitCost: 45_000, subtotal: 9_000 },
            { poNumber: "PO-2026-002", qty: 0.02, unitCost: 320_000, subtotal: 6_400 },
        ],
        soldDate: "2026-03-10", soldQty: 4,
    },
    {
        id: "cogs-7", productName: "Pinot Noir (Glass)", sku: "WG-PN-01",
        sellingPrice: 150_000, fifoCost: 35_000, grossProfit: 115_000, grossMargin: 76.7,
        batchesUsed: [{ poNumber: "PO-2025-020", qty: 0.125, unitCost: 280_000, subtotal: 35_000 }],
        soldDate: "2026-03-10", soldQty: 5,
    },
    {
        id: "cogs-8", productName: "Negroni", sku: "CK-NEG-01",
        sellingPrice: 200_000, fifoCost: 78_000, grossProfit: 122_000, grossMargin: 61.0,
        batchesUsed: [
            { poNumber: "PO-2025-019", qty: 0.06, unitCost: 500_000, subtotal: 30_000 },
            { poNumber: "PO-2025-018", qty: 0.06, unitCost: 420_000, subtotal: 25_200 },
        ],
        soldDate: "2026-03-10", soldQty: 3,
    },
]

const MOCK_EXPENSES: ExpenseCategory[] = [
    { category: "Giá vốn hàng bán (COGS)", amount: 16_681_400, percentage: 38.2, color: "#b91c1c" },
    { category: "Nhân sự", amount: 12_800_000, percentage: 29.3, color: "#1d4ed8" },
    { category: "Mặt bằng", amount: 8_500_000, percentage: 19.5, color: "#059669" },
    { category: "Khấu hao CCDC", amount: 2_555_715, percentage: 5.9, color: "#d97706" },
    { category: "Điện nước", amount: 1_800_000, percentage: 4.1, color: "#7c3aed" },
    { category: "Hao hụt / Waste", amount: 650_000, percentage: 1.5, color: "#dc2626" },
    { category: "Marketing", amount: 500_000, percentage: 1.1, color: "#0891b2" },
    { category: "Khác", amount: 200_000, percentage: 0.4, color: "#6b7280" },
]

export async function getCOGSRecords(): Promise<COGSRecord[]> {
    await delay(120)
    return [...MOCK_COGS].sort((a, b) => new Date(b.soldDate).getTime() - new Date(a.soldDate).getTime())
}

export async function getCOGSSummary() {
    await delay(100)
    const todayRecords = MOCK_COGS.filter((r) => r.soldDate === "2026-03-10")
    const totalRevenue = todayRecords.reduce((s, r) => s + r.sellingPrice * r.soldQty, 0)
    const totalCOGS = todayRecords.reduce((s, r) => s + r.fifoCost * r.soldQty, 0)
    const grossProfit = totalRevenue - totalCOGS
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    return {
        totalRevenue,
        totalCOGS,
        grossProfit,
        grossMargin: Math.round(grossMargin * 10) / 10,
        avgMargin: Math.round(MOCK_COGS.reduce((s, r) => s + r.grossMargin, 0) / MOCK_COGS.length * 10) / 10,
        itemsSold: todayRecords.reduce((s, r) => s + r.soldQty, 0),
        topMarginProduct: [...MOCK_COGS].sort((a, b) => b.grossMargin - a.grossMargin)[0]?.productName ?? "-",
        lowestMarginProduct: [...MOCK_COGS].sort((a, b) => a.grossMargin - b.grossMargin)[0]?.productName ?? "-",
    }
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
    await delay(120)
    const totalRevenue = 43_670_000
    const totalCOGS = 16_681_400
    const grossProfit = totalRevenue - totalCOGS
    const operatingExpenses = 12_800_000 + 8_500_000 + 1_800_000 + 650_000 + 500_000 + 200_000
    const depreciationExpense = 2_555_715
    const netProfit = grossProfit - operatingExpenses - depreciationExpense
    const grossMargin = (grossProfit / totalRevenue) * 100
    const netMargin = (netProfit / totalRevenue) * 100

    return {
        totalRevenue,
        totalCOGS,
        grossProfit,
        grossMargin: Math.round(grossMargin * 10) / 10,
        operatingExpenses,
        depreciationExpense,
        netProfit,
        netMargin: Math.round(netMargin * 10) / 10,
    }
}

export async function getExpenseBreakdown(): Promise<ExpenseCategory[]> {
    await delay(80)
    return [...MOCK_EXPENSES]
}

export async function getCOGSByProduct() {
    await delay(100)
    const grouped = new Map<string, { productName: string; totalRevenue: number; totalCOGS: number; totalQty: number }>()

    for (const r of MOCK_COGS) {
        const existing = grouped.get(r.sku)
        if (existing) {
            existing.totalRevenue += r.sellingPrice * r.soldQty
            existing.totalCOGS += r.fifoCost * r.soldQty
            existing.totalQty += r.soldQty
        } else {
            grouped.set(r.sku, {
                productName: r.productName,
                totalRevenue: r.sellingPrice * r.soldQty,
                totalCOGS: r.fifoCost * r.soldQty,
                totalQty: r.soldQty,
            })
        }
    }

    return Array.from(grouped.values()).map((g) => ({
        ...g,
        grossProfit: g.totalRevenue - g.totalCOGS,
        grossMargin: Math.round(((g.totalRevenue - g.totalCOGS) / g.totalRevenue) * 1000) / 10,
    })).sort((a, b) => b.grossProfit - a.grossProfit)
}
