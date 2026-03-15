"use client"

import { useState, useCallback, useMemo } from "react"
import {
    Trash2,
    RefreshCw,
    Plus,
    Wine,
    AlertTriangle,
    Package,
    Layers,
    X,
    TrendingDown,
    BarChart3,
    DollarSign,
    Calendar,
    Users,
    Search,
    Filter,
    ArrowDownRight,
    PieChart,
    Target,
    Clock,
    Percent,
    FileWarning,
    Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    recordWaste,
    getWasteReport,
    type WasteReport,
    type WasteType,
    type WasteRecord,
} from "@/actions/waste"
import { useAuthStore } from "@/stores/auth-store"

const TYPE_CONFIG: Record<WasteType, { label: string; icon: string; color: string; bgColor: string; borderColor: string }> = {
    WASTE: { label: "Hao hụt", icon: "🗑️", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200" },
    SPOILAGE: { label: "Hư hỏng", icon: "🤢", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
    BREAKAGE: { label: "Vỡ / Đổ", icon: "💔", color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
}

const formatVND = (v: number) =>
    v.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 })

export default function WasteClient({
    initial,
    formOptions,
}: {
    initial: WasteReport
    formOptions: {
        products: { id: string; name: string; type: string; costPrice: number }[]
        ingredients: { id: string; name: string; unit: string; costPerUnit: number }[]
    }
}) {
    const [report, setReport] = useState<WasteReport>(initial)
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [filterType, setFilterType] = useState<WasteType | "ALL">("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("all")
    const { staff } = useAuthStore()

    // Form state
    const [formType, setFormType] = useState<WasteType>("WASTE")
    const [formTarget, setFormTarget] = useState<"product" | "ingredient">("product")
    const [formProductId, setFormProductId] = useState("")
    const [formIngredientId, setFormIngredientId] = useState("")
    const [formQty, setFormQty] = useState(1)
    const [formReason, setFormReason] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getWasteReport()
            setReport(data)
        } catch {
            toast.error("Không thể tải dữ liệu hao hụt")
        }
        setLoading(false)
    }, [])

    const handleSubmit = async () => {
        if (!formReason.trim()) {
            toast.error("Vui lòng nhập lý do")
            return
        }
        if (formTarget === "product" && !formProductId) {
            toast.error("Vui lòng chọn sản phẩm")
            return
        }
        if (formTarget === "ingredient" && !formIngredientId) {
            toast.error("Vui lòng chọn nguyên liệu")
            return
        }

        setSubmitting(true)
        const result = await recordWaste({
            type: formType,
            productId: formTarget === "product" ? formProductId : undefined,
            ingredientId: formTarget === "ingredient" ? formIngredientId : undefined,
            quantity: formQty,
            reason: formReason,
            staffId: staff?.id ?? "",
        })

        if (result.success) {
            toast.success("Đã ghi nhận hao hụt")
            setShowForm(false)
            setFormReason("")
            setFormQty(1)
            setFormProductId("")
            setFormIngredientId("")
            await refresh()
        } else {
            toast.error(result.error ?? "Lỗi không xác định")
        }
        setSubmitting(false)
    }

    // Filtered records
    const filtered: WasteRecord[] = useMemo(() => {
        let result = report.records
        if (filterType !== "ALL") {
            result = result.filter((r) => r.type === filterType)
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(
                (r) =>
                    (r.productName?.toLowerCase().includes(q) ?? false) ||
                    (r.ingredientName?.toLowerCase().includes(q) ?? false) ||
                    (r.reason?.toLowerCase().includes(q) ?? false) ||
                    (r.staffName?.toLowerCase().includes(q) ?? false)
            )
        }
        if (dateRange !== "all") {
            const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90
            const cutoff = new Date(Date.now() - days * 86400000)
            result = result.filter((r) => new Date(r.createdAt) >= cutoff)
        }
        return result
    }, [report.records, filterType, searchQuery, dateRange])

    // Analytics
    const topOffenders = useMemo(() => {
        const map = new Map<string, { name: string; count: number; cost: number; type: "product" | "ingredient" }>()
        for (const r of report.records) {
            const name = r.productName ?? r.ingredientName ?? "Unknown"
            const key = r.productId ?? r.ingredientId ?? name
            const entry = map.get(key) ?? { name, count: 0, cost: 0, type: r.productId ? "product" as const : "ingredient" as const }
            entry.count += r.quantity
            entry.cost += r.totalCost
            map.set(key, entry)
        }
        return Array.from(map.values()).sort((a, b) => b.cost - a.cost).slice(0, 8)
    }, [report.records])

    const staffBreakdown = useMemo(() => {
        const map = new Map<string, { name: string; count: number; cost: number }>()
        for (const r of report.records) {
            const name = r.staffName ?? "Không rõ"
            const entry = map.get(name) ?? { name, count: 0, cost: 0 }
            entry.count++
            entry.cost += r.totalCost
            map.set(name, entry)
        }
        return Array.from(map.values()).sort((a, b) => b.cost - a.cost).slice(0, 5)
    }, [report.records])

    // Recent trend — compare current 7 days vs previous 7 days
    const recentTrend = useMemo(() => {
        const now = Date.now()
        const sevenDaysMs = 7 * 86400000
        const current = report.records.filter(
            (r) => now - new Date(r.createdAt).getTime() < sevenDaysMs
        )
        const previous = report.records.filter(
            (r) => {
                const age = now - new Date(r.createdAt).getTime()
                return age >= sevenDaysMs && age < 2 * sevenDaysMs
            }
        )
        const currentCost = current.reduce((s, r) => s + r.totalCost, 0)
        const previousCost = previous.reduce((s, r) => s + r.totalCost, 0)
        const change = previousCost > 0 ? Math.round(((currentCost - previousCost) / previousCost) * 100) : 0
        return { currentCost, previousCost, currentCount: current.length, previousCount: previous.length, change }
    }, [report.records])

    // Average cost per incident
    const avgCostPerIncident = report.summary.totalRecords > 0
        ? Math.round(report.summary.totalCost / report.summary.totalRecords)
        : 0

    return (
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-lg lg:text-2xl font-bold text-green-900 flex items-center gap-2">
                        <Trash2 className="h-6 w-6 text-red-600" />
                        Quản lý Hao hụt & Hư hỏng
                    </h1>
                    <p className="text-sm text-cream-500 mt-0.5">
                        Ghi nhận, phân tích waste / spoilage / breakage — Tự động vào P&L chi phí
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowForm(true)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Ghi nhận mới
                    </Button>
                    <Button
                        onClick={refresh}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="border-cream-300 text-cream-600 hover:border-green-600 hover:text-green-700"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
                        Làm mới
                    </Button>
                </div>
            </div>

            {/* Summary Cards - Full width 6-col */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 px-4 py-4 relative overflow-x-auto">
                    <div className="absolute -right-3 -top-3 opacity-10">
                        <DollarSign className="h-14 w-14 text-red-600" />
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-red-600" />
                        <span className="text-[10px] font-bold uppercase text-red-700">Tổng giá trị</span>
                    </div>
                    <p className="mt-2 font-mono text-2xl font-bold text-red-800">
                        {formatVND(report.summary.totalCost)}
                    </p>
                    <p className="text-[10px] text-red-600/70 mt-1">toàn bộ thời gian</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 px-4 py-4 relative overflow-hidden">
                    <div className="absolute -right-3 -top-3 opacity-10">
                        <Layers className="h-14 w-14 text-amber-600" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-amber-600" />
                        <span className="text-[10px] font-bold uppercase text-amber-700">Tổng sự cố</span>
                    </div>
                    <p className="mt-2 font-mono text-2xl font-bold text-amber-800">
                        {report.summary.totalRecords}
                    </p>
                    <p className="text-[10px] text-amber-600/70 mt-1">lần ghi nhận</p>
                </div>
                <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 px-4 py-4 relative overflow-hidden">
                    <div className="absolute -right-3 -top-3 opacity-10">
                        <Percent className="h-14 w-14 text-orange-600" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-orange-600" />
                        <span className="text-[10px] font-bold uppercase text-orange-700">% Doanh thu</span>
                    </div>
                    <p className={cn("mt-2 font-mono text-2xl font-bold",
                        report.summary.wastePctOfRevenue > 3 ? "text-red-700" :
                            report.summary.wastePctOfRevenue > 1.5 ? "text-amber-700" : "text-green-700"
                    )}>
                        {report.summary.wastePctOfRevenue}%
                    </p>
                    <p className="text-[10px] text-orange-600/70 mt-1">30 ngày qua</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 px-4 py-4 relative overflow-hidden">
                    <div className="absolute -right-3 -top-3 opacity-10">
                        <Target className="h-14 w-14 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-[10px] font-bold uppercase text-blue-700">TB / sự cố</span>
                    </div>
                    <p className="mt-2 font-mono text-2xl font-bold text-blue-800">
                        {formatVND(avgCostPerIncident)}
                    </p>
                    <p className="text-[10px] text-blue-600/70 mt-1">chi phí bình quân</p>
                </div>
                <div className="rounded-xl border border-cream-200 bg-gradient-to-br from-cream-50 to-cream-100/50 px-4 py-4 relative overflow-hidden">
                    <div className="absolute -right-3 -top-3 opacity-10">
                        <TrendingDown className="h-14 w-14 text-cream-400" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-cream-500" />
                        <span className="text-[10px] font-bold uppercase text-cream-600">7 ngày qua</span>
                    </div>
                    <p className="mt-2 font-mono text-2xl font-bold text-cream-700">
                        {formatVND(recentTrend.currentCost)}
                    </p>
                    <p className={cn("text-[10px] mt-1 font-medium",
                        recentTrend.change > 0 ? "text-red-600" : recentTrend.change < 0 ? "text-green-600" : "text-cream-400"
                    )}>
                        {recentTrend.change > 0 ? "↑" : recentTrend.change < 0 ? "↓" : "→"} {Math.abs(recentTrend.change)}% vs tuần trước
                    </p>
                </div>
                <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 px-4 py-4 relative overflow-hidden">
                    <div className="absolute -right-3 -top-3 opacity-10">
                        <FileWarning className="h-14 w-14 text-green-600" />
                    </div>
                    <div className="flex items-center gap-2">
                        <FileWarning className="h-4 w-4 text-green-600" />
                        <span className="text-[10px] font-bold uppercase text-green-700">Benchmark</span>
                    </div>
                    <p className={cn("mt-2 font-mono text-2xl font-bold",
                        report.summary.wastePctOfRevenue <= 2 ? "text-green-700" : "text-amber-700"
                    )}>
                        {report.summary.wastePctOfRevenue <= 2 ? "Tốt" : report.summary.wastePctOfRevenue <= 4 ? "TB" : "Cao"}
                    </p>
                    <p className="text-[10px] text-green-600/70 mt-1">mục tiêu: &lt;2%</p>
                </div>
            </div>

            {/* By Type breakdown - horizontal mini cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {report.summary.byType.map((t) => {
                    const config = TYPE_CONFIG[t.type]
                    const pct = report.summary.totalCost > 0 ? Math.round((t.cost / report.summary.totalCost) * 100) : 0
                    return (
                        <div key={t.type} className={cn("rounded-xl border px-4 py-3", config.bgColor, config.borderColor)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{config.icon}</span>
                                    <div>
                                        <span className={cn("text-xs font-bold", config.color)}>{config.label}</span>
                                        <p className={cn("font-mono text-lg font-bold", config.color)}>
                                            {formatVND(t.cost)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn("font-mono text-2xl font-bold", config.color)}>{t.count}</p>
                                    <p className="text-[10px] text-cream-400">{pct}% tổng</p>
                                </div>
                            </div>
                            <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500",
                                        t.type === "WASTE" ? "bg-red-400" :
                                            t.type === "SPOILAGE" ? "bg-amber-400" : "bg-orange-400"
                                    )}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Main Content: 2-column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Records Table (2/3) */}
                <div className="xl:col-span-2 space-y-4">
                    {/* Search, Filter, Date Range */}
                    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-cream-200 bg-white">
                        <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream-400" />
                            <input
                                type="text"
                                placeholder="Tìm sản phẩm, lý do, nhân viên..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-cream-200 bg-cream-50 text-green-900 focus:border-green-600 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Filter className="h-3.5 w-3.5 text-cream-400" />
                            {(["ALL", "WASTE", "SPOILAGE", "BREAKAGE"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setFilterType(t)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-medium transition-all",
                                        filterType === t
                                            ? "bg-green-800 text-cream-50"
                                            : "bg-cream-100 text-cream-500 hover:bg-cream-200"
                                    )}
                                >
                                    {t === "ALL" ? "Tất cả" : TYPE_CONFIG[t].icon + " " + TYPE_CONFIG[t].label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-cream-400" />
                            {(["7d", "30d", "90d", "all"] as const).map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setDateRange(d)}
                                    className={cn(
                                        "px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
                                        dateRange === d
                                            ? "bg-green-800 text-cream-50"
                                            : "bg-cream-100 text-cream-500 hover:bg-cream-200"
                                    )}
                                >
                                    {d === "all" ? "Tất cả" : d === "7d" ? "7 ngày" : d === "30d" ? "30 ngày" : "90 ngày"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Records Table */}
                    <div className="rounded-xl border border-cream-200 bg-white overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-green-900 text-cream-50 text-xs">
                                    <th className="px-4 py-2.5 text-left font-semibold">Loại</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Sản phẩm / Nguyên liệu</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">SL</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Giá trị</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Lý do</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Nhân viên</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-cream-400">
                                            <Trash2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs">✅ Chưa có ghi nhận nào {filterType !== "ALL" || searchQuery ? "phù hợp bộ lọc" : ""}</p>
                                        </td>
                                    </tr>
                                )}
                                {filtered.map((r, i) => {
                                    const config = TYPE_CONFIG[r.type]
                                    return (
                                        <tr
                                            key={r.id}
                                            className={cn("border-t border-cream-100 hover:bg-cream-50/50 transition-colors", i % 2 === 0 && "bg-cream-50/30")}
                                        >
                                            <td className="px-4 py-2.5">
                                                <Badge className={cn("text-[10px] px-1.5", config.bgColor, config.color, "border-none")}>
                                                    {config.icon} {config.label}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    {r.productId ? (
                                                        <Wine className="h-3.5 w-3.5 text-wine-600" />
                                                    ) : (
                                                        <Package className="h-3.5 w-3.5 text-green-600" />
                                                    )}
                                                    <span className="text-xs font-medium text-green-900">
                                                        {r.productName ?? r.ingredientName ?? "—"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-xs text-green-900">
                                                {r.quantity}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-red-700">
                                                {formatVND(r.totalCost)}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-cream-500 max-w-[200px] truncate" title={r.reason ?? undefined}>
                                                {r.reason ?? "—"}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-cream-500">
                                                {r.staffName ?? "—"}
                                            </td>
                                            <td className="px-4 py-2.5 text-[11px] text-cream-400">
                                                {new Date(r.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                                {" "}
                                                {new Date(r.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {filtered.length > 0 && (
                            <div className="px-4 py-2.5 border-t border-cream-100 bg-cream-50/50 flex items-center justify-between">
                                <span className="text-[11px] text-cream-400">
                                    Hiển thị {filtered.length} / {report.records.length} bản ghi
                                </span>
                                <span className="text-[11px] font-mono font-bold text-red-700">
                                    Tổng: {formatVND(filtered.reduce((s, r) => s + r.totalCost, 0))}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Monthly Trend Chart */}
                    {report.summary.byMonth.length > 0 && (
                        <div className="rounded-xl border border-cream-200 bg-white p-5">
                            <h3 className="text-sm font-bold text-green-900 flex items-center gap-2 mb-4">
                                <BarChart3 className="h-4 w-4" />
                                Xu hướng Theo tháng
                            </h3>
                            <div className="flex items-end gap-3 h-40">
                                {report.summary.byMonth.slice(-6).map((m, idx) => {
                                    const maxCost = Math.max(...report.summary.byMonth.map((x) => x.cost), 1)
                                    const heightPct = Math.max(5, (m.cost / maxCost) * 100)
                                    return (
                                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-[9px] font-mono text-cream-500">
                                                {formatVND(m.cost)}
                                            </span>
                                            <span className="text-[9px] font-mono text-cream-400">
                                                {m.count} lần
                                            </span>
                                            <div
                                                className="w-full bg-gradient-to-t from-red-500 to-red-300 rounded-t-md transition-all hover:from-red-600 hover:to-red-400"
                                                style={{ height: `${heightPct}%` }}
                                            />
                                            <span className="text-[10px] text-cream-600 font-medium">
                                                {m.month.slice(5)}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Analytics Sidebar (1/3) */}
                <div className="space-y-4">
                    {/* Top Offenders */}
                    <div className="rounded-xl border border-cream-200 bg-white p-5">
                        <h3 className="text-sm font-bold text-green-900 flex items-center gap-2 mb-4">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            Top Hao hụt Nhiều nhất
                        </h3>
                        {topOffenders.length > 0 ? (
                            <div className="space-y-2.5">
                                {topOffenders.map((item, idx) => (
                                    <div
                                        key={item.name}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-cream-50/70 border border-cream-100 hover:border-cream-300 transition-all"
                                    >
                                        <span className={cn(
                                            "flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold shrink-0",
                                            idx === 0 ? "bg-red-100 text-red-700" :
                                                idx === 1 ? "bg-amber-100 text-amber-700" :
                                                    idx === 2 ? "bg-orange-100 text-orange-700" :
                                                        "bg-cream-200 text-cream-600"
                                        )}>
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                {item.type === "product" ? (
                                                    <Wine className="h-3 w-3 text-wine-600 shrink-0" />
                                                ) : (
                                                    <Package className="h-3 w-3 text-green-600 shrink-0" />
                                                )}
                                                <p className="text-[11px] font-semibold text-green-900 truncate">{item.name}</p>
                                            </div>
                                            <p className="text-[9px] text-cream-400">{item.count} đơn vị</p>
                                        </div>
                                        <span className="text-[11px] font-mono font-bold text-red-700 shrink-0">
                                            {formatVND(item.cost)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-cream-400 text-center py-4">Chưa có dữ liệu</p>
                        )}
                    </div>

                    {/* Staff Breakdown */}
                    <div className="rounded-xl border border-cream-200 bg-white p-5">
                        <h3 className="text-sm font-bold text-green-900 flex items-center gap-2 mb-4">
                            <Users className="h-4 w-4 text-blue-600" />
                            Theo Nhân viên
                        </h3>
                        {staffBreakdown.length > 0 ? (
                            <div className="space-y-3">
                                {staffBreakdown.map((item) => {
                                    const maxCost = staffBreakdown[0]?.cost ?? 1
                                    const pct = Math.round((item.cost / maxCost) * 100)
                                    return (
                                        <div key={item.name}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[11px] text-cream-600">{item.name}</span>
                                                <span className="text-[11px] font-mono text-cream-500">
                                                    {item.count} lần · <span className="text-red-700 font-bold">{formatVND(item.cost)}</span>
                                                </span>
                                            </div>
                                            <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-cream-400 text-center py-4">Chưa có dữ liệu</p>
                        )}
                    </div>

                    {/* Week over Week */}
                    <div className="rounded-xl border border-cream-200 bg-gradient-to-br from-cream-50 to-cream-100/30 p-5">
                        <h3 className="text-sm font-bold text-green-900 flex items-center gap-2 mb-4">
                            <Clock className="h-4 w-4 text-cream-500" />
                            So sánh Tuần
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-white border border-cream-200 text-center">
                                <p className="text-[9px] text-cream-400 uppercase mb-1">Tuần này</p>
                                <p className="font-mono text-lg font-bold text-green-900">{formatVND(recentTrend.currentCost)}</p>
                                <p className="text-[10px] text-cream-400">{recentTrend.currentCount} sự cố</p>
                            </div>
                            <div className="p-3 rounded-lg bg-white border border-cream-200 text-center">
                                <p className="text-[9px] text-cream-400 uppercase mb-1">Tuần trước</p>
                                <p className="font-mono text-lg font-bold text-cream-600">{formatVND(recentTrend.previousCost)}</p>
                                <p className="text-[10px] text-cream-400">{recentTrend.previousCount} sự cố</p>
                            </div>
                        </div>
                        <div className={cn(
                            "mt-3 p-2.5 rounded-lg text-center text-xs font-bold",
                            recentTrend.change > 0 ? "bg-red-50 text-red-700 border border-red-200" :
                                recentTrend.change < 0 ? "bg-green-50 text-green-700 border border-green-200" :
                                    "bg-cream-100 text-cream-500 border border-cream-200"
                        )}>
                            {recentTrend.change > 0 && <ArrowDownRight className="h-4 w-4 inline mr-1 rotate-180" />}
                            {recentTrend.change < 0 && <ArrowDownRight className="h-4 w-4 inline mr-1" />}
                            {recentTrend.change === 0 ? "Ổn định" :
                                recentTrend.change > 0 ? `Tăng ${recentTrend.change}% — Cần chú ý` :
                                    `Giảm ${Math.abs(recentTrend.change)}% — Tốt!`}
                        </div>
                    </div>

                    {/* Benchmark Info */}
                    <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100/30 p-5">
                        <h3 className="text-sm font-bold text-green-900 flex items-center gap-2 mb-3">
                            <Target className="h-4 w-4 text-green-700" />
                            Tiêu chuẩn Ngành F&B
                        </h3>
                        <div className="space-y-2.5 text-[11px] text-cream-600">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-green-100/50 border border-green-200">
                                <span>Waste vs Revenue thấp</span>
                                <span className="font-bold text-green-700">&lt; 2%</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                                <span>Trung bình ngành</span>
                                <span className="font-bold text-amber-700">2-4%</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200">
                                <span>Cao — cần cải thiện</span>
                                <span className="font-bold text-red-700">&gt; 5%</span>
                            </div>
                            <div className="mt-2 p-2.5 rounded-lg bg-white border border-cream-200 text-center">
                                <p className="text-[10px] text-cream-400">Kết quả của bạn</p>
                                <p className={cn("font-mono text-xl font-bold mt-1",
                                    report.summary.wastePctOfRevenue <= 2 ? "text-green-700" :
                                        report.summary.wastePctOfRevenue <= 4 ? "text-amber-700" : "text-red-700"
                                )}>
                                    {report.summary.wastePctOfRevenue}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Record Waste Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-cream-200 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-display text-lg font-bold text-green-900">
                                Ghi nhận Hao hụt
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-cream-400 hover:text-cream-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Type */}
                            <div>
                                <label className="text-xs font-semibold text-green-900 mb-1 block">Loại</label>
                                <div className="flex gap-2">
                                    {(["WASTE", "SPOILAGE", "BREAKAGE"] as WasteType[]).map((t) => {
                                        const config = TYPE_CONFIG[t]
                                        return (
                                            <button
                                                key={t}
                                                onClick={() => setFormType(t)}
                                                className={cn(
                                                    "flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                                                    formType === t
                                                        ? `${config.bgColor} ${config.color} border-current`
                                                        : "bg-cream-50 text-cream-500 border-cream-200 hover:bg-cream-100"
                                                )}
                                            >
                                                {config.icon} {config.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Target: Product or Ingredient */}
                            <div>
                                <label className="text-xs font-semibold text-green-900 mb-1 block">Đối tượng</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => setFormTarget("product")}
                                        className={cn(
                                            "flex-1 px-3 py-2 rounded-lg border text-xs font-medium",
                                            formTarget === "product"
                                                ? "bg-green-50 text-green-800 border-green-300"
                                                : "bg-cream-50 text-cream-500 border-cream-200"
                                        )}
                                    >
                                        <Wine className="h-3.5 w-3.5 inline mr-1" /> Sản phẩm / Rượu
                                    </button>
                                    <button
                                        onClick={() => setFormTarget("ingredient")}
                                        className={cn(
                                            "flex-1 px-3 py-2 rounded-lg border text-xs font-medium",
                                            formTarget === "ingredient"
                                                ? "bg-green-50 text-green-800 border-green-300"
                                                : "bg-cream-50 text-cream-500 border-cream-200"
                                        )}
                                    >
                                        <Package className="h-3.5 w-3.5 inline mr-1" /> Nguyên liệu
                                    </button>
                                </div>

                                {formTarget === "product" ? (
                                    <select
                                        value={formProductId}
                                        onChange={(e) => setFormProductId(e.target.value)}
                                        className="w-full rounded-lg border border-cream-300 bg-white px-3 py-2 text-xs text-green-900 focus:border-green-600 focus:outline-none"
                                    >
                                        <option value="">— Chọn sản phẩm —</option>
                                        {formOptions.products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.type}) — {formatVND(p.costPrice)}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        value={formIngredientId}
                                        onChange={(e) => setFormIngredientId(e.target.value)}
                                        className="w-full rounded-lg border border-cream-300 bg-white px-3 py-2 text-xs text-green-900 focus:border-green-600 focus:outline-none"
                                    >
                                        <option value="">— Chọn nguyên liệu —</option>
                                        {formOptions.ingredients.map((i) => (
                                            <option key={i.id} value={i.id}>
                                                {i.name} ({i.unit}) — {formatVND(i.costPerUnit)}/{i.unit}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="text-xs font-semibold text-green-900 mb-1 block">Số lượng</label>
                                <input
                                    type="number"
                                    min={0.1}
                                    step={0.1}
                                    value={formQty}
                                    onChange={(e) => setFormQty(Number(e.target.value))}
                                    className="w-full rounded-lg border border-cream-300 bg-white px-3 py-2 text-xs text-green-900 focus:border-green-600 focus:outline-none font-mono"
                                />
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="text-xs font-semibold text-green-900 mb-1 block">Lý do *</label>
                                <textarea
                                    value={formReason}
                                    onChange={(e) => setFormReason(e.target.value)}
                                    rows={2}
                                    placeholder="VD: Chai bể, nguyên liệu hết hạn, rượu bị oxy hóa..."
                                    className="w-full rounded-lg border border-cream-300 bg-white px-3 py-2 text-xs text-green-900 focus:border-green-600 focus:outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-5">
                            <Button
                                onClick={() => setShowForm(false)}
                                variant="outline"
                                className="flex-1 border-cream-300"
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                                {submitting ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                ) : (
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                Ghi nhận
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="text-center pt-2 border-t border-cream-100">
                <p className="text-[10px] text-cream-400 italic">
                    Hao hụt tự động tính vào chi phí P&L · Bao gồm waste, spoilage, và breakage · Benchmark ngành F&B: &lt;2%
                </p>
            </div>
        </div>
    )
}
