"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Settings,
    Store,
    Printer,
    Bell,
    Shield,
    Palette,
    Receipt,
    Save,
    Check,
    Plus,
    Pencil,
    Trash2,
    X,
    BadgePercent,
    FileText,
    Star,
    Banknote,
    HandCoins,
    SlidersHorizontal,
    Users,
    Clock,
    Calendar,
    Wallet,
    Briefcase,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    getAllTaxRates,
    createTaxRate,
    updateTaxRate,
    deleteTaxRate,
    getTaxConfig,
    updateTaxConfig,
    getTaxReport,
    getTaxBreakdownByRate,
} from "@/actions/tax"
import { getServiceChargeConfig, updateServiceChargeConfig } from "@/actions/operational"
import { getBankConfig, updateBankConfig, type QRPaymentConfig } from "@/actions/qr-payment"
import type { TaxRate } from "@/types"
import { getHrConfig, updateHrConfig, type HrConfigData } from "@/actions/hr-config"
import { ThemePicker } from "@/components/theme-switcher"

type TaxReportLine = Awaited<ReturnType<typeof getTaxReport>>[number]
type TaxBreakdown = Awaited<ReturnType<typeof getTaxBreakdownByRate>>[number]

type SettingSection = "store" | "tax" | "service-charge" | "payment" | "receipt" | "notification" | "display" | "operational" | "system" | "hr"

const NAV_ITEMS: { id: SettingSection; label: string; icon: typeof Store }[] = [
    { id: "store", label: "Cửa hàng", icon: Store },
    { id: "tax", label: "Thuế (VAT)", icon: Receipt },
    { id: "service-charge", label: "Phí dịch vụ", icon: HandCoins },
    { id: "payment", label: "Thanh toán QR", icon: Banknote },
    { id: "receipt", label: "Hoá đơn & In", icon: Printer },
    { id: "notification", label: "Thông báo", icon: Bell },
    { id: "display", label: "Giao diện", icon: Palette },
    { id: "operational", label: "Vận hành", icon: SlidersHorizontal },
    { id: "hr", label: "Nhân sự", icon: Users },
    { id: "system", label: "Hệ thống", icon: Shield },
]

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState<SettingSection>("store")
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        setSaved(true)
        toast.success("Đã lưu cài đặt")
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="min-h-screen bg-cream-50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                        <Settings className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-green-900">Cài đặt</h1>
                        <p className="text-sm text-cream-500">Tuỳ chỉnh hệ thống POS</p>
                    </div>
                </div>
                {activeSection !== "tax" && (
                    <Button
                        onClick={handleSave}
                        className={cn(
                            "transition-all",
                            saved ? "bg-green-600 text-white" : "bg-green-900 text-cream-50 hover:bg-green-800"
                        )}
                    >
                        {saved ? <Check className="mr-1.5 h-4 w-4" /> : <Save className="mr-1.5 h-4 w-4" />}
                        {saved ? "Đã lưu" : "Lưu thay đổi"}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-[200px,1fr] gap-6">
                {/* Settings Nav */}
                <div className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={cn(
                                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all",
                                    activeSection === item.id
                                        ? "bg-green-900 text-cream-50"
                                        : "text-cream-500 hover:bg-cream-200"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </button>
                        )
                    })}
                </div>

                {/* Settings Content */}
                <div className="rounded-xl border border-cream-300 bg-cream-100 p-6">
                    {activeSection === "store" && <StoreSettings />}
                    {activeSection === "tax" && <TaxSettings />}
                    {activeSection === "service-charge" && <ServiceChargeSettings />}
                    {activeSection === "payment" && <PaymentSettings />}
                    {activeSection === "receipt" && <ReceiptSettings />}
                    {activeSection === "notification" && <NotificationSettings />}
                    {activeSection === "display" && <DisplaySettings />}
                    {activeSection === "operational" && <OperationalSettings />}
                    {activeSection === "hr" && <HrSettings />}
                    {activeSection === "system" && <SystemSettings />}
                </div>
            </div>
        </div>
    )
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3 mb-6 last:mb-0">
            <h3 className="font-display text-sm font-bold text-green-900 pb-1 border-b border-cream-200">
                {title}
            </h3>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-xs font-medium text-green-900">{label}</p>
                {description && <p className="text-[10px] text-cream-400 mt-0.5">{description}</p>}
            </div>
            <div className="shrink-0 ml-4">
                {children}
            </div>
        </div>
    )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={cn(
                "relative h-5 w-9 rounded-full transition-all",
                checked ? "bg-green-700" : "bg-cream-300"
            )}
        >
            <div className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                checked ? "left-[18px]" : "left-0.5"
            )} />
        </button>
    )
}

// ============================================================
// TAX SETTINGS — Full VAT Management
// ============================================================

function TaxSettings() {
    const [taxEnabled, setTaxEnabled] = useState(false)
    const [taxInclusive, setTaxInclusive] = useState(true)
    const [taxRates, setTaxRates] = useState<TaxRate[]>([])
    const [loading, setLoading] = useState(true)
    const [editingRate, setEditingRate] = useState<TaxRate | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [activeTab, setActiveTab] = useState<"config" | "report">("config")
    const [taxReport, setTaxReport] = useState<TaxReportLine[]>([])
    const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdown[]>([])

    const loadData = useCallback(async () => {
        setLoading(true)
        const [config, rates] = await Promise.all([getTaxConfig(), getAllTaxRates()])
        setTaxEnabled(config.enabled)
        setTaxInclusive(config.inclusive)
        setTaxRates(rates)
        setLoading(false)
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const loadReport = useCallback(async () => {
        const [report, breakdown] = await Promise.all([
            getTaxReport("2026"),
            getTaxBreakdownByRate(),
        ])
        setTaxReport(report)
        setTaxBreakdown(breakdown)
    }, [])

    useEffect(() => {
        if (activeTab === "report") loadReport()
    }, [activeTab, loadReport])

    const handleToggleTax = async (enabled: boolean) => {
        setTaxEnabled(enabled)
        await updateTaxConfig({ enabled })
        toast.success(enabled ? "Đã bật thuế VAT" : "Đã tắt thuế VAT")
    }

    const handleToggleInclusive = async (inclusive: boolean) => {
        setTaxInclusive(inclusive)
        await updateTaxConfig({ inclusive })
        toast.success(inclusive ? "Giá đã bao gồm VAT" : "Giá chưa bao gồm VAT")
    }

    const handleDeleteRate = async (id: string) => {
        await deleteTaxRate(id)
        toast.success("Đã xoá thuế suất")
        loadData()
    }

    const formatVND = (n: number) => n.toLocaleString("vi-VN") + "₫"

    if (loading) return <div className="text-center py-12 text-cream-400 text-sm">Đang tải...</div>

    return (
        <div>
            {/* Tab Switcher */}
            <div className="flex gap-1 mb-5 p-1 bg-cream-200 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab("config")}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                        activeTab === "config"
                            ? "bg-green-900 text-cream-50 shadow-sm"
                            : "text-cream-500 hover:text-green-800"
                    )}
                >
                    <BadgePercent className="h-3.5 w-3.5" />
                    Cấu hình thuế
                </button>
                <button
                    onClick={() => setActiveTab("report")}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                        activeTab === "report"
                            ? "bg-green-900 text-cream-50 shadow-sm"
                            : "text-cream-500 hover:text-green-800"
                    )}
                >
                    <FileText className="h-3.5 w-3.5" />
                    Báo cáo thuế
                </button>
            </div>

            {activeTab === "config" ? (
                <>
                    {/* System Toggle */}
                    <SettingGroup title="Cài đặt hệ thống thuế">
                        <SettingRow
                            label="Sử dụng thuế VAT"
                            description="Bật/tắt thuế cho toàn bộ hệ thống. Khi tắt, giá hiển thị sẽ không bao gồm thuế."
                        >
                            <Toggle checked={taxEnabled} onChange={handleToggleTax} />
                        </SettingRow>

                        {taxEnabled && (
                            <SettingRow
                                label="Giá đã bao gồm VAT"
                                description="Nếu bật: giá bán = giá cuối cùng (VAT đã tính trong). Nếu tắt: VAT cộng thêm vào giá bán."
                            >
                                <Toggle checked={taxInclusive} onChange={handleToggleInclusive} />
                            </SettingRow>
                        )}
                    </SettingGroup>

                    {taxEnabled && (
                        <>
                            {/* Tax Rates Table */}
                            <SettingGroup title="Bảng thuế suất">
                                <div className="rounded-lg border border-cream-200 overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-cream-200/60">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-semibold text-green-900">Tên</th>
                                                <th className="px-3 py-2 text-left font-semibold text-green-900">Mã</th>
                                                <th className="px-3 py-2 text-center font-semibold text-green-900">Thuế suất</th>
                                                <th className="px-3 py-2 text-left font-semibold text-green-900">Mô tả</th>
                                                <th className="px-3 py-2 text-center font-semibold text-green-900">Mặc định</th>
                                                <th className="px-3 py-2 text-center font-semibold text-green-900">Trạng thái</th>
                                                <th className="px-3 py-2 text-center font-semibold text-green-900">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-cream-200">
                                            {taxRates.map((rate) => (
                                                <tr key={rate.id} className={cn("hover:bg-cream-50 transition-colors", !rate.isActive && "opacity-50")}>
                                                    <td className="px-3 py-2.5 font-medium text-green-900">{rate.name}</td>
                                                    <td className="px-3 py-2.5">
                                                        <span className="font-mono bg-cream-200 px-1.5 py-0.5 rounded text-[10px]">{rate.code}</span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <span className="inline-flex items-center justify-center h-6 min-w-[40px] rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                                            {rate.rate}%
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-cream-500 max-w-[200px] truncate">{rate.description}</td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        {rate.isDefault && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 mx-auto" />}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <span className={cn(
                                                            "inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold",
                                                            rate.isActive
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-600"
                                                        )}>
                                                            {rate.isActive ? "Hoạt động" : "Tắt"}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => setEditingRate(rate)}
                                                                className="p-1 rounded hover:bg-cream-200 text-cream-400 hover:text-green-700 transition-colors"
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRate(rate.id)}
                                                                className="p-1 rounded hover:bg-red-50 text-cream-400 hover:text-red-600 transition-colors"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={() => setShowAddForm(true)}
                                    className="bg-green-900 text-cream-50 hover:bg-green-800 text-xs h-8"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Thêm thuế suất
                                </Button>
                            </SettingGroup>

                            {/* Info Card */}
                            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                                <p className="text-[10px] font-semibold text-amber-800 mb-1">📌 Lưu ý nghiệp vụ</p>
                                <ul className="text-[10px] text-amber-700 space-y-0.5 list-disc list-inside">
                                    <li><strong>Thuế đầu ra</strong>: VAT tính trên giá bán cho khách (theo thuế suất gán cho sản phẩm)</li>
                                    <li><strong>Thuế đầu vào</strong>: VAT trên hoá đơn mua hàng (ghi nhận khi nhập kho/PO)</li>
                                    <li><strong>Thuế phải nộp</strong> = Đầu ra − Đầu vào (khấu trừ đầy đủ)</li>
                                    <li>Quán sử dụng phương pháp khấu trừ → cần lưu hoá đơn GTGT đầu vào</li>
                                </ul>
                            </div>
                        </>
                    )}
                </>
            ) : (
                /* TAX REPORT TAB */
                <TaxReportView taxReport={taxReport} taxBreakdown={taxBreakdown} formatVND={formatVND} />
            )}

            {/* Add/Edit Modal */}
            {(showAddForm || editingRate) && (
                <TaxRateFormModal
                    rate={editingRate}
                    onClose={() => { setShowAddForm(false); setEditingRate(null) }}
                    onSaved={() => { setShowAddForm(false); setEditingRate(null); loadData() }}
                />
            )}
        </div>
    )
}

// ============================================================
// Tax Rate Form Modal
// ============================================================

function TaxRateFormModal({
    rate,
    onClose,
    onSaved,
}: {
    rate: TaxRate | null
    onClose: () => void
    onSaved: () => void
}) {
    const [name, setName] = useState(rate?.name ?? "")
    const [code, setCode] = useState(rate?.code ?? "")
    const [rateValue, setRateValue] = useState(rate?.rate?.toString() ?? "")
    const [description, setDescription] = useState(rate?.description ?? "")
    const [isDefault, setIsDefault] = useState(rate?.isDefault ?? false)
    const [saving, setSaving] = useState(false)

    const handleSubmit = async () => {
        if (!name || !code || rateValue === "") return

        setSaving(true)
        const data = {
            name,
            code: code.toUpperCase(),
            rate: parseFloat(rateValue),
            description: description || undefined,
            isDefault,
        }

        if (rate) {
            const res = await updateTaxRate(rate.id, data)
            if (res.success) toast.success("Đã cập nhật thuế suất")
            else toast.error(res.error?.message)
        } else {
            const res = await createTaxRate(data)
            if (res.success) toast.success("Đã thêm thuế suất mới")
            else toast.error(res.error?.message)
        }

        setSaving(false)
        onSaved()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-cream-100 rounded-xl border border-cream-300 p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-sm font-bold text-green-900">
                        {rate ? "Chỉnh sửa thuế suất" : "Thêm thuế suất mới"}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded hover:bg-cream-200 text-cream-400">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-semibold text-green-900 mb-1 block">Tên thuế suất *</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="VD: VAT 10%"
                            className="h-8 text-xs border-cream-300"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-semibold text-green-900 mb-1 block">Mã thuế *</label>
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="VD: VAT10"
                                className="h-8 text-xs font-mono border-cream-300"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-green-900 mb-1 block">Thuế suất (%) *</label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={rateValue}
                                onChange={(e) => setRateValue(e.target.value)}
                                placeholder="10"
                                className="h-8 text-xs border-cream-300"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-semibold text-green-900 mb-1 block">Mô tả</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả ngắn..."
                            className="h-8 text-xs border-cream-300"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Toggle checked={isDefault} onChange={setIsDefault} />
                        <span className="text-xs text-green-900">Thuế suất mặc định</span>
                    </div>
                </div>

                <div className="flex gap-2 mt-5">
                    <Button variant="outline" onClick={onClose} className="flex-1 text-xs h-8 border-cream-300">
                        Huỷ
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving || !name || !code || rateValue === ""}
                        className="flex-1 bg-green-900 text-cream-50 hover:bg-green-800 text-xs h-8"
                    >
                        {saving ? "Đang lưu..." : (rate ? "Cập nhật" : "Thêm")}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================================
// Tax Report View
// ============================================================

function TaxReportView({
    taxReport,
    taxBreakdown,
    formatVND,
}: {
    taxReport: TaxReportLine[]
    taxBreakdown: TaxBreakdown[]
    formatVND: (n: number) => string
}) {
    const totalOutput = taxReport.reduce((s, r) => s + r.outputTax, 0)
    const totalInput = taxReport.reduce((s, r) => s + r.inputTax, 0)
    const totalPayable = totalOutput - totalInput

    return (
        <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <p className="text-[10px] text-green-600 font-medium mb-0.5">Thuế đầu ra (Output)</p>
                    <p className="text-sm font-bold text-green-800">{formatVND(totalOutput)}</p>
                    <p className="text-[9px] text-green-500 mt-0.5">VAT trên doanh số bán hàng</p>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-[10px] text-blue-600 font-medium mb-0.5">Thuế đầu vào (Input)</p>
                    <p className="text-sm font-bold text-blue-800">{formatVND(totalInput)}</p>
                    <p className="text-[9px] text-blue-500 mt-0.5">VAT trên hoá đơn mua hàng</p>
                </div>
                <div className={cn(
                    "rounded-lg border p-3",
                    totalPayable >= 0
                        ? "bg-amber-50 border-amber-200"
                        : "bg-emerald-50 border-emerald-200"
                )}>
                    <p className={cn("text-[10px] font-medium mb-0.5", totalPayable >= 0 ? "text-amber-600" : "text-emerald-600")}>
                        {totalPayable >= 0 ? "Thuế phải nộp" : "Thuế được khấu trừ"}
                    </p>
                    <p className={cn("text-sm font-bold", totalPayable >= 0 ? "text-amber-800" : "text-emerald-800")}>
                        {formatVND(Math.abs(totalPayable))}
                    </p>
                    <p className={cn("text-[9px] mt-0.5", totalPayable >= 0 ? "text-amber-500" : "text-emerald-500")}>
                        Đầu ra − Đầu vào
                    </p>
                </div>
            </div>

            {/* Breakdown by Tax Rate */}
            <SettingGroup title="Phân tích theo thuế suất">
                <div className="rounded-lg border border-cream-200 overflow-hidden">
                    <table className="w-full text-xs">
                        <thead className="bg-cream-200/60">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold text-green-900">Thuế suất</th>
                                <th className="px-3 py-2 text-right font-semibold text-green-900">Doanh số</th>
                                <th className="px-3 py-2 text-right font-semibold text-green-900">VAT đầu ra</th>
                                <th className="px-3 py-2 text-center font-semibold text-green-900">Số HĐ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-200">
                            {taxBreakdown.map((b) => (
                                <tr key={b.taxRateCode} className="hover:bg-cream-50">
                                    <td className="px-3 py-2.5">
                                        <span className="font-medium text-green-900">{b.taxRateName}</span>
                                        <span className="ml-1.5 text-[9px] text-cream-400 font-mono">{b.taxRateCode}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-medium">{formatVND(b.totalSales)}</td>
                                    <td className="px-3 py-2.5 text-right font-medium text-amber-700">{formatVND(b.outputTax)}</td>
                                    <td className="px-3 py-2.5 text-center text-cream-500">{b.itemCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SettingGroup>

            {/* Monthly Report */}
            <SettingGroup title="Báo cáo thuế theo tháng (2026)">
                <div className="rounded-lg border border-cream-200 overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-cream-200/60 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold text-green-900">Kỳ</th>
                                <th className="px-3 py-2 text-right font-semibold text-green-900">Doanh thu</th>
                                <th className="px-3 py-2 text-right font-semibold text-green-900">Thuế đầu ra</th>
                                <th className="px-3 py-2 text-right font-semibold text-green-900">Mua hàng</th>
                                <th className="px-3 py-2 text-right font-semibold text-green-900">Thuế đầu vào</th>
                                <th className="px-3 py-2 text-right font-semibold text-green-900">Phải nộp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-200">
                            {taxReport.map((r) => (
                                <tr key={r.period} className="hover:bg-cream-50">
                                    <td className="px-3 py-2 font-medium text-green-900">{r.period}</td>
                                    <td className="px-3 py-2 text-right">{formatVND(r.totalRevenue)}</td>
                                    <td className="px-3 py-2 text-right text-green-700">{formatVND(r.outputTax)}</td>
                                    <td className="px-3 py-2 text-right">{formatVND(r.totalPurchases)}</td>
                                    <td className="px-3 py-2 text-right text-blue-600">{formatVND(r.inputTax)}</td>
                                    <td className={cn("px-3 py-2 text-right font-bold", r.taxPayable >= 0 ? "text-amber-700" : "text-emerald-600")}>
                                        {r.taxPayable >= 0 ? "" : "−"}{formatVND(Math.abs(r.taxPayable))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SettingGroup>
        </>
    )
}

// ============================================================
// EXISTING SETTINGS (kept from original)
// ============================================================

function StoreSettings() {
    const [name, setName] = useState("Noon & Noir")
    const [tagline, setTagline] = useState("Wine Alley")
    const [phone, setPhone] = useState("0901234567")
    const [address, setAddress] = useState("123 Đường Rượu Vang, Quận 1, TP.HCM")
    const [taxId, setTaxId] = useState("0123456789")
    const [currency, setCurrency] = useState("VND")

    return (
        <>
            <SettingGroup title="Thông tin cửa hàng">
                <SettingRow label="Tên quán" description="Hiển thị trên hoá đơn và ứng dụng">
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="w-48 h-8 text-xs border-cream-300" />
                </SettingRow>
                <SettingRow label="Tagline" description="Slogan hoặc mô tả ngắn">
                    <Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-48 h-8 text-xs border-cream-300" />
                </SettingRow>
                <SettingRow label="Số điện thoại">
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-48 h-8 text-xs border-cream-300" />
                </SettingRow>
                <SettingRow label="Địa chỉ">
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} className="w-64 h-8 text-xs border-cream-300" />
                </SettingRow>
            </SettingGroup>

            <SettingGroup title="Thuế & Tài chính">
                <SettingRow label="Mã số thuế">
                    <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="w-48 h-8 text-xs font-mono border-cream-300" />
                </SettingRow>
                <SettingRow label="Đơn vị tiền tệ">
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-48 h-8 rounded-md border border-cream-300 bg-cream-50 px-2 text-xs"
                    >
                        <option value="VND">VND (₫)</option>
                        <option value="USD">USD ($)</option>
                    </select>
                </SettingRow>
            </SettingGroup>

            <SettingGroup title="Giờ hoạt động">
                <SettingRow label="Giờ mở cửa">
                    <Input type="time" defaultValue="10:00" className="w-32 h-8 text-xs border-cream-300" />
                </SettingRow>
                <SettingRow label="Giờ đóng cửa">
                    <Input type="time" defaultValue="00:00" className="w-32 h-8 text-xs border-cream-300" />
                </SettingRow>
            </SettingGroup>
        </>
    )
}

function ReceiptSettings() {
    const [autoPrint, setAutoPrint] = useState(true)
    const [showLogo, setShowLogo] = useState(true)
    const [showFooter, setShowFooter] = useState(true)
    const [footerText, setFooterText] = useState("Cảm ơn quý khách! ♥")
    const [paperWidth, setPaperWidth] = useState("80")

    return (
        <>
            <SettingGroup title="In hoá đơn">
                <SettingRow label="Tự động in" description="In hoá đơn khi thanh toán thành công">
                    <Toggle checked={autoPrint} onChange={setAutoPrint} />
                </SettingRow>
                <SettingRow label="Hiện logo" description="Hiển thị logo Noon & Noir trên hoá đơn">
                    <Toggle checked={showLogo} onChange={setShowLogo} />
                </SettingRow>
                <SettingRow label="Khổ giấy" description="Kích thước cuộn giấy nhiệt">
                    <select
                        value={paperWidth}
                        onChange={(e) => setPaperWidth(e.target.value)}
                        className="w-32 h-8 rounded-md border border-cream-300 bg-cream-50 px-2 text-xs"
                    >
                        <option value="58">58mm</option>
                        <option value="80">80mm</option>
                    </select>
                </SettingRow>
            </SettingGroup>

            <SettingGroup title="Chân hoá đơn">
                <SettingRow label="Hiện footer" description="Thêm thông điệp cuối hoá đơn">
                    <Toggle checked={showFooter} onChange={setShowFooter} />
                </SettingRow>
                <SettingRow label="Nội dung footer">
                    <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-48 h-8 text-xs border-cream-300" />
                </SettingRow>
            </SettingGroup>
        </>
    )
}

function NotificationSettings() {
    const [newOrder, setNewOrder] = useState(true)
    const [lowStock, setLowStock] = useState(true)
    const [kitchenReady, setKitchenReady] = useState(true)
    const [dailyReport, setDailyReport] = useState(false)
    const [sound, setSound] = useState(true)

    return (
        <>
            <SettingGroup title="Thông báo đẩy">
                <SettingRow label="Đơn hàng mới" description="Thông báo khi có đơn hàng mới tạo">
                    <Toggle checked={newOrder} onChange={setNewOrder} />
                </SettingRow>
                <SettingRow label="Tồn kho thấp" description="Cảnh báo khi sản phẩm sắp hết hàng">
                    <Toggle checked={lowStock} onChange={setLowStock} />
                </SettingRow>
                <SettingRow label="Bếp sẵn sàng" description="Thông báo khi món ăn đã xong">
                    <Toggle checked={kitchenReady} onChange={setKitchenReady} />
                </SettingRow>
                <SettingRow label="Báo cáo hàng ngày" description="Gửi tóm tắt doanh thu lúc đóng cửa">
                    <Toggle checked={dailyReport} onChange={setDailyReport} />
                </SettingRow>
            </SettingGroup>

            <SettingGroup title="Âm thanh">
                <SettingRow label="Hiệu ứng âm thanh" description="Phát âm thanh khi có thông báo">
                    <Toggle checked={sound} onChange={setSound} />
                </SettingRow>
            </SettingGroup>
        </>
    )
}

function DisplaySettings() {
    const [darkMode, setDarkMode] = useState(false)
    const [compactMode, setCompactMode] = useState(false)
    const [showImages, setShowImages] = useState(true)
    const [language, setLanguage] = useState("vi")
    const [gridCols, setGridCols] = useState("4")

    return (
        <>
            {/* Theme Picker */}
            <ThemePicker />

            <div className="my-5 border-t border-cream-300" />

            <SettingGroup title="Giao diện">
                <SettingRow label="Chế độ tối" description="Sử dụng theme tối cho POS">
                    <Toggle checked={darkMode} onChange={setDarkMode} />
                </SettingRow>
                <SettingRow label="Chế độ compact" description="Giảm khoảng cách giữa các phần tử">
                    <Toggle checked={compactMode} onChange={setCompactMode} />
                </SettingRow>
                <SettingRow label="Hiện hình sản phẩm" description="Hiển thị ảnh thumbnail trong menu POS">
                    <Toggle checked={showImages} onChange={setShowImages} />
                </SettingRow>
            </SettingGroup>

            <SettingGroup title="Bố cục POS">
                <SettingRow label="Số cột sản phẩm" description="Số lượng cột hiển thị trong grid menu">
                    <select
                        value={gridCols}
                        onChange={(e) => setGridCols(e.target.value)}
                        className="w-32 h-8 rounded-md border border-cream-300 bg-cream-50 px-2 text-xs"
                    >
                        <option value="3">3 cột</option>
                        <option value="4">4 cột</option>
                        <option value="5">5 cột</option>
                    </select>
                </SettingRow>
                <SettingRow label="Ngôn ngữ" description="Ngôn ngữ hiển thị ứng dụng">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-32 h-8 rounded-md border border-cream-300 bg-cream-50 px-2 text-xs"
                    >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                    </select>
                </SettingRow>
            </SettingGroup>
        </>
    )
}

function SystemSettings() {
    const [autoBackup, setAutoBackup] = useState(true)
    const [sessionTimeout, setSessionTimeout] = useState("30")

    return (
        <>
            <SettingGroup title="Bảo mật">
                <SettingRow label="Tự động khoá" description="Khoá phiên sau thời gian không hoạt động">
                    <select
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(e.target.value)}
                        className="w-32 h-8 rounded-md border border-cream-300 bg-cream-50 px-2 text-xs"
                    >
                        <option value="15">15 phút</option>
                        <option value="30">30 phút</option>
                        <option value="60">1 giờ</option>
                        <option value="0">Không khoá</option>
                    </select>
                </SettingRow>
            </SettingGroup>

            <SettingGroup title="Dữ liệu">
                <SettingRow label="Tự động sao lưu" description="Sao lưu dữ liệu hàng ngày lúc 3:00 AM">
                    <Toggle checked={autoBackup} onChange={setAutoBackup} />
                </SettingRow>
                <SettingRow label="Database" description="Kết nối đến Supabase PostgreSQL">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">
                        Connected
                    </span>
                </SettingRow>
            </SettingGroup>

            <SettingGroup title="Phiên bản">
                <SettingRow label="POS Version" description="Noonnoir POS System">
                    <span className="font-mono text-[10px] text-cream-400">v1.0.0</span>
                </SettingRow>
                <SettingRow label="Framework" description="Next.js 16 + Tailwind CSS">
                    <span className="font-mono text-[10px] text-cream-400">Next.js 16.1.6</span>
                </SettingRow>
            </SettingGroup>
        </>
    )
}

// ============================================================
// SERVICE CHARGE SETTINGS
// ============================================================
function ServiceChargeSettings() {
    const [enabled, setEnabled] = useState(true)
    const [rate, setRate] = useState("5")
    const [applyTo, setApplyTo] = useState<"ALL" | "DINE_IN_ONLY">("DINE_IN_ONLY")
    const [label, setLabel] = useState("Phí dịch vụ")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getServiceChargeConfig().then((cfg) => {
            setEnabled(cfg.enabled)
            setRate(String(Math.round(cfg.rate * 100)))
            setApplyTo(cfg.applyTo)
            setLabel(cfg.label)
            setLoading(false)
        })
    }, [])

    const handleSave = async (field: string, value: unknown) => {
        await updateServiceChargeConfig({ [field]: value })
        toast.success("Đã cập nhật phí dịch vụ")
    }

    if (loading) return <div className="text-center py-12 text-cream-400 text-sm">Đang tải...</div>

    return (
        <>
            <SettingGroup title="Cấu hình phí dịch vụ (Service Charge)">
                <SettingRow label="Bật phí dịch vụ" description="Thu phí dịch vụ trên đơn hàng">
                    <Toggle checked={enabled} onChange={(v) => { setEnabled(v); handleSave("enabled", v) }} />
                </SettingRow>

                {enabled && (
                    <>
                        <SettingRow label="Tên hiển thị" description="Tên hiển thị trên hoá đơn">
                            <Input value={label} onChange={(e) => setLabel(e.target.value)} onBlur={() => handleSave("label", label)} className="w-40 h-8 text-xs border-cream-300" />
                        </SettingRow>
                        <SettingRow label="Phần trăm (%)" description="Tỷ lệ phí dịch vụ tính trên tổng tiền">
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    onBlur={() => handleSave("rate", Number(rate) / 100)}
                                    className="w-20 h-8 text-xs border-cream-300 text-center"
                                />
                                <span className="text-xs text-cream-400">%</span>
                            </div>
                        </SettingRow>
                        <SettingRow label="Áp dụng cho" description="Loại đơn hàng nào bị tính phí">
                            <select
                                value={applyTo}
                                onChange={(e) => {
                                    const v = e.target.value as "ALL" | "DINE_IN_ONLY"
                                    setApplyTo(v)
                                    handleSave("applyTo", v)
                                }}
                                className="w-40 h-8 rounded-md border border-cream-300 bg-cream-50 px-2 text-xs"
                            >
                                <option value="DINE_IN_ONLY">Chỉ dùng tại quán</option>
                                <option value="ALL">Tất cả đơn</option>
                            </select>
                        </SettingRow>
                    </>
                )}
            </SettingGroup>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-[10px] font-semibold text-blue-800 mb-1">💡 Hướng dẫn</p>
                <p className="text-[10px] text-blue-700">Phí dịch vụ sẽ tự động tính vào tổng đơn tại POS. Khách hàng sẽ thấy dòng “Phí dịch vụ X%” trên hoá đơn.</p>
            </div>
        </>
    )
}

// ============================================================
// QR / BANK PAYMENT SETTINGS
// ============================================================
function PaymentSettings() {
    const [config, setConfig] = useState<QRPaymentConfig | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getBankConfig().then((c) => { setConfig(c); setLoading(false) })
    }, [])

    const handleSave = async (field: string, value: string) => {
        if (!config) return
        const updated = { ...config, [field]: value }
        setConfig(updated)
        await updateBankConfig({ [field]: value })
        toast.success("Đã cập nhật thông tin ngân hàng")
    }

    if (loading || !config) return <div className="text-center py-12 text-cream-400 text-sm">Đang tải...</div>

    return (
        <>
            <SettingGroup title="Cấu hình VietQR / Ngân hàng">
                <SettingRow label="Tên ngân hàng" description="VD: MB Bank, Vietcombank, Techcombank">
                    <Input value={config.bankName} onChange={(e) => setConfig({ ...config, bankName: e.target.value })} onBlur={() => handleSave("bankName", config.bankName)} className="w-48 h-8 text-xs border-cream-300" />
                </SettingRow>
                <SettingRow label="Mã ngân hàng" description="Mã BIN theo VietQR (VD: 970422)">
                    <Input value={config.bankId} onChange={(e) => setConfig({ ...config, bankId: e.target.value })} onBlur={() => handleSave("bankId", config.bankId)} className="w-32 h-8 text-xs font-mono border-cream-300" />
                </SettingRow>
                <SettingRow label="Số tài khoản" description="Số tài khoản nhận tiền">
                    <Input value={config.accountNumber} onChange={(e) => setConfig({ ...config, accountNumber: e.target.value })} onBlur={() => handleSave("accountNumber", config.accountNumber)} className="w-48 h-8 text-xs font-mono border-cream-300" />
                </SettingRow>
                <SettingRow label="Chủ tài khoản" description="Tên chủ TK (in hoa, không dấu)">
                    <Input value={config.accountName} onChange={(e) => setConfig({ ...config, accountName: e.target.value })} onBlur={() => handleSave("accountName", config.accountName)} className="w-56 h-8 text-xs border-cream-300" />
                </SettingRow>
                <SettingRow label="Template QR" description="Kiểu hiển thị mã QR">
                    <select value={config.template} onChange={(e) => handleSave("template", e.target.value)} className="w-36 h-8 rounded-md border border-cream-300 bg-cream-50 px-2 text-xs">
                        <option value="compact">Compact</option>
                        <option value="compact2">Compact 2</option>
                        <option value="print">Print</option>
                    </select>
                </SettingRow>
            </SettingGroup>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-[10px] font-semibold text-amber-800 mb-1">🏦 Lưu ý</p>
                <p className="text-[10px] text-amber-700">Thông tin này sẽ được dùng để tạo mã QR VietQR khi khách chọn thanh toán chuyển khoản tại POS.</p>
            </div>
        </>
    )
}

// ============================================================
// HR SETTINGS — Full HR Configuration
// ============================================================
function HrSettings() {
    const [config, setConfig] = useState<HrConfigData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<"shifts" | "attendance" | "payroll" | "leave" | "roles">("shifts")

    useEffect(() => {
        (async () => {
            const data = await getHrConfig()
            setConfig(data)
            setLoading(false)
        })()
    }, [])

    const handleSave = async (updates: Partial<HrConfigData>) => {
        setSaving(true)
        const merged = { ...config, ...updates } as HrConfigData
        setConfig(merged)
        const result = await updateHrConfig(updates)
        setSaving(false)
        if (result.success) toast.success("Đã lưu cài đặt nhân sự")
        else toast.error("Lỗi lưu cài đặt")
    }

    const formatVND = (n: number) => n.toLocaleString("vi-VN") + "₫"

    if (loading || !config) return <div className="text-center py-12 text-cream-400 text-sm">Đang tải cấu hình HR...</div>

    const tabs = [
        { key: "shifts" as const, label: "Ca làm", icon: Clock },
        { key: "attendance" as const, label: "Chấm công", icon: Calendar },
        { key: "payroll" as const, label: "Lương", icon: Wallet },
        { key: "leave" as const, label: "Nghỉ phép", icon: Calendar },
        { key: "roles" as const, label: "Vai trò", icon: Briefcase },
    ]

    return (
        <div>
            {/* Sub-Tab Navigation */}
            <div className="flex gap-1 mb-5 p-1 bg-cream-200 rounded-lg w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                activeTab === tab.key
                                    ? "bg-green-900 text-cream-50 shadow-sm"
                                    : "text-cream-500 hover:text-green-800"
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* ===== SHIFTS TAB ===== */}
            {activeTab === "shifts" && (
                <>
                    <SettingGroup title="Định nghĩa ca làm việc">
                        <div className="rounded-lg border border-cream-200 overflow-hidden">
                            <table className="w-full text-xs">
                                <thead className="bg-cream-200/60">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-green-900">Tên ca</th>
                                        <th className="px-3 py-2 text-center font-semibold text-green-900">Bắt đầu</th>
                                        <th className="px-3 py-2 text-center font-semibold text-green-900">Kết thúc</th>
                                        <th className="px-3 py-2 text-center font-semibold text-green-900">Màu</th>
                                        <th className="px-3 py-2 text-center font-semibold text-green-900">Kích hoạt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-cream-200">
                                    {config.shifts.map((shift, idx) => (
                                        <tr key={shift.key} className="hover:bg-cream-50 transition-colors">
                                            <td className="px-3 py-2.5">
                                                <Input
                                                    value={shift.label}
                                                    onChange={(e) => {
                                                        const newShifts = [...config.shifts]
                                                        newShifts[idx] = { ...shift, label: e.target.value }
                                                        setConfig({ ...config, shifts: newShifts })
                                                    }}
                                                    className="h-7 w-32 text-xs border-cream-300"
                                                />
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <Input
                                                    type="time"
                                                    value={shift.startTime}
                                                    onChange={(e) => {
                                                        const newShifts = [...config.shifts]
                                                        newShifts[idx] = { ...shift, startTime: e.target.value }
                                                        setConfig({ ...config, shifts: newShifts })
                                                    }}
                                                    className="h-7 w-28 text-xs border-cream-300"
                                                />
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <Input
                                                    type="time"
                                                    value={shift.endTime}
                                                    onChange={(e) => {
                                                        const newShifts = [...config.shifts]
                                                        newShifts[idx] = { ...shift, endTime: e.target.value }
                                                        setConfig({ ...config, shifts: newShifts })
                                                    }}
                                                    className="h-7 w-28 text-xs border-cream-300"
                                                />
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <input
                                                    type="color"
                                                    value={shift.color}
                                                    onChange={(e) => {
                                                        const newShifts = [...config.shifts]
                                                        newShifts[idx] = { ...shift, color: e.target.value }
                                                        setConfig({ ...config, shifts: newShifts })
                                                    }}
                                                    className="h-7 w-10 rounded border border-cream-300 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <Toggle
                                                    checked={shift.isActive}
                                                    onChange={(v) => {
                                                        const newShifts = [...config.shifts]
                                                        newShifts[idx] = { ...shift, isActive: v }
                                                        setConfig({ ...config, shifts: newShifts })
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => handleSave({ shifts: config.shifts })}
                            disabled={saving}
                            className="bg-green-900 text-cream-50 hover:bg-green-800 text-xs h-8 mt-2"
                        >
                            <Save className="h-3.5 w-3.5 mr-1" />
                            {saving ? "Đang lưu..." : "Lưu cài đặt ca"}
                        </Button>
                    </SettingGroup>

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mt-4">
                        <p className="text-[10px] font-semibold text-amber-800 mb-1">📌 Lưu ý</p>
                        <p className="text-[10px] text-amber-700">Thay đổi thời gian ca sẽ áp dụng cho các lịch ca mới. Lịch ca đã gán trước đó sẽ không bị ảnh hưởng.</p>
                    </div>
                </>
            )}

            {/* ===== ATTENDANCE TAB ===== */}
            {activeTab === "attendance" && (
                <SettingGroup title="Quy tắc chấm công">
                    <SettingRow
                        label="Dung sai đi muộn (phút)"
                        description="Số phút sau giờ bắt đầu ca được phép trễ mà không bị tính đi muộn"
                    >
                        <Input
                            type="number"
                            min="0"
                            max="120"
                            value={config.attendance.lateTolerance}
                            onChange={(e) => setConfig({
                                ...config,
                                attendance: { ...config.attendance, lateTolerance: parseInt(e.target.value) || 0 }
                            })}
                            className="w-20 h-8 text-xs border-cream-300 text-center"
                        />
                    </SettingRow>
                    <SettingRow
                        label="Ngưỡng tính vắng (phút)"
                        description="Sau bao nhiêu phút không check-in sẽ tự động tính vắng mặt"
                    >
                        <Input
                            type="number"
                            min="0"
                            max="480"
                            value={config.attendance.absentThreshold}
                            onChange={(e) => setConfig({
                                ...config,
                                attendance: { ...config.attendance, absentThreshold: parseInt(e.target.value) || 0 }
                            })}
                            className="w-20 h-8 text-xs border-cream-300 text-center"
                        />
                    </SettingRow>
                    <SettingRow
                        label="Giờ tự động check-out"
                        description="Hệ thống sẽ tự checkout nếu nhân viên quên"
                    >
                        <Input
                            type="time"
                            value={config.attendance.autoCheckoutHour}
                            onChange={(e) => setConfig({
                                ...config,
                                attendance: { ...config.attendance, autoCheckoutHour: e.target.value }
                            })}
                            className="w-28 h-8 text-xs border-cream-300"
                        />
                    </SettingRow>
                    <SettingRow
                        label="Giờ làm tối thiểu / ngày"
                        description="Số giờ tối thiểu để tính đủ 1 ngày công"
                    >
                        <Input
                            type="number"
                            min="1"
                            max="24"
                            value={config.attendance.minWorkHours}
                            onChange={(e) => setConfig({
                                ...config,
                                attendance: { ...config.attendance, minWorkHours: parseInt(e.target.value) || 8 }
                            })}
                            className="w-20 h-8 text-xs border-cream-300 text-center"
                        />
                    </SettingRow>
                    <SettingRow
                        label="Yêu cầu ảnh check-in"
                        description="Bắt buộc chụp ảnh selfie khi check-in"
                    >
                        <Toggle
                            checked={config.attendance.requirePhoto}
                            onChange={(v) => setConfig({
                                ...config,
                                attendance: { ...config.attendance, requirePhoto: v }
                            })}
                        />
                    </SettingRow>

                    <Button
                        size="sm"
                        onClick={() => handleSave({ attendance: config.attendance })}
                        disabled={saving}
                        className="bg-green-900 text-cream-50 hover:bg-green-800 text-xs h-8 mt-2"
                    >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {saving ? "Đang lưu..." : "Lưu quy tắc chấm công"}
                    </Button>
                </SettingGroup>
            )}

            {/* ===== PAYROLL TAB ===== */}
            {activeTab === "payroll" && (
                <>
                    <SettingGroup title="Cấu hình lương cơ bản">
                        <SettingRow
                            label="Giờ chuẩn / ngày"
                            description="Số giờ làm tiêu chuẩn mỗi ngày"
                        >
                            <Input
                                type="number"
                                min="1"
                                max="24"
                                value={config.payroll.standardHoursPerDay}
                                onChange={(e) => setConfig({
                                    ...config,
                                    payroll: { ...config.payroll, standardHoursPerDay: parseInt(e.target.value) || 8 }
                                })}
                                className="w-20 h-8 text-xs border-cream-300 text-center"
                            />
                        </SettingRow>
                        <SettingRow
                            label="Hệ số OT (overtime)"
                            description="Hệ số nhân cho giờ làm thêm (VD: 1.5 = +50%)"
                        >
                            <Input
                                type="number"
                                min="1"
                                max="5"
                                step="0.1"
                                value={config.payroll.overtimeMultiplier}
                                onChange={(e) => setConfig({
                                    ...config,
                                    payroll: { ...config.payroll, overtimeMultiplier: parseFloat(e.target.value) || 1.5 }
                                })}
                                className="w-20 h-8 text-xs border-cream-300 text-center"
                            />
                        </SettingRow>
                        <SettingRow
                            label="Hệ số ca đêm"
                            description="Hệ số nhân cho ca tối/đêm"
                        >
                            <Input
                                type="number"
                                min="1"
                                max="5"
                                step="0.1"
                                value={config.payroll.nightShiftMultiplier}
                                onChange={(e) => setConfig({
                                    ...config,
                                    payroll: { ...config.payroll, nightShiftMultiplier: parseFloat(e.target.value) || 1.3 }
                                })}
                                className="w-20 h-8 text-xs border-cream-300 text-center"
                            />
                        </SettingRow>
                        <SettingRow
                            label="Ngày trả lương"
                            description="Ngày trong tháng để trả lương"
                        >
                            <Input
                                type="number"
                                min="1"
                                max="31"
                                value={config.payroll.payDay}
                                onChange={(e) => setConfig({
                                    ...config,
                                    payroll: { ...config.payroll, payDay: parseInt(e.target.value) || 5 }
                                })}
                                className="w-20 h-8 text-xs border-cream-300 text-center"
                            />
                        </SettingRow>
                    </SettingGroup>

                    <SettingGroup title="Thưởng doanh thu">
                        <SettingRow
                            label="Bật thưởng doanh thu"
                            description="Tính thưởng thêm dựa trên doanh thu cá nhân"
                        >
                            <Toggle
                                checked={config.payroll.bonusEnabled}
                                onChange={(v) => setConfig({
                                    ...config,
                                    payroll: { ...config.payroll, bonusEnabled: v }
                                })}
                            />
                        </SettingRow>

                        {config.payroll.bonusEnabled && (
                            <>
                                <SettingRow
                                    label="Loại thưởng"
                                    description="Thưởng cố định hoặc theo % doanh thu"
                                >
                                    <select
                                        value={config.payroll.bonusType}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            payroll: { ...config.payroll, bonusType: e.target.value as "FIXED" | "PERCENT_REVENUE" }
                                        })}
                                        className="w-40 h-8 rounded-md border border-cream-300 bg-cream-50 px-2 text-xs"
                                    >
                                        <option value="PERCENT_REVENUE">% Doanh thu</option>
                                        <option value="FIXED">Cố định</option>
                                    </select>
                                </SettingRow>
                                <SettingRow
                                    label="Ngưỡng kích hoạt thưởng"
                                    description={`Doanh thu tối thiểu để nhận thưởng (hiện: ${formatVND(config.payroll.bonusThreshold)})`}
                                >
                                    <Input
                                        type="number"
                                        min="0"
                                        step="1000000"
                                        value={config.payroll.bonusThreshold}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            payroll: { ...config.payroll, bonusThreshold: parseInt(e.target.value) || 0 }
                                        })}
                                        className="w-36 h-8 text-xs border-cream-300"
                                    />
                                </SettingRow>
                                <SettingRow
                                    label={config.payroll.bonusType === "PERCENT_REVENUE" ? "% Thưởng" : "Số tiền thưởng"}
                                    description={config.payroll.bonusType === "PERCENT_REVENUE" ? "% doanh thu cá nhân" : "Số tiền thưởng cố định"}
                                >
                                    <Input
                                        type="number"
                                        min="0"
                                        step={config.payroll.bonusType === "PERCENT_REVENUE" ? "0.5" : "100000"}
                                        value={config.payroll.bonusValue}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            payroll: { ...config.payroll, bonusValue: parseFloat(e.target.value) || 0 }
                                        })}
                                        className="w-28 h-8 text-xs border-cream-300 text-center"
                                    />
                                </SettingRow>
                            </>
                        )}
                    </SettingGroup>

                    <SettingGroup title="Phí dịch vụ cho nhân viên">
                        <SettingRow
                            label="Chia phí dịch vụ cho NV"
                            description="Trích % phí dịch vụ (service charge) vào lương nhân viên"
                        >
                            <Toggle
                                checked={config.payroll.includeServiceCharge}
                                onChange={(v) => setConfig({
                                    ...config,
                                    payroll: { ...config.payroll, includeServiceCharge: v }
                                })}
                            />
                        </SettingRow>
                        {config.payroll.includeServiceCharge && (
                            <SettingRow
                                label="% phí dịch vụ chia cho NV"
                                description="Phần trăm phí dịch vụ chia cho tất cả nhân viên"
                            >
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={config.payroll.serviceChargePercent}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        payroll: { ...config.payroll, serviceChargePercent: parseInt(e.target.value) || 0 }
                                    })}
                                    className="w-20 h-8 text-xs border-cream-300 text-center"
                                />
                            </SettingRow>
                        )}
                    </SettingGroup>

                    <Button
                        size="sm"
                        onClick={() => handleSave({ payroll: config.payroll })}
                        disabled={saving}
                        className="bg-green-900 text-cream-50 hover:bg-green-800 text-xs h-8"
                    >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {saving ? "Đang lưu..." : "Lưu cài đặt lương"}
                    </Button>
                </>
            )}

            {/* ===== LEAVE TAB ===== */}
            {activeTab === "leave" && (
                <SettingGroup title="Chính sách nghỉ phép">
                    <SettingRow
                        label="Phép năm (ngày)"
                        description="Số ngày phép năm mỗi nhân viên được hưởng"
                    >
                        <Input
                            type="number"
                            min="0"
                            max="30"
                            value={config.leave.annualLeaveDays}
                            onChange={(e) => setConfig({
                                ...config,
                                leave: { ...config.leave, annualLeaveDays: parseInt(e.target.value) || 0 }
                            })}
                            className="w-20 h-8 text-xs border-cream-300 text-center"
                        />
                    </SettingRow>
                    <SettingRow
                        label="Nghỉ ốm (ngày)"
                        description="Số ngày nghỉ ốm có lương"
                    >
                        <Input
                            type="number"
                            min="0"
                            max="30"
                            value={config.leave.sickLeaveDays}
                            onChange={(e) => setConfig({
                                ...config,
                                leave: { ...config.leave, sickLeaveDays: parseInt(e.target.value) || 0 }
                            })}
                            className="w-20 h-8 text-xs border-cream-300 text-center"
                        />
                    </SettingRow>
                    <SettingRow
                        label="Cho phép cộng dồn phép"
                        description="Phép năm chưa dùng có thể chuyển sang năm sau"
                    >
                        <Toggle
                            checked={config.leave.carryOverEnabled}
                            onChange={(v) => setConfig({
                                ...config,
                                leave: { ...config.leave, carryOverEnabled: v }
                            })}
                        />
                    </SettingRow>
                    {config.leave.carryOverEnabled && (
                        <SettingRow
                            label="Số ngày cộng dồn tối đa"
                            description="Giới hạn số ngày phép cộng dồn sang năm mới"
                        >
                            <Input
                                type="number"
                                min="0"
                                max="30"
                                value={config.leave.maxCarryOverDays}
                                onChange={(e) => setConfig({
                                    ...config,
                                    leave: { ...config.leave, maxCarryOverDays: parseInt(e.target.value) || 0 }
                                })}
                                className="w-20 h-8 text-xs border-cream-300 text-center"
                            />
                        </SettingRow>
                    )}
                    <SettingRow
                        label="Yêu cầu phê duyệt"
                        description="Nghỉ phép phải được quản lý phê duyệt trước"
                    >
                        <Toggle
                            checked={config.leave.requireApproval}
                            onChange={(v) => setConfig({
                                ...config,
                                leave: { ...config.leave, requireApproval: v }
                            })}
                        />
                    </SettingRow>

                    <Button
                        size="sm"
                        onClick={() => handleSave({ leave: config.leave })}
                        disabled={saving}
                        className="bg-green-900 text-cream-50 hover:bg-green-800 text-xs h-8 mt-2"
                    >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {saving ? "Đang lưu..." : "Lưu chính sách nghỉ phép"}
                    </Button>
                </SettingGroup>
            )}

            {/* ===== ROLES TAB ===== */}
            {activeTab === "roles" && (
                <SettingGroup title="Vai trò & Thang lương">
                    <div className="rounded-lg border border-cream-200 overflow-hidden">
                        <table className="w-full text-xs">
                            <thead className="bg-cream-200/60">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-green-900">Vai trò</th>
                                    <th className="px-3 py-2 text-left font-semibold text-green-900">Mã</th>
                                    <th className="px-3 py-2 text-right font-semibold text-green-900">Lương tối thiểu</th>
                                    <th className="px-3 py-2 text-right font-semibold text-green-900">Lương tối đa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cream-200">
                                {config.roles.map((role, idx) => (
                                    <tr key={role.key} className="hover:bg-cream-50 transition-colors">
                                        <td className="px-3 py-2.5">
                                            <Input
                                                value={role.label}
                                                onChange={(e) => {
                                                    const newRoles = [...config.roles]
                                                    newRoles[idx] = { ...role, label: e.target.value }
                                                    setConfig({ ...config, roles: newRoles })
                                                }}
                                                className="h-7 w-32 text-xs border-cream-300"
                                            />
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className="font-mono bg-cream-200 px-1.5 py-0.5 rounded text-[10px]">{role.key}</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="500000"
                                                value={role.minSalary}
                                                onChange={(e) => {
                                                    const newRoles = [...config.roles]
                                                    newRoles[idx] = { ...role, minSalary: parseInt(e.target.value) || 0 }
                                                    setConfig({ ...config, roles: newRoles })
                                                }}
                                                className="h-7 w-32 text-xs border-cream-300 text-right"
                                            />
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="500000"
                                                value={role.maxSalary}
                                                onChange={(e) => {
                                                    const newRoles = [...config.roles]
                                                    newRoles[idx] = { ...role, maxSalary: parseInt(e.target.value) || 0 }
                                                    setConfig({ ...config, roles: newRoles })
                                                }}
                                                className="h-7 w-32 text-xs border-cream-300 text-right"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                        {config.roles.map((role) => (
                            <div key={role.key} className="flex-1 rounded-lg bg-cream-200/50 border border-cream-200 p-3 text-center">
                                <p className="text-xs font-bold text-green-900">{role.label}</p>
                                <p className="text-[9px] text-cream-400 mt-1">
                                    {formatVND(role.minSalary)} — {formatVND(role.maxSalary)}
                                </p>
                            </div>
                        ))}
                    </div>

                    <Button
                        size="sm"
                        onClick={() => handleSave({ roles: config.roles })}
                        disabled={saving}
                        className="bg-green-900 text-cream-50 hover:bg-green-800 text-xs h-8 mt-4"
                    >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {saving ? "Đang lưu..." : "Lưu cấu hình vai trò"}
                    </Button>
                </SettingGroup>
            )}
        </div>
    )
}

// ============================================================
// OPERATIONAL SETTINGS
// ============================================================
function OperationalSettings() {
    const [discountThreshold, setDiscountThreshold] = useState("10")

    return (
        <>
            <SettingGroup title="Giới hạn giảm giá">
                <SettingRow label="Ngưỡng giảm giá cần xác thực" description="Giảm giá vượt mức này cần Manager PIN">
                    <div className="flex items-center gap-1">
                        <Input
                            type="number"
                            min={5}
                            max={50}
                            value={discountThreshold}
                            onChange={(e) => setDiscountThreshold(e.target.value)}
                            className="w-20 h-8 text-xs border-cream-300 text-center"
                        />
                        <span className="text-xs text-cream-400">%</span>
                    </div>
                </SettingRow>
            </SettingGroup>

            <SettingGroup title="Manager PIN’s">
                <div className="rounded-lg bg-cream-50 border border-cream-200 p-3">
                    <p className="text-[10px] text-cream-500 mb-2">Danh sách PIN Manager/Owner được quản lý qua module Nhân sự. Nhân viên có role MANAGER hoặc OWNER được dùng PIN để xác thực giảm giá.</p>
                    <p className="text-[10px] text-cream-400">Đi đến: Quản lý → Nhân sự để cập nhật PIN.</p>
                </div>
            </SettingGroup>

            <SettingGroup title="86 / Hết hàng">
                <div className="rounded-lg bg-cream-50 border border-cream-200 p-3">
                    <p className="text-[10px] text-cream-500">Sản phẩm bị đánh dấu 86 (hết hàng) sẽ tự động ẩn khỏi POS. Nhân viên bếp có thể đánh dấu/bỏ đánh dấu trực tiếp từ Kitchen Display.</p>
                </div>
            </SettingGroup>
        </>
    )
}
