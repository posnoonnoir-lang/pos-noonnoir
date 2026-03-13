/**
 * Public Menu API — available without authentication
 * GET /api/public/menu             — Full menu with categories
 * GET /api/public/menu?category=id — Filter by category
 * GET /api/public/menu?type=WINE_BOTTLE — Filter by product type
 * GET /api/public/menu?q=search    — Search by name
 *
 * Used for: Website integration, GrabFood sync, QR menu display
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const CACHE_HEADERS = {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
}

export async function GET(request: NextRequest) {
    try {
        const params = request.nextUrl.searchParams
        const categoryId = params.get("category")
        const type = params.get("type")
        const search = params.get("q")

        // Build product filter
        const where: Record<string, unknown> = { isActive: true }
        if (categoryId) where.categoryId = categoryId
        if (type) where.type = type
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { nameVi: { contains: search, mode: "insensitive" } },
            ]
        }

        // Fetch categories and products in parallel
        const [categories, products, storeSettings] = await Promise.all([
            prisma.category.findMany({
                where: { isActive: true },
                select: { id: true, name: true, nameVi: true, icon: true, sortOrder: true },
                orderBy: { sortOrder: "asc" },
            }),
            prisma.product.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    nameVi: true,
                    categoryId: true,
                    type: true,
                    sellPrice: true,
                    glassPrice: true,
                    isByGlass: true,
                    imageUrl: true,
                    description: true,
                    // Wine-specific
                    vintage: true,
                    appellation: true,
                    grapeVariety: true,
                    country: true,
                    region: true,
                    alcoholPct: true,
                    tastingNotes: true,
                    servingTemp: true,
                    glassType: true,
                },
                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            }),
            prisma.storeSettings.findFirst({
                select: { storeName: true, tagline: true, currency: true },
            }),
        ])

        // Get stock for wine products (public — simplified)
        const wineProductIds = products
            .filter((p) => ["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"].includes(p.type))
            .map((p) => p.id)

        const stockCounts = wineProductIds.length > 0
            ? await prisma.wineBottle.groupBy({
                by: ["productId"],
                where: { productId: { in: wineProductIds }, status: { in: ["IN_STOCK", "OPENED"] } },
                _count: true,
            })
            : []
        const stockMap = new Map(stockCounts.map((s) => [s.productId, s._count]))

        // Check 86 (out-of-stock) products
        const outOfStock = await prisma.out86.findMany({
            select: { productId: true },
        })
        const outOfStockIds = new Set(outOfStock.map((o) => o.productId))

        // Format response
        const menuCategories = categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            nameVi: cat.nameVi,
            icon: cat.icon,
            sortOrder: cat.sortOrder,
            products: products
                .filter((p) => p.categoryId === cat.id)
                .map((p) => ({
                    id: p.id,
                    name: p.name,
                    nameVi: p.nameVi,
                    type: p.type,
                    price: Number(p.sellPrice),
                    glassPrice: p.isByGlass ? Number(p.glassPrice ?? 0) : null,
                    imageUrl: p.imageUrl,
                    description: p.description,
                    available: !outOfStockIds.has(p.id),
                    inStock: stockMap.get(p.id) ?? null,
                    // Wine details
                    wine: ["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"].includes(p.type)
                        ? {
                            vintage: p.vintage,
                            appellation: p.appellation,
                            grape: p.grapeVariety,
                            country: p.country,
                            region: p.region,
                            alcohol: p.alcoholPct ? Number(p.alcoholPct) : null,
                            tastingNotes: p.tastingNotes,
                            servingTemp: p.servingTemp,
                            glassType: p.glassType,
                        }
                        : null,
                })),
        }))

        return NextResponse.json(
            {
                store: {
                    name: storeSettings?.storeName ?? "Noon & Noir Wine Alley",
                    tagline: storeSettings?.tagline ?? "",
                    currency: storeSettings?.currency ?? "VND",
                },
                categories: menuCategories,
                meta: {
                    totalProducts: products.length,
                    totalCategories: categories.length,
                    generatedAt: new Date().toISOString(),
                },
            },
            { headers: CACHE_HEADERS }
        )
    } catch (err) {
        console.error("[Public Menu] Error:", err)
        return NextResponse.json(
            { error: "Failed to load menu" },
            { status: 500 }
        )
    }
}
