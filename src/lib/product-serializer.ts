// Product serialization helpers (non-server-action)
import type { Prisma } from "@prisma/client"
import type { Category, Product } from "@/types"

export function toNum(val: Prisma.Decimal | null | undefined): number | null {
    if (val === null || val === undefined) return null
    return Number(val)
}

export function serializeProduct(p: Record<string, unknown> & { category?: unknown }): Product {
    if (!p) throw new Error("Product not found")
    return {
        ...p,
        costPrice: Number(p.costPrice),
        sellPrice: Number(p.sellPrice),
        glassPrice: toNum(p.glassPrice as Prisma.Decimal | null | undefined),
        alcoholPct: toNum(p.alcoholPct as Prisma.Decimal | null | undefined),
        sortOrder: p.sortOrder as number,
        category: p.category as Category | undefined,
    } as Product
}
