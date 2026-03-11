"use server"

import { prisma } from "@/lib/prisma"
import type { EquipmentStatus as PrismaEquipmentStatus } from "@prisma/client"

// ============================================================
// ASSETS (CCDC), RAW MATERIALS, RECIPES — Prisma version
// ============================================================

export type EquipmentStatus = "ACTIVE" | "MAINTENANCE" | "RETIRED" | "DAMAGED"

export type Equipment = {
    id: string; name: string; code: string; category: string
    quantity: number; unitPrice: number; totalValue: number; purchaseDate: string
    poNumber: string | null; usefulLifeMonths: number; monthlyDepreciation: number
    accumulatedDepreciation: number; netBookValue: number; location: string
    status: EquipmentStatus; notes: string
}

export type DepreciationEntry = {
    id: string; equipmentId: string; equipmentName: string; month: string
    amount: number; accumulatedBefore: number; accumulatedAfter: number; netBookValue: number
}

export type RawMaterial = {
    id: string; name: string; sku: string; category: string; unit: string
    currentStock: number; minStock: number; costPrice: number; lastPurchasePrice: number
    expiryDate: string | null; supplierId: string | null; supplierName: string | null
    status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"
}

export type Recipe = {
    id: string; productName: string; productId: string
    ingredients: { materialId: string; materialName: string; quantity: number; unit: string; costPerUnit: number }[]
    totalCost: number; notes: string
}

// ============================================================
// Equipment CRUD
// ============================================================

function toEquipment(e: Awaited<ReturnType<typeof prisma.equipment.findFirst>>): Equipment {
    return {
        id: e!.id, name: e!.name, code: e!.code, category: e!.category,
        quantity: e!.quantity, unitPrice: Number(e!.unitPrice), totalValue: Number(e!.totalValue),
        purchaseDate: e!.purchaseDate.toISOString().split("T")[0],
        poNumber: e!.poNumber, usefulLifeMonths: e!.usefulLifeMonths,
        monthlyDepreciation: Number(e!.monthlyDepreciation),
        accumulatedDepreciation: Number(e!.accumulatedDepreciation),
        netBookValue: Number(e!.netBookValue), location: e!.location,
        status: e!.status as EquipmentStatus, notes: e!.notes ?? "",
    }
}

export async function getEquipment(): Promise<Equipment[]> {
    const rows = await prisma.equipment.findMany({ orderBy: { createdAt: "desc" } })
    return rows.map((r) => toEquipment(r))
}

export async function getEquipmentStats() {
    const all = await prisma.equipment.findMany()
    const active = all.filter((e) => e.status === "ACTIVE")
    return {
        totalItems: all.length,
        activeItems: active.length,
        totalOriginalValue: all.reduce((s, e) => s + Number(e.totalValue), 0),
        totalAccumulatedDep: all.reduce((s, e) => s + Number(e.accumulatedDepreciation), 0),
        totalNetBookValue: all.reduce((s, e) => s + Number(e.netBookValue), 0),
        monthlyDepTotal: active.reduce((s, e) => s + Number(e.monthlyDepreciation), 0),
        maintenanceCount: all.filter((e) => e.status === "MAINTENANCE").length,
        categories: [...new Set(all.map((e) => e.category))].length,
    }
}

export async function getDepreciationHistory(): Promise<DepreciationEntry[]> {
    const rows = await prisma.depreciationEntry.findMany({
        include: { equipment: true },
        orderBy: { month: "desc" },
    })
    return rows.map((r) => ({
        id: r.id, equipmentId: r.equipmentId, equipmentName: r.equipment.name,
        month: r.month, amount: Number(r.amount),
        accumulatedBefore: Number(r.accumulatedBefore), accumulatedAfter: Number(r.accumulatedAfter),
        netBookValue: Number(r.netBookValue),
    }))
}

// ============================================================
// Auto Monthly Depreciation
// ============================================================

export type DepreciationRunResult = {
    success: boolean; month: string; entriesCreated: number; totalDepreciation: number
    entries: { equipmentName: string; amount: number; newNBV: number; fullyDepreciated: boolean }[]
    skipped: { equipmentName: string; reason: string }[]
}

export async function runMonthlyDepreciation(month?: string): Promise<DepreciationRunResult> {
    const targetMonth = month ?? new Date().toISOString().slice(0, 7)

    const alreadyRun = await prisma.depreciationEntry.count({ where: { month: targetMonth } })
    if (alreadyRun > 0) {
        return {
            success: false, month: targetMonth, entriesCreated: 0, totalDepreciation: 0, entries: [],
            skipped: [{ equipmentName: "ALL", reason: `Tháng ${targetMonth} đã chạy khấu hao (${alreadyRun} entries)` }]
        }
    }

    const allEquipment = await prisma.equipment.findMany()
    const entries: DepreciationRunResult["entries"] = []
    const skipped: DepreciationRunResult["skipped"] = []
    let totalDep = 0

    for (const eq of allEquipment) {
        if (eq.status !== "ACTIVE") { skipped.push({ equipmentName: eq.name, reason: `Trạng thái: ${eq.status}` }); continue }
        if (Number(eq.netBookValue) <= 0) { skipped.push({ equipmentName: eq.name, reason: "Đã khấu hao xong (NBV = 0)" }); continue }

        const depAmount = Math.min(Number(eq.monthlyDepreciation), Number(eq.netBookValue))
        const accBefore = Number(eq.accumulatedDepreciation)
        const newAcc = accBefore + depAmount
        const newNBV = Math.max(0, Number(eq.netBookValue) - depAmount)
        const fullyDepreciated = newNBV <= 0

        await prisma.$transaction([
            prisma.depreciationEntry.create({
                data: { equipmentId: eq.id, month: targetMonth, amount: depAmount, accumulatedBefore: accBefore, accumulatedAfter: newAcc, netBookValue: newNBV },
            }),
            prisma.equipment.update({
                where: { id: eq.id },
                data: {
                    accumulatedDepreciation: newAcc, netBookValue: newNBV,
                    ...(fullyDepreciated ? { status: "RETIRED" as PrismaEquipmentStatus } : {}),
                },
            }),
        ])

        totalDep += depAmount
        entries.push({ equipmentName: eq.name, amount: depAmount, newNBV, fullyDepreciated })
    }

    return { success: true, month: targetMonth, entriesCreated: entries.length, totalDepreciation: totalDep, entries, skipped }
}

export async function createEquipment(
    data: Omit<Equipment, "id" | "accumulatedDepreciation" | "netBookValue" | "monthlyDepreciation">
): Promise<Equipment> {
    const monthlyDep = Math.round(data.totalValue / data.usefulLifeMonths)
    const row = await prisma.equipment.create({
        data: {
            name: data.name, code: data.code, category: data.category, quantity: data.quantity,
            unitPrice: data.unitPrice, totalValue: data.totalValue, purchaseDate: new Date(data.purchaseDate),
            poNumber: data.poNumber, usefulLifeMonths: data.usefulLifeMonths,
            monthlyDepreciation: monthlyDep, accumulatedDepreciation: 0, netBookValue: data.totalValue,
            location: data.location, status: data.status as PrismaEquipmentStatus, notes: data.notes || null,
        },
    })
    return toEquipment(row)
}

export async function updateEquipmentStatus(id: string, status: EquipmentStatus): Promise<{ success: boolean }> {
    try {
        await prisma.equipment.update({ where: { id }, data: { status: status as PrismaEquipmentStatus } })
        return { success: true }
    } catch { return { success: false } }
}

// ============================================================
// Raw Materials — maps to Prisma Ingredient model
// ============================================================

function ingredientStatus(current: number, min: number): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" {
    if (current <= 0) return "OUT_OF_STOCK"
    if (current <= min) return "LOW_STOCK"
    return "IN_STOCK"
}

export async function getRawMaterials(): Promise<RawMaterial[]> {
    const rows = await prisma.ingredient.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
    return rows.map((r) => ({
        id: r.id, name: r.name, sku: "", category: "", unit: r.unit,
        currentStock: Number(r.currentStock), minStock: Number(r.minStock),
        costPrice: Number(r.costPerUnit), lastPurchasePrice: Number(r.costPerUnit),
        expiryDate: r.expiryDate ? r.expiryDate.toISOString().split("T")[0] : null,
        supplierId: null, supplierName: null,
        status: ingredientStatus(Number(r.currentStock), Number(r.minStock)),
    }))
}

export async function getRawMaterialStats() {
    const all = await prisma.ingredient.findMany({ where: { isActive: true } })
    const now = new Date()
    return {
        totalItems: all.length,
        inStock: all.filter((m) => Number(m.currentStock) > Number(m.minStock)).length,
        lowStock: all.filter((m) => Number(m.currentStock) > 0 && Number(m.currentStock) <= Number(m.minStock)).length,
        outOfStock: all.filter((m) => Number(m.currentStock) <= 0).length,
        totalValue: all.reduce((s, m) => s + Number(m.costPerUnit) * Number(m.currentStock), 0),
        expiringSoon: all.filter((m) => {
            if (!m.expiryDate) return false
            const days = (m.expiryDate.getTime() - now.getTime()) / 86400000
            return days > 0 && days <= 7
        }).length,
        categories: 0,
    }
}

export async function adjustRawMaterial(
    id: string, type: "IN" | "OUT" | "WASTE", quantity: number, reason: string
): Promise<{ success: boolean; error?: string }> {
    const mat = await prisma.ingredient.findUnique({ where: { id } })
    if (!mat) return { success: false, error: "Không tìm thấy NPL" }

    const current = Number(mat.currentStock)
    if (type !== "IN" && current < quantity) return { success: false, error: "Không đủ tồn kho" }

    const newStock = type === "IN" ? current + quantity : current - quantity
    await prisma.ingredient.update({ where: { id }, data: { currentStock: newStock } })

    // Log to stock movement
    const movementType = type === "IN" ? "PURCHASE" : type === "WASTE" ? "WASTE" : "ADJUSTMENT"
    await prisma.stockMovement.create({
        data: { type: movementType as "PURCHASE" | "WASTE" | "ADJUSTMENT", productId: id, quantity, reason },
    }).catch(() => { /* if stock_movement model doesn't accept these params */ })

    return { success: true }
}

// ============================================================
// Recipes — maps to Prisma ProductRecipe model
// ============================================================

export async function getRecipes(): Promise<Recipe[]> {
    const recipes = await prisma.productRecipe.findMany({
        include: { product: true, ingredient: true },
    })

    const grouped = new Map<string, Recipe>()
    for (const r of recipes) {
        const existing = grouped.get(r.productId) ?? {
            id: `rec-${r.productId.slice(0, 8)}`, productName: r.product.name, productId: r.productId,
            ingredients: [], totalCost: 0, notes: "",
        }
        const costPerUnit = Number(r.ingredient.costPerUnit)
        const qty = Number(r.quantity)
        existing.ingredients.push({
            materialId: r.ingredientId, materialName: r.ingredient.name,
            quantity: qty, unit: r.unit, costPerUnit,
        })
        existing.totalCost += qty * costPerUnit
        grouped.set(r.productId, existing)
    }
    return Array.from(grouped.values())
}

export async function createRecipe(data: Omit<Recipe, "id" | "totalCost">): Promise<Recipe> {
    let totalCost = 0
    for (const ing of data.ingredients) {
        totalCost += ing.quantity * ing.costPerUnit
        await prisma.productRecipe.upsert({
            where: { productId_ingredientId: { productId: data.productId, ingredientId: ing.materialId } },
            create: { productId: data.productId, ingredientId: ing.materialId, quantity: ing.quantity, unit: ing.unit },
            update: { quantity: ing.quantity, unit: ing.unit },
        })
    }
    return { ...data, id: `rec-${data.productId.slice(0, 8)}`, totalCost }
}

// ============================================================
// Auto Deduction on Sale
// ============================================================

export type DeductionResult = {
    success: boolean; productName: string; qtySold: number; totalIngredientCost: number
    deductions: { materialName: string; qtyUsed: number; unit: string; costPerUnit: number; subtotal: number; remainingStock: number; warning: string | null }[]
    errors: string[]
}

export async function deductRecipeIngredients(productId: string, qtySold: number): Promise<DeductionResult> {
    const recipeIngredients = await prisma.productRecipe.findMany({
        where: { productId },
        include: { ingredient: true, product: true },
    })

    if (recipeIngredients.length === 0) {
        return { success: false, productName: "", qtySold, totalIngredientCost: 0, deductions: [], errors: [`Không tìm thấy công thức cho productId: ${productId}`] }
    }

    const productName = recipeIngredients[0].product.name
    const deductions: DeductionResult["deductions"] = []
    const errors: string[] = []
    let totalCost = 0

    for (const ri of recipeIngredients) {
        const mat = ri.ingredient
        const qtyNeeded = Math.round(Number(ri.quantity) * qtySold * 1000) / 1000
        const current = Number(mat.currentStock)

        if (current < qtyNeeded) {
            errors.push(`${mat.name}: cần ${qtyNeeded}${ri.unit}, chỉ còn ${Math.round(current * 100) / 100}${ri.unit}`)
            continue
        }

        const newStock = Math.round((current - qtyNeeded) * 1000) / 1000
        await prisma.ingredient.update({ where: { id: mat.id }, data: { currentStock: newStock } })

        const costPerUnit = Number(mat.costPerUnit)
        const subtotal = qtyNeeded * costPerUnit
        totalCost += subtotal

        let warning: string | null = null
        if (newStock <= 0) warning = "Hết hàng! Cần nhập thêm."
        else if (newStock <= Number(mat.minStock)) warning = `Sắp hết (còn ${Math.round(newStock * 100) / 100}${mat.unit})`

        deductions.push({ materialName: mat.name, qtyUsed: qtyNeeded, unit: ri.unit, costPerUnit, subtotal, remainingStock: newStock, warning })
    }

    return { success: errors.length === 0, productName, qtySold, totalIngredientCost: totalCost, deductions, errors }
}

export async function getRecipeByProductId(productId: string): Promise<Recipe | null> {
    const rows = await prisma.productRecipe.findMany({
        where: { productId },
        include: { ingredient: true, product: true },
    })
    if (rows.length === 0) return null

    let totalCost = 0
    const ingredients = rows.map((r) => {
        const costPerUnit = Number(r.ingredient.costPerUnit)
        const qty = Number(r.quantity)
        totalCost += qty * costPerUnit
        return { materialId: r.ingredientId, materialName: r.ingredient.name, quantity: qty, unit: r.unit, costPerUnit }
    })

    return { id: `rec-${productId.slice(0, 8)}`, productName: rows[0].product.name, productId, ingredients, totalCost, notes: "" }
}
