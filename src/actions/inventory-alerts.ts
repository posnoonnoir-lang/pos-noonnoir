"use server"

// ============================================================
// INVENTORY ALERTS — V2 Feature 4
// Dashboard alerts for stock, oxidation, expiry, etc.
// ============================================================

export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO"

export type InventoryAlert = {
    id: string
    severity: AlertSeverity
    type: string
    icon: string
    title: string
    description: string
    productName?: string
    productSku?: string
    value?: string
    action?: string
}

export async function getInventoryAlerts(): Promise<InventoryAlert[]> {
    const alerts: InventoryAlert[] = []

    // 🔴 CRITICAL: Out of stock wines
    alerts.push({
        id: "oos-1",
        severity: "CRITICAL",
        type: "OUT_OF_STOCK",
        icon: "🔴",
        title: "Hết hàng",
        description: "Château Lafite 2016 — 0 chai trong kho",
        productName: "Château Lafite 2016",
        productSku: "WB-010",
        action: "Đặt hàng NCC ngay",
    })
    alerts.push({
        id: "oos-2",
        severity: "CRITICAL",
        type: "OUT_OF_STOCK",
        icon: "🔴",
        title: "Hết hàng",
        description: "Merlot Glass — không có chai nào mở hoặc tồn",
        productName: "Merlot Glass",
        productSku: "WG-005",
        action: "Nhập thêm Merlot bottles",
    })

    // 🔴 CRITICAL: Oxidation risk — opened bottles past threshold
    alerts.push({
        id: "oxi-1",
        severity: "CRITICAL",
        type: "OXIDATION_RISK",
        icon: "🍷",
        title: "Nguy cơ oxy hóa",
        description: "Cloudy Bay SB 2022 — mở 52 giờ trước (ngưỡng: 48h)",
        productName: "Cloudy Bay Sauvignon Blanc 2022",
        productSku: "WB-003",
        value: "52h / 48h max",
        action: "Push sale hoặc ghi nhận waste",
    })
    alerts.push({
        id: "oxi-2",
        severity: "CRITICAL",
        type: "OXIDATION_RISK",
        icon: "🍷",
        title: "Nguy cơ oxy hóa",
        description: "Rosé Provence — mở 30 giờ trước (ngưỡng: 24h Sparkling)",
        productName: "Rosé Provence",
        productSku: "WB-008",
        value: "30h / 24h max",
        action: "Giảm giá để bán nhanh",
    })

    // 🟠 WARNING: Low stock
    alerts.push({
        id: "low-1",
        severity: "WARNING",
        type: "LOW_STOCK",
        icon: "🟠",
        title: "Tồn kho thấp",
        description: "Opus One 2019 — còn 2 chai (ngưỡng: 2)",
        productName: "Opus One 2019",
        productSku: "WB-002",
        value: "2 / min 2",
        action: "Lên PO bổ sung",
    })
    alerts.push({
        id: "low-2",
        severity: "WARNING",
        type: "LOW_STOCK",
        icon: "🟠",
        title: "Tồn kho thấp",
        description: "Phô mai Gouda — còn 400g (ngưỡng: 500g)",
        productName: "Phô mai Gouda",
        productSku: "ING-003",
        value: "400g / min 500g",
        action: "Nhập thêm nguyên liệu",
    })

    // 🟡 CAUTION: Slow-moving inventory
    alerts.push({
        id: "slow-1",
        severity: "WARNING",
        type: "SLOW_MOVING",
        icon: "🐌",
        title: "Hàng tồn lâu",
        description: "Barolo 2017 — không bán 21 ngày (ngưỡng: 14 ngày)",
        productName: "Barolo 2017",
        productSku: "WB-007",
        value: "21 ngày không bán",
        action: "Làm promo hoặc push sale",
    })
    alerts.push({
        id: "slow-2",
        severity: "WARNING",
        type: "SLOW_MOVING",
        icon: "🐌",
        title: "Hàng tồn lâu",
        description: "Tiramisu — không bán 16 ngày",
        productName: "Tiramisu",
        productSku: "DS-001",
        value: "16 ngày không bán",
        action: "Kiểm tra chất lượng",
    })

    // 💰 INFO: High capital tied up
    alerts.push({
        id: "cap-1",
        severity: "INFO",
        type: "HIGH_CAPITAL",
        icon: "💰",
        title: "Vốn tồn đọng",
        description: "Opus One — 12 chai × ₫6,000,000 = ₫72,000,000",
        productName: "Opus One 2019",
        productSku: "WB-002",
        value: "₫72,000,000",
        action: "Cân nhắc giảm tồn",
    })

    // ⏰ INFO: Ingredient expiry approaching
    alerts.push({
        id: "exp-1",
        severity: "WARNING",
        type: "EXPIRY_APPROACHING",
        icon: "⏰",
        title: "Sắp hết hạn",
        description: "Cream cheese — hết hạn trong 2 ngày",
        productName: "Cream cheese",
        productSku: "ING-005",
        value: "2 ngày còn lại",
        action: "Sử dụng trước / Ghi waste",
    })

    // 📦 INFO: Consignment nearing contract end
    alerts.push({
        id: "cons-1",
        severity: "INFO",
        type: "CONSIGNMENT_EXPIRING",
        icon: "📦",
        title: "Ký gửi sắp hết hạn",
        description: "Lô ký gửi từ NCC Wine Express — còn 5 ngày",
        productName: "NCC Wine Express - Batch #KG-2026-02",
        value: "5 ngày còn lại",
        action: "Quyết toán hoặc trả hàng",
    })

    // 📉 INFO: Declining demand
    alerts.push({
        id: "trend-1",
        severity: "INFO",
        type: "DECLINING_DEMAND",
        icon: "📉",
        title: "Xu hướng giảm",
        description: "Chardonnay Glass — giảm 35% so với 4 tuần trước",
        productName: "Chardonnay Glass",
        productSku: "WG-003",
        value: "-35% vs 4w ago",
        action: "Xem xét giảm nhập",
    })

    // 🍷 WARNING: Few glasses remaining
    alerts.push({
        id: "glass-1",
        severity: "WARNING",
        type: "LOW_GLASSES",
        icon: "🥂",
        title: "Còn ít ly",
        description: "Cabernet Sauvignon Glass — còn 2/8 ly, sắp hết chai",
        productName: "Cabernet Sauvignon Glass",
        productSku: "WG-001",
        value: "2/8 ly còn",
        action: "Chuẩn bị chai mới",
    })

    return alerts
}

export async function getAlertSummary(): Promise<{ critical: number; warning: number; info: number; total: number }> {
    const alerts = await getInventoryAlerts()
    return {
        critical: alerts.filter((a) => a.severity === "CRITICAL").length,
        warning: alerts.filter((a) => a.severity === "WARNING").length,
        info: alerts.filter((a) => a.severity === "INFO").length,
        total: alerts.length,
    }
}
