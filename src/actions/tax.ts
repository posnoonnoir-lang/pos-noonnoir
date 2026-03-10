"use server"

import type { ActionResult, TaxRate, TaxRateFormData } from "@/types"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ============================================================
// MOCK DATA — Tax Rates (Vietnam VAT)
// ============================================================

const MOCK_TAX_RATES: TaxRate[] = [
    {
        id: "tax-10",
        name: "VAT 10%",
        code: "VAT10",
        rate: 10,
        description: "Thuế suất tiêu chuẩn — Dịch vụ ăn uống, rượu",
        isDefault: true,
        isActive: true,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
    },
    {
        id: "tax-8",
        name: "VAT 8%",
        code: "VAT8",
        rate: 8,
        description: "Thuế suất giảm tạm thời (Nghị định 72/2024)",
        isDefault: false,
        isActive: true,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
    },
    {
        id: "tax-5",
        name: "VAT 5%",
        code: "VAT5",
        rate: 5,
        description: "Hàng hóa thiết yếu — nước sạch, thực phẩm cơ bản",
        isDefault: false,
        isActive: true,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
    },
    {
        id: "tax-0",
        name: "VAT 0%",
        code: "VAT0",
        rate: 0,
        description: "Hàng xuất khẩu, dịch vụ cung ứng ngoài lãnh thổ",
        isDefault: false,
        isActive: true,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
    },
    {
        id: "tax-exempt",
        name: "Không chịu thuế",
        code: "EXEMPT",
        rate: 0,
        description: "Hàng hóa/dịch vụ không thuộc đối tượng chịu thuế GTGT",
        isDefault: false,
        isActive: true,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
    },
]

// ============================================================
// Tax Store Config (mock store settings)
// ============================================================

// eslint-disable-next-line prefer-const
let TAX_ENABLED = true
// eslint-disable-next-line prefer-const
let TAX_INCLUSIVE = true

// ============================================================
// CRUD — Tax Rates
// ============================================================

export async function getTaxRates(): Promise<TaxRate[]> {
    await delay(100)
    return [...MOCK_TAX_RATES].filter((t) => t.isActive)
}

export async function getAllTaxRates(): Promise<TaxRate[]> {
    await delay(100)
    return [...MOCK_TAX_RATES]
}

export async function getTaxRateById(id: string): Promise<TaxRate | null> {
    await delay(50)
    return MOCK_TAX_RATES.find((t) => t.id === id) ?? null
}

export async function getDefaultTaxRate(): Promise<TaxRate | null> {
    await delay(50)
    return MOCK_TAX_RATES.find((t) => t.isDefault && t.isActive) ?? null
}

export async function createTaxRate(data: TaxRateFormData): Promise<ActionResult<TaxRate>> {
    await delay(200)

    const exists = MOCK_TAX_RATES.find((t) => t.code === data.code)
    if (exists) {
        return { success: false, error: { code: "ERR_DUPLICATE", message: `Mã thuế ${data.code} đã tồn tại` } }
    }

    if (data.isDefault) {
        MOCK_TAX_RATES.forEach((t) => (t.isDefault = false))
    }

    const newRate: TaxRate = {
        id: `tax-${Date.now()}`,
        name: data.name,
        code: data.code,
        rate: data.rate,
        description: data.description ?? null,
        isDefault: data.isDefault ?? false,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    MOCK_TAX_RATES.push(newRate)
    return { success: true, data: newRate }
}

export async function updateTaxRate(id: string, data: Partial<TaxRateFormData>): Promise<ActionResult<TaxRate>> {
    await delay(200)

    const idx = MOCK_TAX_RATES.findIndex((t) => t.id === id)
    if (idx === -1) return { success: false, error: { code: "ERR_NOT_FOUND", message: "Thuế suất không tồn tại" } }

    if (data.isDefault) {
        MOCK_TAX_RATES.forEach((t) => (t.isDefault = false))
    }

    MOCK_TAX_RATES[idx] = {
        ...MOCK_TAX_RATES[idx],
        ...data,
        description: data.description ?? MOCK_TAX_RATES[idx].description,
        updatedAt: new Date(),
    }

    return { success: true, data: MOCK_TAX_RATES[idx] }
}

export async function deleteTaxRate(id: string): Promise<ActionResult> {
    await delay(200)

    const idx = MOCK_TAX_RATES.findIndex((t) => t.id === id)
    if (idx === -1) return { success: false, error: { code: "ERR_NOT_FOUND", message: "Thuế suất không tồn tại" } }

    // Don't actually delete, just deactivate
    MOCK_TAX_RATES[idx].isActive = false
    MOCK_TAX_RATES[idx].updatedAt = new Date()

    return { success: true }
}

// ============================================================
// Tax Configuration
// ============================================================

export async function getTaxConfig(): Promise<{ enabled: boolean; inclusive: boolean }> {
    await delay(50)
    return { enabled: TAX_ENABLED, inclusive: TAX_INCLUSIVE }
}

export async function updateTaxConfig(config: {
    enabled?: boolean
    inclusive?: boolean
}): Promise<ActionResult> {
    await delay(200)
    if (config.enabled !== undefined) TAX_ENABLED = config.enabled
    if (config.inclusive !== undefined) TAX_INCLUSIVE = config.inclusive
    return { success: true }
}

// ============================================================
// Tax Calculation Helpers
// ============================================================

export async function calculateItemTax(
    subtotal: number,
    taxRateId?: string | null
): Promise<{ taxRatePct: number; taxAmount: number; priceBeforeTax: number; priceAfterTax: number }> {
    if (!TAX_ENABLED || !taxRateId) {
        return { taxRatePct: 0, taxAmount: 0, priceBeforeTax: subtotal, priceAfterTax: subtotal }
    }

    const taxRate = MOCK_TAX_RATES.find((t) => t.id === taxRateId)
    if (!taxRate || !taxRate.isActive) {
        return { taxRatePct: 0, taxAmount: 0, priceBeforeTax: subtotal, priceAfterTax: subtotal }
    }

    const rate = taxRate.rate

    if (TAX_INCLUSIVE) {
        // Price already includes VAT: tax = subtotal * rate / (100 + rate)
        const taxAmount = Math.round((subtotal * rate) / (100 + rate))
        const priceBeforeTax = subtotal - taxAmount
        return { taxRatePct: rate, taxAmount, priceBeforeTax, priceAfterTax: subtotal }
    } else {
        // Price excludes VAT: tax = subtotal * rate / 100
        const taxAmount = Math.round((subtotal * rate) / 100)
        return { taxRatePct: rate, taxAmount, priceBeforeTax: subtotal, priceAfterTax: subtotal + taxAmount }
    }
}

// ============================================================
// Tax Report — Input vs Output
// ============================================================

export async function getTaxReport(year: number, month?: number): Promise<{
    period: string
    outputTax: number
    inputTax: number
    taxPayable: number
    totalRevenue: number
    totalPurchases: number
}[]> {
    await delay(200)

    // Mock tax report data for demo
    const months = month
        ? [month]
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

    return months.map((m) => {
        const revenue = 40_000_000 + Math.floor(Math.random() * 20_000_000)
        const purchases = 15_000_000 + Math.floor(Math.random() * 10_000_000)
        const outputTax = Math.round(revenue * 10 / 110) // Assume 10% inclusive
        const inputTax = Math.round(purchases * 10 / 110)
        return {
            period: `${m.toString().padStart(2, "0")}/${year}`,
            outputTax,
            inputTax,
            taxPayable: outputTax - inputTax,
            totalRevenue: revenue,
            totalPurchases: purchases,
        }
    })
}

export async function getTaxBreakdownByRate(): Promise<{
    taxRateName: string
    taxRateCode: string
    ratePct: number
    totalSales: number
    outputTax: number
    itemCount: number
}[]> {
    await delay(150)

    // Mock breakdown per tax rate
    return [
        { taxRateName: "VAT 10%", taxRateCode: "VAT10", ratePct: 10, totalSales: 38_500_000, outputTax: 3_500_000, itemCount: 245 },
        { taxRateName: "VAT 8%", taxRateCode: "VAT8", ratePct: 8, totalSales: 2_400_000, outputTax: 177_778, itemCount: 18 },
        { taxRateName: "VAT 5%", taxRateCode: "VAT5", ratePct: 5, totalSales: 800_000, outputTax: 38_095, itemCount: 12 },
        { taxRateName: "VAT 0%", taxRateCode: "VAT0", ratePct: 0, totalSales: 300_000, outputTax: 0, itemCount: 5 },
    ]
}
