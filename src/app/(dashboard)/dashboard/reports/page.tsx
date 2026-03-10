"use client"

import { useState, useEffect, useCallback } from "react"
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Banknote,
    CreditCard,
    QrCode,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Package,
    Clock,
    Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
    getPnLSummary,
    getWeeklyPnL,
    type PnLSummary,
    type DailyPnL,
} from "@/actions/daily-pnl"

function fmt(n: number) { return new Intl.NumberFormat("vi-VN").format(n) }
function fmtK(n: number) {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
    return String(n)
}

export default function ReportsPage() {
    const [summary, setSummary] = useState<PnLSummary | null>(null)
    const [weekData, setWeekData] = useState<DailyPnL[]>([])
    const [selectedDay, setSelectedDay] = useState(0)
    const [loading, setLoading] = useState(true)

    const loadData = useCallback(async () => {
        setLoading(true)
        const [s, w] = await Promise.all([getPnLSummary(), getWeeklyPnL()])
        setSummary(s)
        setWeekData(w)
        setLoading(false)
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const day = weekData[selectedDay] ?? null

    if (!summary || !day) return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center">
            <div className="animate-pulse text-sm text-cream-400">Đang tải báo cáo...</div>
        </div>
    )

    const isToday = selectedDay === 0
    const dateStr = new Date(day.date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

    return (
        <div className="min-h-screen bg-cream-50 p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                        <BarChart3 className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-green-900">Báo cáo P&L</h1>
                        <p className="text-sm text-cream-500">Lãi lỗ hàng ngày — auto-generated</p>
                    </div>
                </div>

                {/* Day selector */}
                <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedDay(Math.min(selectedDay + 1, weekData.length - 1))} className="p-1.5 rounded-lg hover:bg-cream-200 text-cream-500 transition-all">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-center min-w-[200px]">
                        <p className="text-sm font-bold text-green-900">{isToday ? "📅 Hôm nay" : dateStr}</p>
                        <p className="text-[10px] text-cream-400">{day.date}</p>
                    </div>
                    <button onClick={() => setSelectedDay(Math.max(selectedDay - 1, 0))} disabled={selectedDay === 0} className="p-1.5 rounded-lg hover:bg-cream-200 text-cream-500 transition-all disabled:opacity-30">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Comparison with yesterday (only show for today) */}
            {isToday && (
                <div className="grid grid-cols-4 gap-3">
                    <StatCard
                        label="Doanh thu"
                        value={`₫${fmtK(summary.today.revenue)}`}
                        change={summary.revenueChangeVsYesterday}
                        sub={`TB tuần: ₫${fmtK(summary.weekAvg.revenue)}`}
                        icon={<DollarSign className="h-4 w-4" />}
                        color="green"
                    />
                    <StatCard
                        label="Lợi nhuận ròng"
                        value={`₫${fmtK(summary.today.netProfit)}`}
                        change={summary.profitChangeVsYesterday}
                        sub={`Margin: ${summary.today.netMargin}%`}
                        icon={<TrendingUp className="h-4 w-4" />}
                        color="blue"
                    />
                    <StatCard
                        label="Đơn hàng"
                        value={String(summary.today.orderCount)}
                        sub={`TB: ₫${fmtK(summary.today.avgOrderValue)}/đơn`}
                        icon={<ShoppingCart className="h-4 w-4" />}
                        color="amber"
                    />
                    <StatCard
                        label="Hao hụt"
                        value={`₫${fmtK(summary.today.wasteAndSpoilage)}`}
                        sub={summary.today.wasteAndSpoilage > 0 ? "Cần xem lại" : "Không hao hụt ✓"}
                        icon={<AlertTriangle className="h-4 w-4" />}
                        color={summary.today.wasteAndSpoilage > 0 ? "red" : "green"}
                    />
                </div>
            )}

            {/* Main P&L waterfall */}
            <div className="grid grid-cols-3 gap-4">
                {/* LEFT: P&L Breakdown */}
                <div className="col-span-2 rounded-xl border border-cream-200 bg-white shadow-sm">
                    <div className="px-5 py-3.5 border-b border-cream-200">
                        <h2 className="text-sm font-bold text-green-900">📊 Bảng P&L — {isToday ? "Hôm nay" : new Date(day.date).toLocaleDateString("vi-VN")}</h2>
                    </div>

                    <div className="p-5 space-y-1">
                        {/* Revenue */}
                        <PnLRow label="Doanh thu (Revenue)" value={day.revenue} accent="green" bold />
                        <PnLRow label="Giá vốn (COGS)" value={-day.costOfGoods} accent="red" indent />
                        <div className="border-t border-cream-200 my-1.5" />
                        <PnLRow label="Lợi nhuận gộp (Gross Profit)" value={day.grossProfit} accent="green" bold />
                        <div className="flex justify-end"><Badge className="text-[8px] bg-green-100 text-green-700 border-green-300">Margin {day.grossMargin}%</Badge></div>

                        <div className="border-t border-cream-200 my-2" />

                        {/* Expenses by category */}
                        <p className="text-[9px] font-bold uppercase text-cream-400 pt-1">CHI PHÍ VẬN HÀNH</p>
                        {day.expenses.map((group) => (
                            <div key={group.category}>
                                <PnLRow label={group.category} value={-group.amount} accent="red" indent />
                                {group.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between pl-10 py-0.5">
                                        <span className="text-[10px] text-cream-400 flex items-center gap-1"><Minus className="h-2 w-2" />{item.description}</span>
                                        <span className="text-[10px] font-mono text-cream-400">-₫{fmt(item.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}

                        <div className="border-t border-cream-200 my-1.5" />
                        <PnLRow label="Tổng chi phí (Total Expenses)" value={-day.totalExpenses} accent="red" bold />

                        <div className="border-t-2 border-green-300 my-2" />

                        {/* Net Profit */}
                        <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-green-50 border border-green-200">
                            <span className="text-sm font-bold text-green-900">💰 LỢI NHUẬN RÒNG (Net Profit)</span>
                            <div className="text-right">
                                <span className={cn("font-mono text-xl font-bold", day.netProfit >= 0 ? "text-green-700" : "text-red-600")}>
                                    ₫{fmt(day.netProfit)}
                                </span>
                                <p className="text-[9px] text-green-600">Net margin: {day.netMargin}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Supporting data */}
                <div className="space-y-4">
                    {/* Payment Breakdown */}
                    <div className="rounded-xl border border-cream-200 bg-white shadow-sm p-4">
                        <h3 className="text-[10px] font-bold uppercase text-cream-400 mb-3">PHƯƠNG THỨC THANH TOÁN</h3>
                        <div className="space-y-2">
                            <PaymentRow icon={<Banknote className="h-3.5 w-3.5 text-green-600" />} label="Tiền mặt" value={day.paymentBreakdown.cash} total={day.revenue} color="green" />
                            <PaymentRow icon={<CreditCard className="h-3.5 w-3.5 text-blue-600" />} label="Thẻ" value={day.paymentBreakdown.card} total={day.revenue} color="blue" />
                            <PaymentRow icon={<QrCode className="h-3.5 w-3.5 text-wine-600" />} label="QR Pay" value={day.paymentBreakdown.qr} total={day.revenue} color="wine" />
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="rounded-xl border border-cream-200 bg-white shadow-sm p-4">
                        <h3 className="text-[10px] font-bold uppercase text-cream-400 mb-3">TOP SẢN PHẨM</h3>
                        <div className="space-y-2">
                            {day.topProducts.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={cn(
                                            "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
                                            i === 0 ? "bg-amber-100 text-amber-700" :
                                                i === 1 ? "bg-slate-100 text-slate-600" :
                                                    "bg-cream-100 text-cream-500"
                                        )}>{i + 1}</span>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-medium text-green-900 truncate">{p.name}</p>
                                            <p className="text-[9px] text-cream-400">{p.qty} sold</p>
                                        </div>
                                    </div>
                                    <span className="font-mono text-[11px] font-bold text-wine-700 whitespace-nowrap ml-2">₫{fmtK(p.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weekly mini chart (text-based) */}
                    <div className="rounded-xl border border-cream-200 bg-white shadow-sm p-4">
                        <h3 className="text-[10px] font-bold uppercase text-cream-400 mb-3 flex items-center gap-1"><Clock className="h-3 w-3" /> BIỂU ĐỒ 7 NGÀY</h3>
                        <div className="space-y-1.5">
                            {weekData.map((d, i) => {
                                const maxRev = Math.max(...weekData.map((dd) => dd.revenue))
                                const pct = (d.revenue / maxRev) * 100
                                const dayLabel = new Date(d.date).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric" })
                                return (
                                    <button
                                        key={d.date}
                                        onClick={() => setSelectedDay(i)}
                                        className={cn("w-full flex items-center gap-2 rounded-lg py-1 px-1.5 transition-all", selectedDay === i ? "bg-green-50 ring-1 ring-green-300" : "hover:bg-cream-50")}
                                    >
                                        <span className="text-[9px] w-14 text-left text-cream-500 font-medium">{dayLabel}</span>
                                        <div className="flex-1 h-3 rounded-full bg-cream-100 overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all", d.netProfit > 0 ? "bg-green-400" : "bg-red-400")}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="font-mono text-[9px] font-bold text-green-700 w-12 text-right">₫{fmtK(d.revenue)}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatCard({ label, value, change, sub, icon, color }: {
    label: string; value: string; change?: number; sub: string; icon: React.ReactNode; color: string
}) {
    const colorMap: Record<string, string> = {
        green: "text-green-700", blue: "text-blue-700", amber: "text-amber-700", red: "text-red-600",
    }
    return (
        <div className="rounded-xl border border-cream-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
                <span className="text-cream-400">{icon}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-cream-400">{label}</span>
            </div>
            <div className="flex items-end gap-2">
                <p className={cn("font-mono text-2xl font-bold", colorMap[color])}>{value}</p>
                {change !== undefined && (
                    <Badge className={cn("text-[9px] font-bold mb-1", change >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
                        {change >= 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                        {change >= 0 ? "+" : ""}{change}%
                    </Badge>
                )}
            </div>
            <p className="text-[10px] text-cream-400 mt-1">{sub}</p>
        </div>
    )
}

function PnLRow({ label, value, accent, bold, indent }: {
    label: string; value: number; accent: "green" | "red"; bold?: boolean; indent?: boolean
}) {
    const negative = value < 0
    return (
        <div className={cn("flex justify-between items-center py-1", indent && "pl-4")}>
            <span className={cn("text-xs", bold ? "font-bold text-green-900" : "text-cream-600")}>{label}</span>
            <span className={cn(
                "font-mono text-xs",
                bold ? "font-bold" : "font-medium",
                accent === "green" ? "text-green-700" : "text-red-600"
            )}>
                {negative ? "-" : ""}₫{fmt(Math.abs(value))}
            </span>
        </div>
    )
}

function PaymentRow({ icon, label, value, total, color }: {
    icon: React.ReactNode; label: string; value: number; total: number; color: string
}) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0
    const barColor: Record<string, string> = { green: "bg-green-400", blue: "bg-blue-400", wine: "bg-wine-400" }
    return (
        <div>
            <div className="flex justify-between items-center mb-0.5">
                <span className="flex items-center gap-1.5 text-[11px]">{icon} {label}</span>
                <span className="font-mono text-[11px] font-bold text-green-900">₫{fmt(value)} <span className="text-cream-400 font-normal">({pct}%)</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-cream-100 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", barColor[color])} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}
