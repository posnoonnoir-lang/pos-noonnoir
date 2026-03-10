"use server"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type EquipmentStatus = "ACTIVE" | "MAINTENANCE" | "RETIRED" | "DAMAGED"

export type Equipment = {
    id: string
    name: string
    code: string
    category: string
    quantity: number
    unitPrice: number
    totalValue: number
    purchaseDate: string
    poNumber: string | null
    usefulLifeMonths: number
    monthlyDepreciation: number
    accumulatedDepreciation: number
    netBookValue: number
    location: string
    status: EquipmentStatus
    notes: string
}

export type DepreciationEntry = {
    id: string
    equipmentId: string
    equipmentName: string
    month: string
    amount: number
    accumulatedBefore: number
    accumulatedAfter: number
    netBookValue: number
}

export type RawMaterial = {
    id: string
    name: string
    sku: string
    category: string
    unit: string
    currentStock: number
    minStock: number
    costPrice: number
    lastPurchasePrice: number
    expiryDate: string | null
    supplierId: string | null
    supplierName: string | null
    status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"
}

export type Recipe = {
    id: string
    productName: string
    productId: string
    ingredients: { materialId: string; materialName: string; quantity: number; unit: string; costPerUnit: number }[]
    totalCost: number
    notes: string
}

// --- Mock Equipment Data ---
const MOCK_EQUIPMENT: Equipment[] = [
    {
        id: "eq-1", name: "Ly Bordeaux Riedel", code: "CCDC-LY-001", category: "Ly & Cốc",
        quantity: 48, unitPrice: 350_000, totalValue: 16_800_000, purchaseDate: "2025-12-01",
        poNumber: "PO-2025-015", usefulLifeMonths: 24, monthlyDepreciation: 700_000,
        accumulatedDepreciation: 2_100_000, netBookValue: 14_700_000,
        location: "Quầy Bar", status: "ACTIVE", notes: "Ly uống rượu vang đỏ",
    },
    {
        id: "eq-2", name: "Decanter Crystal 1.5L", code: "CCDC-DC-001", category: "Dụng cụ Bar",
        quantity: 6, unitPrice: 1_200_000, totalValue: 7_200_000, purchaseDate: "2025-12-01",
        poNumber: "PO-2025-015", usefulLifeMonths: 36, monthlyDepreciation: 200_000,
        accumulatedDepreciation: 600_000, netBookValue: 6_600_000,
        location: "Quầy Bar", status: "ACTIVE", notes: "Bình decant rượu",
    },
    {
        id: "eq-3", name: "Máy rửa ly công nghiệp", code: "CCDC-MR-001", category: "Thiết bị",
        quantity: 1, unitPrice: 25_000_000, totalValue: 25_000_000, purchaseDate: "2025-10-15",
        poNumber: "PO-2025-008", usefulLifeMonths: 60, monthlyDepreciation: 416_667,
        accumulatedDepreciation: 2_083_335, netBookValue: 22_916_665,
        location: "Bếp", status: "ACTIVE", notes: "Winterhalter UC-L",
    },
    {
        id: "eq-4", name: "Tủ rượu Liebherr 200 chai", code: "CCDC-TR-001", category: "Thiết bị",
        quantity: 1, unitPrice: 45_000_000, totalValue: 45_000_000, purchaseDate: "2025-09-01",
        poNumber: "PO-2025-005", usefulLifeMonths: 84, monthlyDepreciation: 535_714,
        accumulatedDepreciation: 3_214_284, netBookValue: 41_785_716,
        location: "Hầm rượu", status: "ACTIVE", notes: "Tủ bảo quản nhiệt độ",
    },
    {
        id: "eq-5", name: "Khui rượu Laguiole", code: "CCDC-KR-001", category: "Dụng cụ Bar",
        quantity: 8, unitPrice: 450_000, totalValue: 3_600_000, purchaseDate: "2026-01-10",
        poNumber: "PO-2026-001", usefulLifeMonths: 24, monthlyDepreciation: 150_000,
        accumulatedDepreciation: 300_000, netBookValue: 3_300_000,
        location: "Quầy Bar", status: "ACTIVE", notes: "Khui rượu chuyên nghiệp",
    },
    {
        id: "eq-6", name: "Máy xay đá Blendtec", code: "CCDC-XD-001", category: "Thiết bị",
        quantity: 1, unitPrice: 12_000_000, totalValue: 12_000_000, purchaseDate: "2025-11-01",
        poNumber: "PO-2025-012", usefulLifeMonths: 48, monthlyDepreciation: 250_000,
        accumulatedDepreciation: 1_000_000, netBookValue: 11_000_000,
        location: "Quầy Bar", status: "ACTIVE", notes: "Xay đá cho cocktail",
    },
    {
        id: "eq-7", name: "Ly Champagne Flute", code: "CCDC-LY-002", category: "Ly & Cốc",
        quantity: 12, unitPrice: 280_000, totalValue: 3_360_000, purchaseDate: "2025-12-15",
        poNumber: "PO-2025-016", usefulLifeMonths: 18, monthlyDepreciation: 186_667,
        accumulatedDepreciation: 560_001, netBookValue: 2_799_999,
        location: "Quầy Bar", status: "ACTIVE", notes: "Ly champagne",
    },
    {
        id: "eq-8", name: "Bàn phục vụ gỗ sồi (cũ)", code: "CCDC-BN-001", category: "Nội thất",
        quantity: 2, unitPrice: 3_500_000, totalValue: 7_000_000, purchaseDate: "2024-06-01",
        poNumber: null, usefulLifeMonths: 60, monthlyDepreciation: 116_667,
        accumulatedDepreciation: 2_450_007, netBookValue: 4_549_993,
        location: "Phòng VIP", status: "MAINTENANCE", notes: "Cần sửa chân bàn",
    },
]

const MOCK_DEPRECIATION: DepreciationEntry[] = [
    { id: "dep-1", equipmentId: "eq-1", equipmentName: "Ly Bordeaux Riedel", month: "2026-01", amount: 700_000, accumulatedBefore: 700_000, accumulatedAfter: 1_400_000, netBookValue: 15_400_000 },
    { id: "dep-2", equipmentId: "eq-1", equipmentName: "Ly Bordeaux Riedel", month: "2026-02", amount: 700_000, accumulatedBefore: 1_400_000, accumulatedAfter: 2_100_000, netBookValue: 14_700_000 },
    { id: "dep-3", equipmentId: "eq-3", equipmentName: "Máy rửa ly công nghiệp", month: "2026-01", amount: 416_667, accumulatedBefore: 1_250_001, accumulatedAfter: 1_666_668, netBookValue: 23_333_332 },
    { id: "dep-4", equipmentId: "eq-3", equipmentName: "Máy rửa ly công nghiệp", month: "2026-02", amount: 416_667, accumulatedBefore: 1_666_668, accumulatedAfter: 2_083_335, netBookValue: 22_916_665 },
    { id: "dep-5", equipmentId: "eq-4", equipmentName: "Tủ rượu Liebherr 200 chai", month: "2026-01", amount: 535_714, accumulatedBefore: 2_142_856, accumulatedAfter: 2_678_570, netBookValue: 42_321_430 },
    { id: "dep-6", equipmentId: "eq-4", equipmentName: "Tủ rượu Liebherr 200 chai", month: "2026-02", amount: 535_714, accumulatedBefore: 2_678_570, accumulatedAfter: 3_214_284, netBookValue: 41_785_716 },
]

// --- Mock Raw Materials Data ---
const MOCK_MATERIALS: RawMaterial[] = [
    { id: "mat-1", name: "Phô mai Gouda", sku: "NPL-PM-01", category: "Phô mai", unit: "kg", currentStock: 3.5, minStock: 2, costPrice: 320_000, lastPurchasePrice: 320_000, expiryDate: "2026-03-25", supplierId: "sup-2", supplierName: "Phú Hưng Foods", status: "IN_STOCK" },
    { id: "mat-2", name: "Phô mai Brie", sku: "NPL-PM-02", category: "Phô mai", unit: "kg", currentStock: 1.2, minStock: 1.5, costPrice: 450_000, lastPurchasePrice: 450_000, expiryDate: "2026-03-20", supplierId: "sup-2", supplierName: "Phú Hưng Foods", status: "LOW_STOCK" },
    { id: "mat-3", name: "Jamón Serrano", sku: "NPL-TH-01", category: "Thịt nguội", unit: "kg", currentStock: 2.0, minStock: 1, costPrice: 580_000, lastPurchasePrice: 580_000, expiryDate: "2026-03-18", supplierId: "sup-2", supplierName: "Phú Hưng Foods", status: "IN_STOCK" },
    { id: "mat-4", name: "Salami Milano", sku: "NPL-TH-02", category: "Thịt nguội", unit: "kg", currentStock: 0.8, minStock: 1, costPrice: 420_000, lastPurchasePrice: 420_000, expiryDate: "2026-03-22", supplierId: "sup-2", supplierName: "Phú Hưng Foods", status: "LOW_STOCK" },
    { id: "mat-5", name: "Ô-liu xanh Tây Ban Nha", sku: "NPL-OL-01", category: "Gia vị & Phụ liệu", unit: "hũ", currentStock: 5, minStock: 3, costPrice: 85_000, lastPurchasePrice: 85_000, expiryDate: "2026-06-15", supplierId: "sup-2", supplierName: "Phú Hưng Foods", status: "IN_STOCK" },
    { id: "mat-6", name: "Dầu Truffle trắng", sku: "NPL-DT-01", category: "Gia vị & Phụ liệu", unit: "chai", currentStock: 1, minStock: 2, costPrice: 320_000, lastPurchasePrice: 320_000, expiryDate: "2026-04-15", supplierId: "sup-2", supplierName: "Phú Hưng Foods", status: "LOW_STOCK" },
    { id: "mat-7", name: "Khoai tây đông lạnh", sku: "NPL-KT-01", category: "Rau củ", unit: "kg", currentStock: 8, minStock: 5, costPrice: 45_000, lastPurchasePrice: 45_000, expiryDate: "2026-06-10", supplierId: "sup-2", supplierName: "Phú Hưng Foods", status: "IN_STOCK" },
    { id: "mat-8", name: "Bánh mì Baguette", sku: "NPL-BM-01", category: "Bánh", unit: "ổ", currentStock: 0, minStock: 10, costPrice: 12_000, lastPurchasePrice: 12_000, expiryDate: "2026-03-11", supplierId: "sup-2", supplierName: "Phú Hưng Foods", status: "OUT_OF_STOCK" },
    { id: "mat-9", name: "Mật ong hoa rừng", sku: "NPL-MO-01", category: "Gia vị & Phụ liệu", unit: "chai", currentStock: 3, minStock: 2, costPrice: 120_000, lastPurchasePrice: 120_000, expiryDate: "2027-01-01", supplierId: null, supplierName: null, status: "IN_STOCK" },
    { id: "mat-10", name: "Hạt óc chó", sku: "NPL-HC-01", category: "Hạt & Dried fruit", unit: "kg", currentStock: 1.5, minStock: 1, costPrice: 350_000, lastPurchasePrice: 350_000, expiryDate: "2026-09-01", supplierId: null, supplierName: null, status: "IN_STOCK" },
]

const MOCK_RECIPES: Recipe[] = [
    {
        id: "rec-1", productName: "Cheese Board", productId: "prod-9",
        ingredients: [
            { materialId: "mat-1", materialName: "Phô mai Gouda", quantity: 0.1, unit: "kg", costPerUnit: 320_000 },
            { materialId: "mat-2", materialName: "Phô mai Brie", quantity: 0.08, unit: "kg", costPerUnit: 450_000 },
            { materialId: "mat-3", materialName: "Jamón Serrano", quantity: 0.05, unit: "kg", costPerUnit: 580_000 },
            { materialId: "mat-5", materialName: "Ô-liu xanh Tây Ban Nha", quantity: 0.2, unit: "hũ", costPerUnit: 85_000 },
            { materialId: "mat-10", materialName: "Hạt óc chó", quantity: 0.03, unit: "kg", costPerUnit: 350_000 },
            { materialId: "mat-9", materialName: "Mật ong hoa rừng", quantity: 0.05, unit: "chai", costPerUnit: 120_000 },
        ],
        totalCost: 32_000 + 36_000 + 29_000 + 17_000 + 10_500 + 6_000,
        notes: "Đĩa phô mai 3 loại kèm Jamón, ô-liu, hạt, mật ong",
    },
    {
        id: "rec-2", productName: "Truffle Fries", productId: "prod-12",
        ingredients: [
            { materialId: "mat-7", materialName: "Khoai tây đông lạnh", quantity: 0.2, unit: "kg", costPerUnit: 45_000 },
            { materialId: "mat-6", materialName: "Dầu Truffle trắng", quantity: 0.02, unit: "chai", costPerUnit: 320_000 },
        ],
        totalCost: 9_000 + 6_400,
        notes: "Khoai tây chiên xốt truffle",
    },
    {
        id: "rec-3", productName: "Bruschetta", productId: "prod-11",
        ingredients: [
            { materialId: "mat-8", materialName: "Bánh mì Baguette", quantity: 2, unit: "ổ", costPerUnit: 12_000 },
            { materialId: "mat-3", materialName: "Jamón Serrano", quantity: 0.04, unit: "kg", costPerUnit: 580_000 },
            { materialId: "mat-5", materialName: "Ô-liu xanh Tây Ban Nha", quantity: 0.1, unit: "hũ", costPerUnit: 85_000 },
        ],
        totalCost: 24_000 + 23_200 + 8_500,
        notes: "Bruschetta kiểu Ý",
    },
]

// --- Equipment CRUD ---
export async function getEquipment(): Promise<Equipment[]> {
    await delay(120)
    return [...MOCK_EQUIPMENT]
}

export async function getEquipmentStats() {
    await delay(80)
    const active = MOCK_EQUIPMENT.filter((e) => e.status === "ACTIVE")
    return {
        totalItems: MOCK_EQUIPMENT.length,
        activeItems: active.length,
        totalOriginalValue: MOCK_EQUIPMENT.reduce((s, e) => s + e.totalValue, 0),
        totalAccumulatedDep: MOCK_EQUIPMENT.reduce((s, e) => s + e.accumulatedDepreciation, 0),
        totalNetBookValue: MOCK_EQUIPMENT.reduce((s, e) => s + e.netBookValue, 0),
        monthlyDepTotal: MOCK_EQUIPMENT.filter((e) => e.status === "ACTIVE").reduce((s, e) => s + e.monthlyDepreciation, 0),
        maintenanceCount: MOCK_EQUIPMENT.filter((e) => e.status === "MAINTENANCE").length,
        categories: [...new Set(MOCK_EQUIPMENT.map((e) => e.category))].length,
    }
}

export async function getDepreciationHistory(): Promise<DepreciationEntry[]> {
    await delay(100)
    return [...MOCK_DEPRECIATION].sort((a, b) => b.month.localeCompare(a.month))
}

// --- Auto Monthly Depreciation ---
export type DepreciationRunResult = {
    success: boolean
    month: string
    entriesCreated: number
    totalDepreciation: number
    entries: { equipmentName: string; amount: number; newNBV: number; fullyDepreciated: boolean }[]
    skipped: { equipmentName: string; reason: string }[]
}

export async function runMonthlyDepreciation(month?: string): Promise<DepreciationRunResult> {
    await delay(200)

    const targetMonth = month ?? new Date().toISOString().slice(0, 7) // "2026-03"

    // Check if already run
    const alreadyRun = MOCK_DEPRECIATION.filter((d) => d.month === targetMonth)
    if (alreadyRun.length > 0) {
        return {
            success: false,
            month: targetMonth,
            entriesCreated: 0,
            totalDepreciation: 0,
            entries: [],
            skipped: [{ equipmentName: "ALL", reason: `Tháng ${targetMonth} đã chạy khấu hao (${alreadyRun.length} entries)` }],
        }
    }

    const entries: DepreciationRunResult["entries"] = []
    const skipped: DepreciationRunResult["skipped"] = []
    let totalDep = 0

    for (const eq of MOCK_EQUIPMENT) {
        if (eq.status !== "ACTIVE") {
            skipped.push({ equipmentName: eq.name, reason: `Trạng thái: ${eq.status}` })
            continue
        }

        if (eq.netBookValue <= 0) {
            skipped.push({ equipmentName: eq.name, reason: "Đã khấu hao xong (NBV = 0)" })
            continue
        }

        // Calculate depreciation (cap at remaining NBV)
        const depAmount = Math.min(eq.monthlyDepreciation, eq.netBookValue)
        const accBefore = eq.accumulatedDepreciation
        eq.accumulatedDepreciation += depAmount
        eq.netBookValue -= depAmount

        const fullyDepreciated = eq.netBookValue <= 0
        if (fullyDepreciated) {
            eq.netBookValue = 0
            eq.status = "RETIRED"
        }

        // Create entry
        const entry: DepreciationEntry = {
            id: `dep-${Date.now()}-${eq.id}`,
            equipmentId: eq.id,
            equipmentName: eq.name,
            month: targetMonth,
            amount: depAmount,
            accumulatedBefore: accBefore,
            accumulatedAfter: eq.accumulatedDepreciation,
            netBookValue: eq.netBookValue,
        }
        MOCK_DEPRECIATION.push(entry)
        totalDep += depAmount

        entries.push({
            equipmentName: eq.name,
            amount: depAmount,
            newNBV: eq.netBookValue,
            fullyDepreciated,
        })
    }

    return {
        success: true,
        month: targetMonth,
        entriesCreated: entries.length,
        totalDepreciation: totalDep,
        entries,
        skipped,
    }
}

export async function createEquipment(
    data: Omit<Equipment, "id" | "accumulatedDepreciation" | "netBookValue" | "monthlyDepreciation">
): Promise<Equipment> {
    await delay(200)
    const monthlyDep = Math.round(data.totalValue / data.usefulLifeMonths)
    const eq: Equipment = {
        ...data, id: `eq-${Date.now()}`,
        monthlyDepreciation: monthlyDep, accumulatedDepreciation: 0, netBookValue: data.totalValue,
    }
    MOCK_EQUIPMENT.push(eq)
    return eq
}

export async function updateEquipmentStatus(id: string, status: EquipmentStatus): Promise<{ success: boolean }> {
    await delay(100)
    const eq = MOCK_EQUIPMENT.find((e) => e.id === id)
    if (!eq) return { success: false }
    eq.status = status
    return { success: true }
}

// --- Raw Materials ---
export async function getRawMaterials(): Promise<RawMaterial[]> {
    await delay(120)
    return [...MOCK_MATERIALS]
}

export async function getRawMaterialStats() {
    await delay(80)
    return {
        totalItems: MOCK_MATERIALS.length,
        inStock: MOCK_MATERIALS.filter((m) => m.status === "IN_STOCK").length,
        lowStock: MOCK_MATERIALS.filter((m) => m.status === "LOW_STOCK").length,
        outOfStock: MOCK_MATERIALS.filter((m) => m.status === "OUT_OF_STOCK").length,
        totalValue: MOCK_MATERIALS.reduce((s, m) => s + m.costPrice * m.currentStock, 0),
        expiringSoon: MOCK_MATERIALS.filter((m) => {
            if (!m.expiryDate) return false
            const days = (new Date(m.expiryDate).getTime() - Date.now()) / 86400000
            return days > 0 && days <= 7
        }).length,
        categories: [...new Set(MOCK_MATERIALS.map((m) => m.category))].length,
    }
}

export async function adjustRawMaterial(
    id: string, type: "IN" | "OUT" | "WASTE", quantity: number, reason: string
): Promise<{ success: boolean; error?: string }> {
    await delay(150)
    const mat = MOCK_MATERIALS.find((m) => m.id === id)
    if (!mat) return { success: false, error: "Không tìm thấy NPL" }

    if (type === "IN") {
        mat.currentStock += quantity
    } else {
        if (mat.currentStock < quantity) return { success: false, error: "Không đủ tồn kho" }
        mat.currentStock -= quantity
    }

    if (mat.currentStock === 0) mat.status = "OUT_OF_STOCK"
    else if (mat.currentStock <= mat.minStock) mat.status = "LOW_STOCK"
    else mat.status = "IN_STOCK"

    return { success: true }
}

// --- Recipes ---
export async function getRecipes(): Promise<Recipe[]> {
    await delay(100)
    return [...MOCK_RECIPES]
}

export async function createRecipe(data: Omit<Recipe, "id" | "totalCost">): Promise<Recipe> {
    await delay(150)
    const totalCost = data.ingredients.reduce((s, i) => s + i.quantity * i.costPerUnit, 0)
    const recipe: Recipe = { ...data, id: `rec-${Date.now()}`, totalCost }
    MOCK_RECIPES.push(recipe)
    return recipe
}

// --- Auto Deduction on Sale ---
export type DeductionResult = {
    success: boolean
    productName: string
    qtySold: number
    totalIngredientCost: number
    deductions: { materialName: string; qtyUsed: number; unit: string; costPerUnit: number; subtotal: number; remainingStock: number; warning: string | null }[]
    errors: string[]
}

export async function deductRecipeIngredients(
    productId: string,
    qtySold: number
): Promise<DeductionResult> {
    await delay(150)

    const recipe = MOCK_RECIPES.find((r) => r.productId === productId)
    if (!recipe) return { success: false, productName: "", qtySold, totalIngredientCost: 0, deductions: [], errors: [`Không tìm thấy công thức cho productId: ${productId}`] }

    const deductions: DeductionResult["deductions"] = []
    const errors: string[] = []
    let totalCost = 0

    for (const ing of recipe.ingredients) {
        const mat = MOCK_MATERIALS.find((m) => m.id === ing.materialId)
        if (!mat) {
            errors.push(`NPL không tồn tại: ${ing.materialName}`)
            continue
        }

        const qtyNeeded = Math.round(ing.quantity * qtySold * 1000) / 1000
        if (mat.currentStock < qtyNeeded) {
            errors.push(`${mat.name}: cần ${qtyNeeded}${ing.unit}, chỉ còn ${Math.round(mat.currentStock * 100) / 100}${ing.unit}`)
            continue
        }

        mat.currentStock = Math.round((mat.currentStock - qtyNeeded) * 1000) / 1000
        const subtotal = qtyNeeded * ing.costPerUnit
        totalCost += subtotal

        // Update status
        if (mat.currentStock === 0) mat.status = "OUT_OF_STOCK"
        else if (mat.currentStock <= mat.minStock) mat.status = "LOW_STOCK"
        else mat.status = "IN_STOCK"

        let warning: string | null = null
        if (mat.status === "OUT_OF_STOCK") warning = "Hết hàng! Cần nhập thêm."
        else if (mat.status === "LOW_STOCK") warning = `Sắp hết (còn ${Math.round(mat.currentStock * 100) / 100}${mat.unit})`

        deductions.push({
            materialName: mat.name,
            qtyUsed: qtyNeeded,
            unit: ing.unit,
            costPerUnit: ing.costPerUnit,
            subtotal,
            remainingStock: mat.currentStock,
            warning,
        })
    }

    return {
        success: errors.length === 0,
        productName: recipe.productName,
        qtySold,
        totalIngredientCost: totalCost,
        deductions,
        errors,
    }
}

// --- Get Recipe by productId ---
export async function getRecipeByProductId(productId: string): Promise<Recipe | null> {
    await delay(50)
    return MOCK_RECIPES.find((r) => r.productId === productId) ?? null
}
