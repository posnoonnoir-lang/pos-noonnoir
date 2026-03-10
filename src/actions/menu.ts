"use server"

import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "@/lib/mock-data"
import type { ActionResult, Category, Product, CategoryFormData, ProductFormData } from "@/types"

// ============================================================
// CATEGORY ACTIONS (Mock — replace with Prisma queries later)
// ============================================================

export async function getCategories(): Promise<Category[]> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 200))
    return [...MOCK_CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function createCategory(data: CategoryFormData): Promise<ActionResult<Category>> {
    await new Promise((r) => setTimeout(r, 300))

    const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: data.name,
        nameVi: data.nameVi ?? null,
        icon: data.icon ?? null,
        sortOrder: data.sortOrder ?? MOCK_CATEGORIES.length,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { products: 0 },
    }

    MOCK_CATEGORIES.push(newCat)

    return { success: true, data: newCat }
}

export async function updateCategory(id: string, data: Partial<CategoryFormData>): Promise<ActionResult<Category>> {
    await new Promise((r) => setTimeout(r, 300))

    const idx = MOCK_CATEGORIES.findIndex((c) => c.id === id)
    if (idx === -1) return { success: false, error: { code: "ERR_NOT_FOUND", message: "Category not found" } }

    MOCK_CATEGORIES[idx] = {
        ...MOCK_CATEGORIES[idx],
        ...data,
        nameVi: data.nameVi ?? MOCK_CATEGORIES[idx].nameVi,
        icon: data.icon ?? MOCK_CATEGORIES[idx].icon,
        updatedAt: new Date(),
    }

    return { success: true, data: MOCK_CATEGORIES[idx] }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
    await new Promise((r) => setTimeout(r, 300))

    const idx = MOCK_CATEGORIES.findIndex((c) => c.id === id)
    if (idx === -1) return { success: false, error: { code: "ERR_NOT_FOUND", message: "Category not found" } }

    const hasProducts = MOCK_PRODUCTS.some((p) => p.categoryId === id)
    if (hasProducts) {
        return {
            success: false,
            error: { code: "ERR_VALIDATION", message: "Không thể xóa danh mục có sản phẩm" },
        }
    }

    MOCK_CATEGORIES.splice(idx, 1)
    return { success: true }
}

export async function reorderCategories(orderedIds: string[]): Promise<ActionResult> {
    await new Promise((r) => setTimeout(r, 200))

    orderedIds.forEach((id, index) => {
        const cat = MOCK_CATEGORIES.find((c) => c.id === id)
        if (cat) cat.sortOrder = index
    })

    return { success: true }
}

// ============================================================
// PRODUCT ACTIONS (Mock — replace with Prisma queries later)
// ============================================================

export async function getProducts(filters?: {
    categoryId?: string
    type?: string
    search?: string
    isActive?: boolean
}): Promise<Product[]> {
    await new Promise((r) => setTimeout(r, 200))

    let products = [...MOCK_PRODUCTS]

    if (filters?.categoryId) {
        products = products.filter((p) => p.categoryId === filters.categoryId)
    }
    if (filters?.type) {
        products = products.filter((p) => p.type === filters.type)
    }
    if (filters?.search) {
        const q = filters.search.toLowerCase()
        products = products.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.nameVi?.toLowerCase().includes(q) ||
                p.sku?.toLowerCase().includes(q)
        )
    }
    if (filters?.isActive !== undefined) {
        products = products.filter((p) => p.isActive === filters.isActive)
    }

    // Attach category info
    return products.map((p) => ({
        ...p,
        category: MOCK_CATEGORIES.find((c) => c.id === p.categoryId),
    }))
}

export async function getProductById(id: string): Promise<ActionResult<Product>> {
    await new Promise((r) => setTimeout(r, 200))

    const product = MOCK_PRODUCTS.find((p) => p.id === id)
    if (!product) return { success: false, error: { code: "ERR_NOT_FOUND", message: "Product not found" } }

    return {
        success: true,
        data: { ...product, category: MOCK_CATEGORIES.find((c) => c.id === product.categoryId) },
    }
}

export async function createProduct(data: ProductFormData): Promise<ActionResult<Product>> {
    await new Promise((r) => setTimeout(r, 400))

    const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: data.name,
        nameVi: data.nameVi ?? null,
        sku: data.sku ?? null,
        categoryId: data.categoryId,
        type: data.type,
        taxRateId: data.taxRateId ?? null,
        vintage: data.vintage ?? null,
        appellation: data.appellation ?? null,
        grapeVariety: data.grapeVariety ?? null,
        country: data.country ?? null,
        region: data.region ?? null,
        alcoholPct: data.alcoholPct ?? null,
        tastingNotes: data.tastingNotes ?? null,
        costPrice: data.costPrice,
        sellPrice: data.sellPrice,
        glassPrice: data.glassPrice ?? null,
        isByGlass: data.isByGlass ?? false,
        glassesPerBottle: data.glassesPerBottle ?? 0,
        tastingPortions: data.tastingPortions ?? 0,
        servingTemp: data.servingTemp ?? null,
        decantingTime: data.decantingTime ?? null,
        glassType: data.glassType ?? null,
        trackInventory: data.trackInventory ?? true,
        lowStockAlert: data.lowStockAlert ?? 5,
        imageUrl: data.imageUrl ?? null,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
        sortOrder: MOCK_PRODUCTS.length,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    MOCK_PRODUCTS.push(newProduct)
    return { success: true, data: newProduct }
}

export async function updateProduct(id: string, data: Partial<ProductFormData>): Promise<ActionResult<Product>> {
    await new Promise((r) => setTimeout(r, 400))

    const idx = MOCK_PRODUCTS.findIndex((p) => p.id === id)
    if (idx === -1) return { success: false, error: { code: "ERR_NOT_FOUND", message: "Product not found" } }

    MOCK_PRODUCTS[idx] = {
        ...MOCK_PRODUCTS[idx],
        ...data,
        nameVi: data.nameVi ?? MOCK_PRODUCTS[idx].nameVi,
        updatedAt: new Date(),
    } as Product

    return { success: true, data: MOCK_PRODUCTS[idx] }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
    await new Promise((r) => setTimeout(r, 300))

    const idx = MOCK_PRODUCTS.findIndex((p) => p.id === id)
    if (idx === -1) return { success: false, error: { code: "ERR_NOT_FOUND", message: "Product not found" } }

    MOCK_PRODUCTS.splice(idx, 1)
    return { success: true }
}

export async function toggleProductActive(id: string): Promise<ActionResult<Product>> {
    await new Promise((r) => setTimeout(r, 200))

    const product = MOCK_PRODUCTS.find((p) => p.id === id)
    if (!product) return { success: false, error: { code: "ERR_NOT_FOUND", message: "Product not found" } }

    product.isActive = !product.isActive
    product.updatedAt = new Date()

    return { success: true, data: product }
}
