"use client"

import { useState } from "react"
import {
    TrendingUp,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Package,
    AlertTriangle,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    calculateForecast,
    getForecastSummary,
    updateForecastStatus,
    type ForecastItem,
    type ForecastSummary,
} from "@/actions/forecast"

function formatPrice(amount: number): string {
    return new Intl.NumberFormat("vi-VN").format(amount)
}

export interface ForecastInitialData {
    items: ForecastItem[]
    summary: ForecastSummary
}

export default function ForecastClient({ initial }: { initial: ForecastInitialData }) {
    const [items, setItems] = useState<ForecastItem[]>(initial.items)
    const [summary, setSummary] = useState<ForecastSummary | undefined>(initial.summary)
    const [loading, setLoading] = useState(false)

    const refresh = async () => {
        setLoading(true)
        const [i, s] = await Promise.all([calculateForecast(), getForecastSummary()])
        setItems(i); setSummary(s)
        setLoading(false)
    }

    const handleAction = async (id: string, status: "ACCEPTED" | "DISMISSED") => {
        await updateForecastStatus(id, status)
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
        toast.success(status === "ACCEPTED" ? "✅ Đã duyệt gợi ý" : "❌ Đã bỏ qua")
    }

    const pendingItems = items.filter((i) => i.status === "PENDING")
    const decidedItems = items.filter((i) => i.status !== "PENDING")

    return (
        <div className="p-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-green-900 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-green-700" />
                        Dự báo Đặt hàng
                    </h1>
                    <p className="text-sm text-cream-500 mt-0.5">
                        Gợi ý nhập hàng dựa trên dữ liệu bán, mùa vụ, và xu hướng
                    </p>
                </div>
                <Button
                    onClick={refresh}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="border-cream-300 text-cream-600 hover:border-green-600 hover:text-green-700"
                >
                    <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
                    Tính lại
                </Button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-bold uppercase text-green-700">Sản phẩm cần nhập</span>
                        </div>
                        <p className="mt-1 font-mono text-2xl font-bold text-green-800">
                            {summary.totalItems}
                        </p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-bold uppercase text-amber-700">Tổng chi phí ước tính</span>
                        </div>
                        <p className="mt-1 font-mono text-2xl font-bold text-amber-800">
                            ₫{formatPrice(summary.totalEstimatedCost)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-bold uppercase text-blue-700">Độ tin cậy TB</span>
                        </div>
                        <p className="mt-1 font-mono text-2xl font-bold text-blue-800">
                            {summary.avgConfidence}%
                        </p>
                    </div>
                </div>
            )}

            {/* Pending Suggestions */}
            {pendingItems.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Gợi ý chờ duyệt ({pendingItems.length})
                    </h2>
                    <div className="space-y-3">
                        {pendingItems.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-xl border border-cream-200 bg-white p-4 hover:shadow-sm transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Product info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-green-900">
                                                {item.productName}
                                            </h3>
                                            <Badge className="text-[9px] px-1.5 py-0 bg-cream-200 text-cream-600 border-cream-300">
                                                {item.productSku}
                                            </Badge>
                                            <Badge className="text-[9px] px-1.5 py-0 bg-cream-100 text-cream-500 border-cream-200">
                                                {item.category}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-cream-500 leading-relaxed">
                                            {item.reason}
                                        </p>

                                        {/* Metrics */}
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="text-[10px]">
                                                <span className="text-cream-400">Tồn hiện tại: </span>
                                                <span className={cn("font-mono font-bold",
                                                    item.currentStock <= 2 ? "text-red-600" : "text-green-700"
                                                )}>
                                                    {item.currentStock}
                                                </span>
                                            </div>
                                            <div className="text-[10px]">
                                                <span className="text-cream-400">Bán TB/tuần: </span>
                                                <span className="font-mono font-bold text-blue-700">
                                                    {item.avgWeeklySales}
                                                </span>
                                            </div>
                                            <div className="text-[10px] flex items-center gap-0.5">
                                                <span className="text-cream-400">Dự báo: </span>
                                                <span className="font-mono font-bold text-wine-700">
                                                    {item.predictedDemand}
                                                </span>
                                                {item.predictedDemand > item.avgWeeklySales ? (
                                                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                                                ) : (
                                                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                                                )}
                                            </div>
                                            <div className="text-[10px]">
                                                <span className="text-cream-400">Tin cậy: </span>
                                                <span className={cn("font-mono font-bold",
                                                    item.confidence >= 0.85 ? "text-green-700" :
                                                        item.confidence >= 0.7 ? "text-amber-700" : "text-red-600"
                                                )}>
                                                    {Math.round(item.confidence * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Suggestion + Actions */}
                                    <div className="shrink-0 text-right space-y-2">
                                        <div>
                                            <p className="text-[9px] text-cream-400 uppercase">Gợi ý nhập</p>
                                            <p className="font-mono text-xl font-bold text-green-900">
                                                {item.suggestedQty > 0 ? `+${item.suggestedQty}` : "Không nhập"}
                                            </p>
                                            {item.estimatedCost > 0 && (
                                                <p className="text-[10px] font-mono text-cream-500">
                                                    ≈ ₫{formatPrice(item.estimatedCost)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-1.5">
                                            <Button
                                                onClick={() => handleAction(item.id, "ACCEPTED")}
                                                size="sm"
                                                className="h-7 px-3 bg-green-700 text-white hover:bg-green-800 text-[10px]"
                                            >
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Duyệt
                                            </Button>
                                            <Button
                                                onClick={() => handleAction(item.id, "DISMISSED")}
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-3 border-cream-300 text-cream-500 text-[10px]"
                                            >
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Bỏ qua
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Decided Items */}
            {decidedItems.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-cream-500 mb-3 flex items-center gap-2">
                        Đã xử lý ({decidedItems.length})
                    </h2>
                    <div className="space-y-2">
                        {decidedItems.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "rounded-lg border px-4 py-2.5 flex items-center justify-between opacity-70",
                                    item.status === "ACCEPTED"
                                        ? "border-green-200 bg-green-50"
                                        : "border-cream-200 bg-cream-50"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {item.status === "ACCEPTED" ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-cream-400" />
                                    )}
                                    <span className="text-xs font-semibold text-green-900">
                                        {item.productName}
                                    </span>
                                    <Badge className="text-[8px] px-1 py-0 bg-cream-200 text-cream-500">
                                        {item.productSku}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.status === "ACCEPTED" && (
                                        <span className="text-[10px] font-mono font-bold text-green-700">
                                            +{item.suggestedQty} · ₫{formatPrice(item.estimatedCost)}
                                        </span>
                                    )}
                                    <Badge className={cn("text-[8px] px-1.5 py-0",
                                        item.status === "ACCEPTED"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-cream-200 text-cream-500"
                                    )}>
                                        {item.status === "ACCEPTED" ? "✓ Duyệt" : "✗ Bỏ qua"}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {items.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-cream-400">
                    <TrendingUp className="h-10 w-10 mb-3" />
                    <p className="text-sm">Chưa có dữ liệu để dự báo</p>
                    <p className="text-[10px] mt-1">Cần ít nhất 4 tuần dữ liệu bán hàng</p>
                </div>
            )}

            <div className="mt-6 text-center">
                <p className="text-[10px] text-cream-400 italic">
                    Sử dụng Weighted Moving Average + Seasonal Decomposition · Dữ liệu từ 8 tuần gần nhất
                </p>
            </div>
        </div>
    )
}
