"use client"

import { useState } from "react"
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Layers,
    Package,
    RefreshCcw,
    Award,
    AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    getCOGSRecords,
    getCOGSSummary,
    getFinanceSummary,
    getExpenseBreakdown,
    getCOGSByProduct,
    type COGSRecord,
    type FinanceSummary,
    type ExpenseCategory,
} from "@/actions/finance"
import { toast } from "sonner"

function fmt(n: number) { return new Intl.NumberFormat("vi-VN").format(n) }
function fmtK(n: number) {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
    return String(n)
}

const TH = "px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-cream-400 bg-cream-50 border-b border-cream-200 whitespace-nowrap"
const THR = cn(TH, "text-right")
const THC = cn(TH, "text-center")
const TD = "px-3 py-3 text-xs text-green-900 border-b border-cream-100 whitespace-nowrap"
const TDR = cn(TD, "text-right font-mono")
const TDC = cn(TD, "text-center")

function StatCard({ label, value, sub, color, icon: Icon, accent }: { label: string; value: string; sub: string; color: string; icon: typeof DollarSign; accent: string }) {
    return (
        <div className="rounded-xl border border-cream-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-cream-400">{label}</span>
                <div className={cn("flex h-5 w-5 items-center justify-center rounded-md", accent)}><Icon className="h-3 w-3" /></div>
            </div>
            <p className={cn("font-mono text-xl font-bold leading-none", color)}>{value}</p>
            <p className="text-[9px] text-cream-400 mt-1">{sub}</p>
        </div>
    )
}

type TabType = "overview" | "cogs" | "products"

type FinanceInitialData = {
    cogsRecords: COGSRecord[]
    cogsSummary: Awaited<ReturnType<typeof getCOGSSummary>>
    financeSummary: FinanceSummary
    expenses: ExpenseCategory[]
    productCOGS: Awaited<ReturnType<typeof getCOGSByProduct>>
}

export function FinanceClient({ initial }: { initial: FinanceInitialData }) {
    const [tab, setTab] = useState<TabType>("overview")
    const [cogsRecords, setCogsRecords] = useState(initial.cogsRecords)
    const [cogsSummary, setCogsSummary] = useState(initial.cogsSummary)
    const [financeSummary, setFinanceSummary] = useState(initial.financeSummary)
    const [expenses, setExpenses] = useState(initial.expenses)
    const [productCOGS, setProductCOGS] = useState(initial.productCOGS)
    const [refreshing, setRefreshing] = useState(false)

    const refresh = async () => {
        setRefreshing(true)
        try {
            const [r, cs, fs, ex, pc] = await Promise.all([
                getCOGSRecords(), getCOGSSummary(), getFinanceSummary(), getExpenseBreakdown(), getCOGSByProduct(),
            ])
            setCogsRecords(r)
            setCogsSummary(cs)
            setFinanceSummary(fs)
            setExpenses(ex)
            setProductCOGS(pc)
            toast.success("Đã cập nhật dữ liệu tài chính")
        } catch {
            toast.error("Lỗi tải dữ liệu")
        }
        setRefreshing(false)
    }

    const now = new Date()
    const monthLabel = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`

    return (
        <div className="min-h-screen bg-cream-50 p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in-up">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-100">
                        <DollarSign className="h-5 w-5 text-wine-700" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-green-900">Tài chính</h1>
                        <p className="text-sm text-cream-500">Giá vốn COGS, P&L & phân tích biên lợi nhuận — dữ liệu thực</p>
                    </div>
                </div>
                <Button onClick={refresh} variant="outline" size="sm" disabled={refreshing} className="border-cream-300 text-cream-500">
                    <RefreshCcw className={cn("mr-1.5 h-3.5 w-3.5", refreshing && "animate-spin")} /> {refreshing ? "Đang tải..." : "Refresh"}
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-6 gap-3">
                <StatCard label="Doanh thu" value={`₫${fmtK(financeSummary.totalRevenue)}`} sub={monthLabel} color="text-green-700" icon={TrendingUp} accent="bg-green-100" />
                <StatCard label="Giá vốn (COGS)" value={`₫${fmtK(financeSummary.totalCOGS)}`} sub="Tính từ công thức" color="text-wine-700" icon={Package} accent="bg-wine-100" />
                <StatCard label="Lợi nhuận gộp" value={`₫${fmtK(financeSummary.grossProfit)}`} sub={`GM: ${financeSummary.grossMargin}%`} color="text-green-600" icon={ArrowUpRight} accent="bg-green-100" />
                <StatCard label="Chi phí vận hành" value={`₫${fmtK(financeSummary.operatingExpenses)}`} sub="Nhân sự, mặt bằng..." color="text-blue-600" icon={Layers} accent="bg-blue-100" />
                <StatCard label="Khấu hao CCDC" value={`₫${fmtK(financeSummary.depreciationExpense)}`} sub="Tháng này" color="text-amber-600" icon={TrendingDown} accent="bg-amber-100" />
                <StatCard
                    label="Lợi nhuận ròng" value={`₫${fmtK(financeSummary.netProfit)}`}
                    sub={`NM: ${financeSummary.netMargin}%`}
                    color={financeSummary.netProfit >= 0 ? "text-green-700" : "text-red-600"}
                    icon={financeSummary.netProfit >= 0 ? ArrowUpRight : ArrowDownRight}
                    accent={financeSummary.netProfit >= 0 ? "bg-green-100" : "bg-red-100"}
                />
            </div>

            {/* Tab Switch */}
            <div className="flex gap-1 rounded-lg bg-cream-200 p-0.5 w-fit">
                {([
                    { key: "overview" as TabType, label: "📊 Tổng quan P&L" },
                    { key: "cogs" as TabType, label: "💰 Chi tiết COGS" },
                    { key: "products" as TabType, label: "🍷 Biên LN sản phẩm" },
                ]).map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn("rounded-md px-4 py-2 text-xs font-semibold transition-all", tab === t.key ? "bg-green-900 text-cream-50 shadow-sm" : "text-cream-500 hover:text-cream-700")}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ═══════════ P&L OVERVIEW ═══════════ */}
            {tab === "overview" && (
                <div className="grid grid-cols-5 gap-4">
                    {/* P&L Statement */}
                    <div className="col-span-3 rounded-xl border border-cream-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-green-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-green-700" />
                            Báo cáo Lãi / Lỗ — {monthLabel}
                        </h3>
                        <div className="space-y-0.5">
                            <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-2.5">
                                <span className="text-xs font-bold text-green-900">Doanh thu thuần</span>
                                <span className="font-mono text-sm font-bold text-green-700">₫{fmt(financeSummary.totalRevenue)}</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2">
                                <span className="text-xs text-cream-500 pl-4">(-) Giá vốn hàng bán (COGS)</span>
                                <span className="font-mono text-xs text-red-600">-₫{fmt(financeSummary.totalCOGS)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-cream-50 border border-cream-200 px-4 py-2.5">
                                <span className="text-xs font-bold text-green-900">
                                    Lợi nhuận gộp <span className="ml-1 text-[10px] text-cream-400 font-normal">({financeSummary.grossMargin}%)</span>
                                </span>
                                <span className="font-mono text-sm font-bold text-green-600">₫{fmt(financeSummary.grossProfit)}</span>
                            </div>
                            {expenses.filter((e) => e.category !== "Giá vốn hàng bán (COGS)").map((exp) => (
                                <div key={exp.category} className="flex items-center justify-between px-4 py-1.5">
                                    <span className="text-[11px] text-cream-500 pl-4">(-) {exp.category}</span>
                                    <span className="font-mono text-[11px] text-cream-600">-₫{fmt(exp.amount)}</span>
                                </div>
                            ))}
                            <div className={cn(
                                "flex items-center justify-between rounded-lg px-4 py-3 mt-2",
                                financeSummary.netProfit >= 0 ? "bg-green-100 border border-green-300" : "bg-red-100 border border-red-300"
                            )}>
                                <span className="text-sm font-bold text-green-900">
                                    LỢI NHUẬN RÒNG <span className="ml-1 text-[10px] text-cream-500 font-normal">({financeSummary.netMargin}%)</span>
                                </span>
                                <span className={cn("font-mono text-lg font-bold", financeSummary.netProfit >= 0 ? "text-green-700" : "text-red-600")}>
                                    ₫{fmt(financeSummary.netProfit)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="col-span-2 rounded-xl border border-cream-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-green-900 mb-4 flex items-center gap-2">
                            <PieChart className="h-4 w-4 text-wine-600" /> Cơ cấu chi phí
                        </h3>
                        {expenses.length > 0 ? (
                            <div className="space-y-2.5 mb-4">
                                {expenses.map((exp) => (
                                    <div key={exp.category}>
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[10px] text-cream-500 truncate max-w-[160px]">{exp.category}</span>
                                            <span className="font-mono text-[10px] font-bold text-cream-600">₫{fmtK(exp.amount)} ({exp.percentage}%)</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{ width: `${exp.percentage}%`, backgroundColor: exp.color }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-cream-400 italic py-4 text-center">Chưa có dữ liệu chi phí. Thanh toán đơn để thấy COGS.</p>
                        )}

                        {cogsSummary && (
                            <div className="border-t border-cream-200 pt-3 space-y-2">
                                <h4 className="text-[10px] font-bold text-cream-400 uppercase">COGS Insights</h4>
                                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                                    <Award className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    <div><p className="text-[9px] text-cream-400">Biên cao nhất</p><p className="text-[11px] font-bold text-green-700">{cogsSummary.topMarginProduct}</p></div>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                    <div><p className="text-[9px] text-cream-400">Biên thấp nhất</p><p className="text-[11px] font-bold text-amber-700">{cogsSummary.lowestMarginProduct}</p></div>
                                </div>
                                <div className="rounded-lg bg-cream-50 border border-cream-200 px-3 py-2 mt-2">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-cream-500">Tổng đơn có COGS</span>
                                        <span className="font-bold text-green-900">{cogsSummary.totalOrders}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] mt-1">
                                        <span className="text-cream-500">Biên LN trung bình</span>
                                        <span className="font-bold text-wine-700">{cogsSummary.avgMargin}%</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════ COGS DETAIL ═══════════ */}
            {tab === "cogs" && (
                <div className="rounded-xl border border-cream-200 bg-white overflow-hidden shadow-sm">
                    {cogsRecords.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className={TH}>Đơn hàng</th>
                                    <th className={TH}>Sản phẩm</th>
                                    <th className={THR} style={{ width: 110 }}>Doanh thu</th>
                                    <th className={THR} style={{ width: 110 }}>Giá vốn COGS</th>
                                    <th className={THR} style={{ width: 110 }}>Lợi nhuận gộp</th>
                                    <th className={THC} style={{ width: 80 }}>Biên LN</th>
                                    <th className={THC} style={{ width: 60 }}>SL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cogsRecords.map((record) => {
                                    const margin = record.marginPct
                                    const cls = margin >= 70 ? "bg-green-100 text-green-700"
                                        : margin >= 50 ? "bg-blue-100 text-blue-700"
                                            : margin >= 30 ? "bg-amber-100 text-amber-700"
                                                : "bg-red-100 text-red-700"
                                    return (
                                        <tr key={record.id} className="hover:bg-green-50/50 transition-colors">
                                            <td className={TD}>
                                                <p className="font-mono text-[11px] font-bold text-blue-700">{record.orderNo}</p>
                                                <p className="text-[10px] text-cream-400 leading-tight">
                                                    {record.soldDate ? new Date(record.soldDate).toLocaleDateString('vi-VN') : ''}
                                                </p>
                                            </td>
                                            <td className={TD}>
                                                <p className="font-medium leading-tight">{record.productName}</p>
                                                <p className="text-[10px] text-cream-400 leading-tight">
                                                    {record.items.map(i => `${i.productName} x${i.qty}`).join(", ")}
                                                </p>
                                            </td>
                                            <td className={TDR}>₫{fmt(record.totalRevenue)}</td>
                                            <td className={cn(TDR, "text-wine-600")}>₫{fmt(record.totalCOGS)}</td>
                                            <td className={cn(TDR, "font-bold text-green-600")}>₫{fmt(record.grossProfit)}</td>
                                            <td className={TDC}>
                                                <span className={cn("inline-block rounded-full px-2 py-0.5 text-[9px] font-bold leading-tight", cls)}>{margin}%</span>
                                            </td>
                                            <td className={cn(TDC, "text-cream-600")}>{record.soldQty}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-12 text-center">
                            <Package className="h-8 w-8 text-cream-300 mx-auto mb-2" />
                            <p className="text-sm text-cream-400">Chưa có dữ liệu COGS</p>
                            <p className="text-xs text-cream-300 mt-1">Tạo công thức cho sản phẩm, sau đó thanh toán đơn hàng để thấy giá vốn thực</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ PRODUCT MARGIN ═══════════ */}
            {tab === "products" && (
                <div className="rounded-xl border border-cream-200 bg-white overflow-hidden shadow-sm">
                    {productCOGS.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className={TH} style={{ width: 24 }}>#</th>
                                    <th className={TH}>Sản phẩm</th>
                                    <th className={THR} style={{ width: 100 }}>Doanh thu</th>
                                    <th className={THR} style={{ width: 100 }}>COGS</th>
                                    <th className={THR} style={{ width: 100 }}>Lợi nhuận</th>
                                    <th className={TH} style={{ width: 130 }}>Mức biên</th>
                                    <th className={THC} style={{ width: 60 }}>SL bán</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productCOGS.map((product, idx) => {
                                    const mc = product.grossMargin >= 70 ? "text-green-700" : product.grossMargin >= 50 ? "text-blue-700" : product.grossMargin >= 30 ? "text-amber-700" : "text-red-700"
                                    const bc = product.grossMargin >= 70 ? "bg-green-500" : product.grossMargin >= 50 ? "bg-blue-500" : product.grossMargin >= 30 ? "bg-amber-500" : "bg-red-500"
                                    return (
                                        <tr key={product.productName} className="hover:bg-green-50/50 transition-colors">
                                            <td className={cn(TD, "text-cream-400 text-center font-mono")}>{idx + 1}</td>
                                            <td className={cn(TD, "font-medium")}>{product.productName}</td>
                                            <td className={TDR}>₫{fmtK(product.totalRevenue)}</td>
                                            <td className={cn(TDR, "text-wine-600")}>₫{fmtK(product.totalCOGS)}</td>
                                            <td className={cn(TDR, "font-bold text-green-600")}>₫{fmtK(product.grossProfit)}</td>
                                            <td className={TD}>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex-1 h-1.5 rounded-full bg-cream-200 overflow-hidden">
                                                        <div className={cn("h-full rounded-full", bc)} style={{ width: `${product.grossMargin}%` }} />
                                                    </div>
                                                    <span className={cn("text-[10px] font-bold min-w-[32px] text-right", mc)}>{product.grossMargin}%</span>
                                                </div>
                                            </td>
                                            <td className={cn(TDC, "text-cream-600")}>{product.totalQty}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-12 text-center">
                            <Package className="h-8 w-8 text-cream-300 mx-auto mb-2" />
                            <p className="text-sm text-cream-400">Chưa có dữ liệu biên lợi nhuận sản phẩm</p>
                            <p className="text-xs text-cream-300 mt-1">Tạo công thức → bán hàng → thanh toán để thấy biên LN từng sản phẩm</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
