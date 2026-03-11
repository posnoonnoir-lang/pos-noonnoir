"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { ActionResult, Category, Product, CategoryFormData, ProductFormData } from "@/types"
import type { Prisma } from "@prisma/client"
import { serializeProduct } from "@/lib/product-serializer"

// ============================================================
// CATEGORY ACTIONS
// ============================================================

export async function getCategories(): Promise<Category[]> {
    const cats = await prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: true } } },
    })
    return cats as Category[]
}

export async function createCategory(data: CategoryFormData): Promise<ActionResult<Category>> {
    try {
        const count = await prisma.category.count()
        const cat = await prisma.category.create({
            data: {
                name: data.name,
                nameVi: data.nameVi,
                icon: data.icon,
                sortOrder: data.sortOrder ?? count,
                isActive: data.isActive ?? true,
            },
            include: { _count: { select: { products: true } } },
        })
        revalidatePath("/dashboard/menu")
        return { success: true, data: cat as Category }
    } catch {
        return { success: false, error: { code: "ERR_CREATE", message: "Không thể tạo danh mục" } }
    }
}

export async function updateCategory(id: string, data: Partial<CategoryFormData>): Promise<ActionResult<Category>> {
    try {
        const cat = await prisma.category.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.nameVi !== undefined && { nameVi: data.nameVi }),
                ...(data.icon !== undefined && { icon: data.icon }),
                ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
            include: { _count: { select: { products: true } } },
        })
        revalidatePath("/dashboard/menu")
        return { success: true, data: cat as Category }
    } catch {
        return { success: false, error: { code: "ERR_NOT_FOUND", message: "Category not found" } }
    }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
    const hasProducts = await prisma.product.count({ where: { categoryId: id } })
    if (hasProducts > 0) {
        return { success: false, error: { code: "ERR_VALIDATION", message: "Không thể xóa danh mục có sản phẩm" } }
    }
    try {
        await prisma.category.delete({ where: { id } })
        revalidatePath("/dashboard/menu")
        return { success: true }
    } catch {
        return { success: false, error: { code: "ERR_NOT_FOUND", message: "Category not found" } }
    }
}

export async function reorderCategories(orderedIds: string[]): Promise<ActionResult> {
    try {
        await prisma.$transaction(
            orderedIds.map((id, index) =>
                prisma.category.update({ where: { id }, data: { sortOrder: index } })
            )
        )
        revalidatePath("/dashboard/menu")
        return { success: true }
    } catch {
        return { success: false, error: { code: "ERR_REORDER", message: "Không thể sắp xếp lại" } }
    }
}

// ============================================================
// PRODUCT ACTIONS
// ============================================================

export async function getProducts(filters?: {
    categoryId?: string
    type?: string
    search?: string
    isActive?: boolean
}): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {}

    if (filters?.categoryId) where.categoryId = filters.categoryId
    if (filters?.type) where.type = filters.type as Prisma.EnumProductTypeFilter["equals"]
    if (filters?.isActive !== undefined) where.isActive = filters.isActive
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { nameVi: { contains: filters.search, mode: "insensitive" } },
            { sku: { contains: filters.search, mode: "insensitive" } },
        ]
    }

    const products = await prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { sortOrder: "asc" },
    })

    return products.map((p) => serializeProduct(p))
}

export async function getProductById(id: string): Promise<ActionResult<Product>> {
    const product = await prisma.product.findUnique({
        where: { id },
        include: { category: true, taxRate: true },
    })
    if (!product) return { success: false, error: { code: "ERR_NOT_FOUND", message: "Product not found" } }
    return { success: true, data: serializeProduct(product) }
}

export async function createProduct(data: ProductFormData): Promise<ActionResult<Product>> {
    try {
        const count = await prisma.product.count()
        const product = await prisma.product.create({
            data: {
                name: data.name,
                nameVi: data.nameVi,
                sku: data.sku,
                categoryId: data.categoryId,
                type: data.type,
                taxRateId: data.taxRateId,
                vintage: data.vintage,
                appellation: data.appellation,
                grapeVariety: data.grapeVariety,
                country: data.country,
                region: data.region,
                alcoholPct: data.alcoholPct,
                tastingNotes: data.tastingNotes,
                costPrice: data.costPrice,
                sellPrice: data.sellPrice,
                glassPrice: data.glassPrice,
                isByGlass: data.isByGlass ?? false,
                glassesPerBottle: data.glassesPerBottle ?? 0,
                tastingPortions: data.tastingPortions ?? 0,
                servingTemp: data.servingTemp,
                decantingTime: data.decantingTime,
                glassType: data.glassType,
                trackInventory: data.trackInventory ?? true,
                lowStockAlert: data.lowStockAlert ?? 5,
                imageUrl: data.imageUrl,
                description: data.description,
                isActive: data.isActive ?? true,
                sortOrder: count,
            },
            include: { category: true },
        })
        revalidatePath("/dashboard/menu")
        return { success: true, data: serializeProduct(product) }
    } catch {
        return { success: false, error: { code: "ERR_CREATE", message: "Không thể tạo sản phẩm" } }
    }
}

export async function updateProduct(id: string, data: Partial<ProductFormData>): Promise<ActionResult<Product>> {
    try {
        const product = await prisma.product.update({
            where: { id },
            data: data as Prisma.ProductUpdateInput,
            include: { category: true },
        })
        revalidatePath("/dashboard/menu")
        return { success: true, data: serializeProduct(product) }
    } catch {
        return { success: false, error: { code: "ERR_NOT_FOUND", message: "Product not found" } }
    }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
    try {
        await prisma.product.update({ where: { id }, data: { isActive: false } })
        revalidatePath("/dashboard/menu")
        return { success: true }
    } catch {
        return { success: false, error: { code: "ERR_NOT_FOUND", message: "Product not found" } }
    }
}

export async function toggleProductActive(id: string): Promise<ActionResult<Product>> {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return { success: false, error: { code: "ERR_NOT_FOUND", message: "Product not found" } }

    const updated = await prisma.product.update({
        where: { id },
        data: { isActive: !product.isActive },
        include: { category: true },
    })
    revalidatePath("/dashboard/menu")
    return { success: true, data: serializeProduct(updated) }
}
