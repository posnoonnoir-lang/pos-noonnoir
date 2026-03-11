"use client"

import { useState, useEffect, useCallback } from "react"
import {
    AlertTriangle,
    RefreshCw,
    ShieldAlert,
    AlertCircle,
    Info,
    Package,
    ChevronDown,
    ChevronUp,
    ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getInventoryAlerts, type InventoryAlert, type AlertSeverity } from "@/actions/inventory-alerts"

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ComponentType<{ className?: string }> }> = {
    CRITICAL: {
        label: "Quan trọng",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: ShieldAlert,
    },
    WARNING: {
        label: "Cảnh báo",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: AlertCircle,
    },
    INFO: {
        label: "Thông tin",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        icon: Info,
    },
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<InventoryAlert[]>([])
    const [loading, setLoading] = useState(true)
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
    const [expandedSeverity, setExpandedSeverity] = useState<Record<string, boolean>>({
        CRITICAL: true,
        WARNING: true,
        INFO: false,
    })

    const loadAlerts = useCallback(async () => {
        setLoading(true)
        const data = await getInventoryAlerts()
        setAlerts(data)
        setLastRefresh(new Date())
        setLoading(false)
    }, [])

    useEffect(() => {
        loadAlerts()
        const interval = setInterval(loadAlerts, 60000)
        return () => clearInterval(interval)
    }, [loadAlerts])

    const criticalAlerts = alerts.filter((a) => a.severity === "CRITICAL")
    const warningAlerts = alerts.filter((a) => a.severity === "WARNING")
    const infoAlerts = alerts.filter((a) => a.severity === "INFO")

    const grouped: { severity: AlertSeverity; items: InventoryAlert[] }[] = [
        { severity: "CRITICAL", items: criticalAlerts },
        { severity: "WARNING", items: warningAlerts },
        { severity: "INFO", items: infoAlerts },
    ]

    return (
        <div className="p-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-green-900 flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                        Cảnh báo Tồn kho
                    </h1>
                    <p className="text-sm text-cream-500 mt-0.5">
                        Giám sát tình trạng kho, oxy hóa, hết hạn, và xu hướng bán hàng
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-cream-400">
                        Cập nhật: {lastRefresh.toLocaleTimeString("vi-VN")}
                    </span>
                    <Button
                        onClick={loadAlerts}
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
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-bold uppercase text-red-700">Quan trọng</span>
                    </div>
                    <p className="mt-1 font-mono text-2xl font-bold text-red-800">{criticalAlerts.length}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-bold uppercase text-amber-700">Cảnh báo</span>
                    </div>
                    <p className="mt-1 font-mono text-2xl font-bold text-amber-800">{warningAlerts.length}</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-bold uppercase text-blue-700">Thông tin</span>
                    </div>
                    <p className="mt-1 font-mono text-2xl font-bold text-blue-800">{infoAlerts.length}</p>
                </div>
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-bold uppercase text-green-700">Tổng cộng</span>
                    </div>
                    <p className="mt-1 font-mono text-2xl font-bold text-green-800">{alerts.length}</p>
                </div>
            </div>

            {/* Alert Groups */}
            <div className="space-y-4">
                {grouped.map(({ severity, items }) => {
                    const config = SEVERITY_CONFIG[severity]
                    const isExpanded = expandedSeverity[severity]
                    const Icon = config.icon

                    return (
                        <div key={severity} className={cn("rounded-xl border", config.borderColor, config.bgColor)}>
                            {/* Group Header */}
                            <button
                                onClick={() =>
                                    setExpandedSeverity((prev) => ({ ...prev, [severity]: !prev[severity] }))
                                }
                                className="flex w-full items-center justify-between px-5 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className={cn("h-4 w-4", config.color)} />
                                    <span className={cn("text-sm font-bold", config.color)}>
                                        {config.label}
                                    </span>
                                    <Badge className={cn("text-[10px] px-1.5 py-0", config.bgColor, config.color, "border", config.borderColor)}>
                                        {items.length}
                                    </Badge>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className={cn("h-4 w-4", config.color)} />
                                ) : (
                                    <ChevronDown className={cn("h-4 w-4", config.color)} />
                                )}
                            </button>

                            {/* Alert Items */}
                            {isExpanded && items.length > 0 && (
                                <div className="border-t px-5 pb-4 pt-2 space-y-2" style={{ borderColor: "inherit" }}>
                                    {items.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className="flex items-start gap-3 rounded-lg bg-white/80 border border-cream-200 px-4 py-3 hover:shadow-sm transition-all"
                                        >
                                            <span className="text-lg mt-0.5">{alert.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xs font-bold text-green-900">
                                                        {alert.title}
                                                    </h4>
                                                    {alert.type && (
                                                        <Badge className="text-[8px] px-1 py-0 bg-cream-200 text-cream-600 border-cream-300">
                                                            {alert.type.replace(/_/g, " ")}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-xs text-cream-500">
                                                    {alert.description}
                                                </p>
                                                {alert.action && (
                                                    <p className="mt-1 text-[10px] text-green-700 font-medium flex items-center gap-1">
                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                        {alert.action}
                                                    </p>
                                                )}
                                            </div>
                                            {alert.value && (
                                                <div className="shrink-0 text-right">
                                                    <span className="font-mono text-xs font-bold text-green-900">
                                                        {alert.value}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isExpanded && items.length === 0 && (
                                <div className="border-t px-5 py-4 text-center" style={{ borderColor: "inherit" }}>
                                    <p className="text-xs text-cream-400">✅ Không có cảnh báo nào</p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer note */}
            <div className="mt-6 text-center">
                <p className="text-[10px] text-cream-400 italic">
                    Tự động cập nhật mỗi 60 giây · Dữ liệu từ hệ thống kho, đơn hàng, và thời gian mở chai
                </p>
            </div>
        </div>
    )
}
