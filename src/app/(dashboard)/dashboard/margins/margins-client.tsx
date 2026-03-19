"use client"

import { useState, useMemo } from "react"
import { Tag, TrendingUp, TrendingDown, BarChart3, ArrowUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

function formatPrice(n: number) {
    return new Intl.NumberFormat("vi-VN").format(n)
}

interface ProductMargin {
    productName: string
    totalRevenue: number
    totalCOGS: number
    grossProfit: number
    grossMargin: number
    totalQty: number
}

interface Summary {
    todayCOGS: number
    monthCOGS: number
    avgMargin: number
    totalOrders: number
    topMarginProduct: string
    lowestMarginProduct: string
}

interface Props {
    initial: {
        byProduct: ProductMargin[]
        summary: Summary
    }
}

export default function MarginsClient({ initial }: Props) {
    const [search, setSearch] = useState("")
    const [sortBy, setSortBy] = useState<"profit" | "margin" | "revenue">("profit")

    const filtered = useMemo(() => {
        let items = initial.byProduct
        if (search) {
            const q = search.toLowerCase()
            items = items.filter((p) => p.productName.toLowerCase().includes(q))
        }
        return [...items].sort((a, b) => {
            if (sortBy === "margin") return b.grossMargin - a.grossMargin
            if (sortBy === "revenue") return b.totalRevenue - a.totalRevenue
            return b.grossProfit - a.grossProfit
        })
    }, [initial.byProduct, search, sortBy])

    const totalRevenue = initial.byProduct.reduce((s, p) => s + p.totalRevenue, 0)
    const totalCOGS = initial.byProduct.reduce((s, p) => s + p.totalCOGS, 0)
    const totalProfit = totalRevenue - totalCOGS

    return (
        <div className="p-4 lg:p-6 space-y-4">
            {/* Header */}
            <div>
                <h1 className="font-display text-xl font-bold text-green-900 flex items-center gap-2">
                    <Tag className="h-5 w-5" /> Lợi nhuận & Biên lãi
                </h1>
                <p className="text-xs text-cream-500 mt-0.5">Phân tích biên lãi gộp theo sản phẩm (COGS thực tế)</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-cream-300 bg-white p-4">
                    <p className="text-[10px] font-bold uppercase text-cream-400">Doanh thu tháng</p>
                    <p className="font-mono text-lg font-bold text-green-900 mt-1">₫{formatPrice(totalRevenue)}</p>
                </div>
                <div className="rounded-xl border border-cream-300 bg-white p-4">
                    <p className="text-[10px] font-bold uppercase text-cream-400">COGS tháng</p>
                    <p className="font-mono text-lg font-bold text-red-700 mt-1">₫{formatPrice(totalCOGS)}</p>
                </div>
                <div className="rounded-xl border border-cream-300 bg-white p-4">
                    <p className="text-[10px] font-bold uppercase text-cream-400">Lãi gộp</p>
                    <p className="font-mono text-lg font-bold text-green-700 mt-1">₫{formatPrice(totalProfit)}</p>
                </div>
                <div className="rounded-xl border border-cream-300 bg-white p-4">
                    <p className="text-[10px] font-bold uppercase text-cream-400">Biên lãi TB</p>
                    <p className="font-mono text-lg font-bold text-green-900 mt-1">{initial.summary.avgMargin}%</p>
                    <div className="flex gap-2 mt-1 text-[9px]">
                        <span className="text-green-600 flex items-center gap-0.5"><TrendingUp className="h-2.5 w-2.5" /> {initial.summary.topMarginProduct}</span>
                    </div>
                </div>
            </div>

            {/* Search + Sort */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm sản phẩm..."
                        className="h-8 pl-8 text-xs border-cream-300"
                    />
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-cream-300 p-0.5">
                    {(["profit", "margin", "revenue"] as const).map((key) => (
                        <button
                            key={key}
                            onClick={() => setSortBy(key)}
                            className={cn(
                                "rounded-md px-2.5 py-1 text-[10px] font-medium transition-all",
                                sortBy === key
                                    ? "bg-green-900 text-cream-50"
                                    : "text-cream-500 hover:text-green-900"
                            )}
                        >
                            {key === "profit" ? "Lãi gộp" : key === "margin" ? "Biên %" : "Doanh thu"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Margin Table */}
            <div className="rounded-xl border border-cream-300 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-cream-200 bg-cream-50 text-[10px] font-bold uppercase text-cream-400">
                                <th className="px-4 py-2.5 text-left">Sản phẩm</th>
                                <th className="px-3 py-2.5 text-right">SL bán</th>
                                <th className="px-3 py-2.5 text-right">Doanh thu</th>
                                <th className="px-3 py-2.5 text-right">COGS</th>
                                <th className="px-3 py-2.5 text-right">Lãi gộp</th>
                                <th className="px-3 py-2.5 text-right">Biên %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-100">
                            {filtered.map((p) => (
                                <tr key={p.productName} className="hover:bg-cream-50 transition-colors">
                                    <td className="px-4 py-2.5 font-medium text-green-900 max-w-[200px] truncate">{p.productName}</td>
                                    <td className="px-3 py-2.5 text-right text-cream-500">{p.totalQty}</td>
                                    <td className="px-3 py-2.5 text-right font-mono text-green-800">₫{formatPrice(p.totalRevenue)}</td>
                                    <td className="px-3 py-2.5 text-right font-mono text-red-600">₫{formatPrice(p.totalCOGS)}</td>
                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-green-700">₫{formatPrice(p.grossProfit)}</td>
                                    <td className="px-3 py-2.5 text-right">
                                        <span className={cn(
                                            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                                            p.grossMargin >= 60 ? "bg-green-100 text-green-700" :
                                                p.grossMargin >= 40 ? "bg-amber-100 text-amber-700" :
                                                    "bg-red-100 text-red-700"
                                        )}>
                                            {p.grossMargin >= 60 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                            {p.grossMargin}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                    <BarChart3 className="h-10 w-10 text-cream-300 mb-2" />
                    <p className="text-sm text-cream-400">Chưa có dữ liệu biên lãi</p>
                    <p className="text-xs text-cream-400 mt-1">Cần có đơn hàng đã thanh toán với COGS</p>
                </div>
            )}
        </div>
    )
}
