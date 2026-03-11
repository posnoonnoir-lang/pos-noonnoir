"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { ActionResult, TaxRate, TaxRateFormData } from "@/types"

export async function getTaxRates(): Promise<TaxRate[]> {
    const rates = await prisma.taxRate.findMany({ orderBy: { rate: "asc" } })
    return rates.map((r) => ({ ...r, rate: Number(r.rate) }))
}

export async function createTaxRate(data: TaxRateFormData): Promise<ActionResult<TaxRate>> {
    try {
        const rate = await prisma.taxRate.create({ data })
        revalidatePath("/dashboard/settings")
        return { success: true, data: { ...rate, rate: Number(rate.rate) } }
    } catch {
        return { success: false, error: { code: "ERR_CREATE", message: "Mã thuế đã tồn tại" } }
    }
}

export async function updateTaxRate(id: string, data: Partial<TaxRateFormData>): Promise<ActionResult<TaxRate>> {
    try {
        const rate = await prisma.taxRate.update({ where: { id }, data })
        revalidatePath("/dashboard/settings")
        return { success: true, data: { ...rate, rate: Number(rate.rate) } }
    } catch {
        return { success: false, error: { code: "ERR_NOT_FOUND", message: "Không tìm thấy thuế suất" } }
    }
}

export async function deleteTaxRate(id: string): Promise<ActionResult> {
    try {
        await prisma.taxRate.update({ where: { id }, data: { isActive: false } })
        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch {
        return { success: false, error: { code: "ERR_DELETE", message: "Không thể xóa" } }
    }
}

export async function calculateTax(subtotal: number, taxRateId?: string) {
    if (!taxRateId) return { taxAmount: 0, taxRate: 0, taxName: "" }
    const rate = await prisma.taxRate.findUnique({ where: { id: taxRateId } })
    if (!rate) return { taxAmount: 0, taxRate: 0, taxName: "" }
    return {
        taxAmount: Math.round(subtotal * Number(rate.rate) / 100),
        taxRate: Number(rate.rate),
        taxName: rate.name,
    }
}

// Alias for settings page
export const getAllTaxRates = getTaxRates

// Get default/first active tax rate for POS
export async function getDefaultTaxRate(): Promise<{ id: string; name: string; rate: number } | null> {
    const rate = await prisma.taxRate.findFirst({
        where: { isActive: true, isDefault: true },
        orderBy: { rate: "asc" },
    })
    if (rate) return { id: rate.id, name: rate.name, rate: Number(rate.rate) }
    // Fallback: first active rate
    const any = await prisma.taxRate.findFirst({ where: { isActive: true }, orderBy: { rate: "asc" } })
    return any ? { id: any.id, name: any.name, rate: Number(any.rate) } : null
}

// Stubs for settings page
export async function getTaxConfig() {
    return { enabled: true, inclusive: true, defaultRateId: null }
}
export async function updateTaxConfig(_data: Record<string, unknown>) { return { success: true } }
export async function getTaxReport(_period?: string) { return [] }
export async function getTaxBreakdownByRate() { return [] }


