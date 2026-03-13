/**
 * Report Export API — generates CSV reports for revenue, consignment, waste, and inventory
 * GET /api/export/report?type=revenue&dateFrom=2024-01-01&dateTo=2024-01-31
 *
 * Supported types: revenue, consignment, waste, payroll, inventory, forecast
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const BOM = "\uFEFF"

function formatVND(n: number): string {
    return n.toLocaleString("vi-VN")
}

function toCSV(headers: string[], rows: string[][]): string {
    const headerLine = headers.join(",")
    const dataLines = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    return BOM + headerLine + "\n" + dataLines.join("\n")
}

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams
    const type = params.get("type") ?? "revenue"
    const dateFrom = params.get("dateFrom") ?? new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]
    const dateTo = params.get("dateTo") ?? new Date().toISOString().split("T")[0]
    const start = new Date(dateFrom)
    const end = new Date(dateTo + "T23:59:59")

    try {
        let csv = ""
        let filename = ""

        switch (type) {
            case "revenue": {
                const orders = await prisma.order.findMany({
                    where: { createdAt: { gte: start, lte: end }, status: { in: ["PAID", "COMPLETED"] } },
                    include: { items: { include: { product: true } }, payments: true, staff: true, table: true },
                    orderBy: { createdAt: "desc" },
                })

                const headers = ["Mã HĐ", "Ngày", "Giờ", "Bàn", "Nhân viên", "Sản phẩm", "SL", "Đơn giá", "Thành tiền", "Giảm giá", "Thuế", "Tổng", "Thanh toán"]
                const rows: string[][] = []

                for (const o of orders) {
                    for (const item of o.items) {
                        rows.push([
                            o.orderNo,
                            o.createdAt.toLocaleDateString("vi-VN"),
                            o.createdAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
                            o.table?.tableNumber ?? "N/A",
                            o.staff.fullName,
                            item.product.name,
                            String(item.quantity),
                            formatVND(Number(item.unitPrice)),
                            formatVND(Number(item.subtotal)),
                            formatVND(Number(o.discountAmount)),
                            formatVND(Number(o.taxAmount)),
                            formatVND(Number(o.totalAmount)),
                            o.payments.map((p) => p.method).join(", "),
                        ])
                    }
                }

                csv = toCSV(headers, rows)
                filename = `revenue_${dateFrom}_${dateTo}.csv`
                break
            }

            case "consignment": {
                const consignments = await prisma.consignment.findMany({
                    where: { createdAt: { gte: start, lte: end } },
                    include: { supplier: true, bottles: { include: { product: true } } },
                    orderBy: { createdAt: "desc" },
                })

                const headers = ["Mã KG", "NCC", "Ngày nhận", "Trạng thái", "Sản phẩm", "Giá gốc", "Giá bán", "Trạng thái chai", "Tổng chai", "Đã bán"]
                const rows: string[][] = []

                for (const c of consignments) {
                    for (const b of c.bottles) {
                        rows.push([
                            c.consignmentNo,
                            c.supplier.name,
                            c.receivedDate.toLocaleDateString("vi-VN"),
                            c.status,
                            b.product.name,
                            formatVND(Number(b.costPrice ?? 0)),
                            formatVND(Number(b.product.sellPrice)),
                            b.status,
                            String(c.totalBottles),
                            String(c.soldBottles),
                        ])
                    }
                }

                csv = toCSV(headers, rows)
                filename = `consignment_${dateFrom}_${dateTo}.csv`
                break
            }

            case "waste": {
                const movements = await prisma.stockMovement.findMany({
                    where: {
                        type: { in: ["WASTE", "SPOILAGE", "BREAKAGE"] },
                        createdAt: { gte: start, lte: end },
                    },
                    include: { ingredient: true },
                    orderBy: { createdAt: "desc" },
                })

                // Batch load products
                const productIds = movements.filter((m) => m.productId).map((m) => m.productId!)
                const products = productIds.length > 0
                    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
                    : []
                const productMap = new Map(products.map((p) => [p.id, p.name]))

                const headers = ["Ngày", "Loại", "Sản phẩm/Nguyên liệu", "Số lượng", "Giá trị (₫)", "Lý do"]
                const rows: string[][] = movements.map((m) => [
                    m.createdAt.toLocaleDateString("vi-VN"),
                    m.type,
                    m.productId ? (productMap.get(m.productId) ?? "N/A") : (m.ingredient?.name ?? "N/A"),
                    String(Number(m.quantity)),
                    formatVND(Number(m.totalCost ?? 0)),
                    m.reason ?? "",
                ])

                csv = toCSV(headers, rows)
                filename = `waste_${dateFrom}_${dateTo}.csv`
                break
            }

            case "inventory": {
                const wineProducts = await prisma.product.findMany({
                    where: { isActive: true, type: { in: ["WINE_BOTTLE", "WINE_GLASS", "WINE_TASTING"] } },
                    include: { category: true },
                    orderBy: { name: "asc" },
                })

                const headers = ["SKU", "Tên", "Loại", "Danh mục", "Giá bán", "Giá vốn", "Tồn kho", "Ngưỡng", "Trạng thái"]
                const rows: string[][] = []

                for (const p of wineProducts) {
                    const stockCount = await prisma.wineBottle.count({ where: { productId: p.id, status: { in: ["IN_STOCK", "OPENED"] } } })
                    rows.push([
                        p.sku ?? "N/A",
                        p.name,
                        p.type,
                        p.category?.name ?? "N/A",
                        formatVND(Number(p.sellPrice)),
                        formatVND(Number(p.costPrice)),
                        String(stockCount),
                        String(p.lowStockAlert),
                        stockCount === 0 ? "HẾT HÀNG" : stockCount <= p.lowStockAlert ? "TỒN THẤP" : "OK",
                    ])
                }

                csv = toCSV(headers, rows)
                filename = `inventory_${new Date().toISOString().split("T")[0]}.csv`
                break
            }

            case "forecast": {
                const products = await prisma.product.findMany({
                    where: { isActive: true, trackInventory: true },
                    include: { category: true },
                    orderBy: { name: "asc" },
                })

                const configs = await prisma.forecastConfig.findMany()
                const configMap = new Map(configs.map((c) => [c.productId, c]))

                const headers = ["SKU", "Tên", "Danh mục", "Tồn kho", "TB tuần", "Season Factor", "Trend Factor", "Lead Time", "Safety Stock"]
                const rows: string[][] = []

                for (const p of products) {
                    const config = configMap.get(p.id)
                    const stockCount = await prisma.wineBottle.count({ where: { productId: p.id, status: "IN_STOCK" } })
                    rows.push([
                        p.sku ?? "N/A",
                        p.name,
                        p.category?.name ?? "N/A",
                        String(stockCount),
                        config ? String(Number(config.avgWeeklySales)) : "N/A",
                        config ? String(Number(config.seasonFactor)) : "1.0",
                        config ? String(Number(config.trendFactor)) : "1.0",
                        config ? String(config.leadTimeDays) : "3",
                        config ? String(config.safetyStock) : String(p.lowStockAlert),
                    ])
                }

                csv = toCSV(headers, rows)
                filename = `forecast_${new Date().toISOString().split("T")[0]}.csv`
                break
            }

            default:
                return NextResponse.json({ error: `Unknown report type: ${type}. Supported: revenue, consignment, waste, inventory, forecast` }, { status: 400 })
        }

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        })
    } catch (err) {
        console.error("[Export] report error:", err)
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
    }
}
