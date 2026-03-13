"use client"

import { useState, useCallback } from "react"
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

const TYPE_CONFIG: Record<WasteType, { label: string; icon: string; color: string; bgColor: string }> = {
    WASTE: { label: "Hao hụt", icon: "🗑️", color: "text-red-700", bgColor: "bg-red-50" },
    SPOILAGE: { label: "Hư hỏng", icon: "🤢", color: "text-amber-700", bgColor: "bg-amber-50" },
    BREAKAGE: { label: "Vỡ / Đổ", icon: "💔", color: "text-orange-700", bgColor: "bg-orange-50" },
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

    const filtered: WasteRecord[] =
        filterType === "ALL" ? report.records : report.records.filter((r) => r.type === filterType)

    return (
        <div className="p-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-green-900 flex items-center gap-2">
                        <Trash2 className="h-6 w-6 text-red-600" />
                        Hao hụt & Hư hỏng
                    </h1>
                    <p className="text-sm text-cream-500 mt-0.5">
                        Ghi nhận và phân tích waste, spoilage, breakage — tự động vào P&L
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

            {/* Summary Cards */}
            <div className="grid grid-cols-5 gap-3 mb-6">
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-[10px] font-bold uppercase text-red-700">Tổng giá trị</span>
                    </div>
                    <p className="mt-1 font-mono text-xl font-bold text-red-800">
                        {formatVND(report.summary.totalCost)}
                    </p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-amber-600" />
                        <span className="text-[10px] font-bold uppercase text-amber-700">Tổng lần</span>
                    </div>
                    <p className="mt-1 font-mono text-xl font-bold text-amber-800">
                        {report.summary.totalRecords}
                    </p>
                </div>
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-orange-600" />
                        <span className="text-[10px] font-bold uppercase text-orange-700">% vs Doanh thu</span>
                    </div>
                    <p className="mt-1 font-mono text-xl font-bold text-orange-800">
                        {report.summary.wastePctOfRevenue}%
                    </p>
                </div>
                {report.summary.byType.map((t) => {
                    const config = TYPE_CONFIG[t.type]
                    return (
                        <div key={t.type} className={cn("rounded-xl border px-4 py-3", config.bgColor, `border-${t.type === "WASTE" ? "red" : t.type === "SPOILAGE" ? "amber" : "orange"}-200`)}>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{config.icon}</span>
                                <span className={cn("text-[10px] font-bold uppercase", config.color)}>{config.label}</span>
                            </div>
                            <p className={cn("mt-1 font-mono text-lg font-bold", config.color)}>
                                {t.count} · {formatVND(t.cost)}
                            </p>
                        </div>
                    )
                })}
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-cream-500">Lọc:</span>
                {(["ALL", "WASTE", "SPOILAGE", "BREAKAGE"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilterType(t)}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-all",
                            filterType === t
                                ? "bg-green-800 text-cream-50"
                                : "bg-cream-100 text-cream-500 hover:bg-cream-200"
                        )}
                    >
                        {t === "ALL" ? "Tất cả" : TYPE_CONFIG[t].label} ({t === "ALL" ? report.records.length : report.records.filter((r) => r.type === t).length})
                    </button>
                ))}
            </div>

            {/* Records Table */}
            <div className="rounded-xl border border-cream-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-green-900 text-cream-50 text-xs">
                            <th className="px-4 py-2.5 text-left font-semibold">Loại</th>
                            <th className="px-4 py-2.5 text-left font-semibold">Sản phẩm / Nguyên liệu</th>
                            <th className="px-4 py-2.5 text-right font-semibold">Số lượng</th>
                            <th className="px-4 py-2.5 text-right font-semibold">Giá trị</th>
                            <th className="px-4 py-2.5 text-left font-semibold">Lý do</th>
                            <th className="px-4 py-2.5 text-left font-semibold">Nhân viên</th>
                            <th className="px-4 py-2.5 text-left font-semibold">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-cream-400 text-xs">
                                    ✅ Chưa có ghi nhận hao hụt nào
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
                                    <td className="px-4 py-2.5 text-xs text-cream-500 max-w-[200px] truncate">
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
            </div>

            {/* Monthly Trend */}
            {report.summary.byMonth.length > 0 && (
                <div className="mt-6 rounded-xl border border-cream-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-green-900 flex items-center gap-2 mb-3">
                        <BarChart3 className="h-4 w-4" />
                        Xu hướng theo tháng
                    </h3>
                    <div className="flex items-end gap-2 h-32">
                        {report.summary.byMonth.slice(-6).map((m) => {
                            const maxCost = Math.max(...report.summary.byMonth.map((x) => x.cost), 1)
                            const heightPct = Math.max(5, (m.cost / maxCost) * 100)
                            return (
                                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[9px] font-mono text-cream-400">
                                        {formatVND(m.cost)}
                                    </span>
                                    <div
                                        className="w-full bg-gradient-to-t from-red-400 to-red-200 rounded-t-md transition-all"
                                        style={{ height: `${heightPct}%` }}
                                    />
                                    <span className="text-[10px] text-cream-500">
                                        {m.month.slice(5)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

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
            <div className="mt-6 text-center">
                <p className="text-[10px] text-cream-400 italic">
                    Hao hụt tự động tính vào chi phí P&L · Bao gồm waste, spoilage, và breakage
                </p>
            </div>
        </div>
    )
}
