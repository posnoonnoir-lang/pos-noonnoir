"use server"

// ============================================================
// NOTIFICATIONS & ALERTS (US-5.1)
// Real-time alerts: low stock, expiring items, shift reminders
// ============================================================

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

type AlertPriority = "CRITICAL" | "WARNING" | "INFO"
type AlertCategory = "INVENTORY" | "SHIFT" | "FINANCE" | "CUSTOMER" | "SYSTEM"

export type Notification = {
    id: string
    title: string
    message: string
    priority: AlertPriority
    category: AlertCategory
    isRead: boolean
    actionUrl: string | null
    actionLabel: string | null
    createdAt: Date
}

export type AlertRule = {
    id: string
    name: string
    description: string
    category: AlertCategory
    isEnabled: boolean
    threshold: string
}

export type NotificationStats = {
    total: number
    unread: number
    critical: number
    warning: number
    info: number
}

// ============================================================
// MOCK NOTIFICATIONS
// ============================================================

const NOTIFICATIONS: Notification[] = [
    {
        id: "notif-1",
        title: "⚠️ Tồn kho thấp — Cabernet Sauvignon",
        message: "Chỉ còn 3 chai Cabernet Sauvignon. Đặt hàng bổ sung ngay.",
        priority: "CRITICAL",
        category: "INVENTORY",
        isRead: false,
        actionUrl: "/dashboard/inventory",
        actionLabel: "Xem kho",
        createdAt: new Date("2026-03-10T16:30:00"),
    },
    {
        id: "notif-2",
        title: "🍷 Rượu sắp hết hạn — Lot #2024-08",
        message: "5 chai Sauvignon Blanc (Lot #2024-08) hết hạn trong 15 ngày. Ưu tiên bán hoặc tạo KM.",
        priority: "WARNING",
        category: "INVENTORY",
        isRead: false,
        actionUrl: "/dashboard/inventory",
        actionLabel: "Xem chi tiết",
        createdAt: new Date("2026-03-10T14:00:00"),
    },
    {
        id: "notif-3",
        title: "💰 Doanh thu vượt kỳ vọng!",
        message: "Doanh thu hôm nay ₫20.8M, vượt 12.4% so với TB tuần. Tuyệt vời!",
        priority: "INFO",
        category: "FINANCE",
        isRead: false,
        actionUrl: "/dashboard/reports",
        actionLabel: "Xem P&L",
        createdAt: new Date("2026-03-10T16:45:00"),
    },
    {
        id: "notif-4",
        title: "⏰ Ca hiện tại đã mở > 6 giờ",
        message: "Ca SM-100310-02 mở từ 14:00. Nhắc nhân viên đóng ca đúng giờ.",
        priority: "WARNING",
        category: "SHIFT",
        isRead: false,
        actionUrl: "/pos",
        actionLabel: "Mở POS",
        createdAt: new Date("2026-03-10T16:00:00"),
    },
    {
        id: "notif-5",
        title: "🎂 Sinh nhật khách VIP — Vũ Thị Mai Hương",
        message: "Khách Gold-tier, sinh nhật 25/12. Đã chi ₫38M. Gửi voucher sinh nhật?",
        priority: "INFO",
        category: "CUSTOMER",
        isRead: true,
        actionUrl: "/dashboard/customers",
        actionLabel: "Xem profile",
        createdAt: new Date("2026-03-10T09:00:00"),
    },
    {
        id: "notif-6",
        title: "🔄 Ký gửi cần quyết toán — NCC Phongphú Wine",
        message: "12 sản phẩm ký gửi đã bán xong. Tạo bảng quyết toán để thanh toán NCC.",
        priority: "WARNING",
        category: "INVENTORY",
        isRead: true,
        actionUrl: "/dashboard/procurement",
        actionLabel: "Quyết toán",
        createdAt: new Date("2026-03-10T08:30:00"),
    },
    {
        id: "notif-7",
        title: "📦 Đơn nhập hàng đã đến",
        message: "PO-2026-015 từ Sài Gòn Wine Corp: 24 thùng rượu đã đến kho. Cần xác nhận nhập kho.",
        priority: "INFO",
        category: "INVENTORY",
        isRead: true,
        actionUrl: "/dashboard/procurement",
        actionLabel: "Xác nhận",
        createdAt: new Date("2026-03-09T16:00:00"),
    },
    {
        id: "notif-8",
        title: "🌅 Happy Hour bắt đầu!",
        message: "Khuyến mãi Happy Hour -15% rượu by-glass đã tự động kích hoạt (17:00-19:00).",
        priority: "INFO",
        category: "SYSTEM",
        isRead: false,
        actionUrl: "/dashboard/promotions",
        actionLabel: "Xem KM",
        createdAt: new Date("2026-03-10T17:00:00"),
    },
    {
        id: "notif-9",
        title: "❌ Chênh lệch tiền mặt — Ca trước",
        message: "Ca SM-100310-01 đóng với chênh lệch -₫120,000. Cần kiểm tra lại.",
        priority: "CRITICAL",
        category: "SHIFT",
        isRead: true,
        actionUrl: "/pos",
        actionLabel: "Xem ca",
        createdAt: new Date("2026-03-10T07:00:00"),
    },
    {
        id: "notif-10",
        title: "⭐ Khách mới đạt hạng Silver",
        message: "Phạm Văn Tùng đã tích lũy ₫10M chi tiêu, tự động lên hạng Silver.",
        priority: "INFO",
        category: "CUSTOMER",
        isRead: true,
        actionUrl: "/dashboard/customers",
        actionLabel: "Xem",
        createdAt: new Date("2026-03-09T20:00:00"),
    },
]

// ============================================================
// ALERT RULES
// ============================================================

const ALERT_RULES: AlertRule[] = [
    { id: "rule-1", name: "Tồn kho thấp", description: "Cảnh báo khi số lượng sản phẩm dưới ngưỡng", category: "INVENTORY", isEnabled: true, threshold: "≤ 5 chai" },
    { id: "rule-2", name: "Sắp hết hạn", description: "Cảnh báo sản phẩm hết hạn trong 30 ngày", category: "INVENTORY", isEnabled: true, threshold: "≤ 30 ngày" },
    { id: "rule-3", name: "Ca mở quá lâu", description: "Nhắc nhở khi ca đã mở > 8 giờ", category: "SHIFT", isEnabled: true, threshold: "> 8h" },
    { id: "rule-4", name: "Chênh lệch tiền mặt", description: "Cảnh báo khi tiền mặt chênh > ₫100K", category: "SHIFT", isEnabled: true, threshold: "> ₫100K" },
    { id: "rule-5", name: "Doanh thu bất thường", description: "Thông báo khi doanh thu chênh > 20% so với TB", category: "FINANCE", isEnabled: true, threshold: "> 20% TB tuần" },
    { id: "rule-6", name: "Sinh nhật khách VIP", description: "Nhắc sinh nhật khách Gold/Platinum trước 7 ngày", category: "CUSTOMER", isEnabled: true, threshold: "7 ngày trước" },
    { id: "rule-7", name: "Ký gửi cần quyết toán", description: "Nhắc quyết toán NCC khi có SP ký gửi đã bán", category: "INVENTORY", isEnabled: false, threshold: "Tự động" },
]

// ============================================================
// ACTIONS
// ============================================================

export async function getNotifications(): Promise<Notification[]> {
    await delay(80)
    return [...NOTIFICATIONS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getUnreadNotifications(): Promise<Notification[]> {
    await delay(50)
    return NOTIFICATIONS.filter((n) => !n.isRead).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function markAsRead(id: string): Promise<{ success: boolean }> {
    await delay(50)
    const notif = NOTIFICATIONS.find((n) => n.id === id)
    if (!notif) return { success: false }
    notif.isRead = true
    return { success: true }
}

export async function markAllAsRead(): Promise<{ success: boolean }> {
    await delay(100)
    NOTIFICATIONS.forEach((n) => { n.isRead = true })
    return { success: true }
}

export async function getNotificationStats(): Promise<NotificationStats> {
    await delay(50)
    return {
        total: NOTIFICATIONS.length,
        unread: NOTIFICATIONS.filter((n) => !n.isRead).length,
        critical: NOTIFICATIONS.filter((n) => n.priority === "CRITICAL" && !n.isRead).length,
        warning: NOTIFICATIONS.filter((n) => n.priority === "WARNING" && !n.isRead).length,
        info: NOTIFICATIONS.filter((n) => n.priority === "INFO" && !n.isRead).length,
    }
}

export async function getAlertRules(): Promise<AlertRule[]> {
    await delay(80)
    return [...ALERT_RULES]
}

export async function toggleAlertRule(id: string): Promise<{ success: boolean }> {
    await delay(100)
    const rule = ALERT_RULES.find((r) => r.id === id)
    if (!rule) return { success: false }
    rule.isEnabled = !rule.isEnabled
    return { success: true }
}
