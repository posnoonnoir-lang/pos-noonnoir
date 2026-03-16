// RBAC constants — shared between server actions and client components
// This file is NOT "use server" so it can export constants

export type Permission = "view" | "create" | "edit" | "delete" | "approve"

export type ModulePermission = {
    moduleId: string
    label: string
    permissions: Permission[]
}

export type RolePermissions = Record<string, Permission[]>  // moduleId → permissions[]

export type RbacConfig = {
    roles: Record<string, RolePermissions>  // roleName → { moduleId → permissions[] }
}

// Module definitions — all features in the system
export const MODULES: ModulePermission[] = [
    { moduleId: "pos", label: "POS — Bán hàng", permissions: ["view", "create", "edit"] },
    { moduleId: "pos_discount", label: "POS — Giảm giá (≤20%)", permissions: ["approve"] },
    { moduleId: "pos_discount_high", label: "POS — Giảm giá (>20%)", permissions: ["approve"] },
    { moduleId: "pos_void", label: "POS — Void đơn hàng", permissions: ["approve"] },
    { moduleId: "kitchen", label: "Bếp — Xem & cập nhật", permissions: ["view", "edit"] },
    { moduleId: "dashboard", label: "Dashboard — Tổng quan", permissions: ["view"] },
    { moduleId: "analytics", label: "Phân tích & Báo cáo", permissions: ["view"] },
    { moduleId: "finance", label: "Tài chính (P&L)", permissions: ["view"] },
    { moduleId: "kpi", label: "Chỉ tiêu KPI", permissions: ["view", "create", "edit", "approve"] },
    { moduleId: "staff", label: "Nhân sự", permissions: ["view", "create", "edit", "delete"] },
    { moduleId: "menu", label: "Thực đơn", permissions: ["view", "create", "edit", "delete"] },
    { moduleId: "inventory", label: "Kho & Tồn kho", permissions: ["view", "create", "edit"] },
    { moduleId: "procurement", label: "Nhập hàng & Ký gửi", permissions: ["view", "create", "edit"] },
    { moduleId: "customers", label: "Khách hàng (CRM)", permissions: ["view", "create", "edit"] },
    { moduleId: "suppliers", label: "Nhà cung cấp", permissions: ["view", "create", "edit"] },
    { moduleId: "settings", label: "Cài đặt hệ thống", permissions: ["view", "edit"] },
]

export const ALL_ROLES = ["OWNER", "MANAGER", "CASHIER", "BARTENDER", "WAITER", "KITCHEN"] as const

export const PERMISSION_LABELS: Record<Permission, string> = {
    view: "Xem",
    create: "Tạo",
    edit: "Sửa",
    delete: "Xoá",
    approve: "Duyệt",
}

// Default permission matrix
export const DEFAULT_RBAC: RbacConfig = {
    roles: {
        OWNER: Object.fromEntries(
            MODULES.map(m => [m.moduleId, [...m.permissions]])
        ),
        MANAGER: {
            pos: ["view", "create", "edit"],
            pos_discount: ["approve"],
            pos_void: ["approve"],
            kitchen: ["view", "edit"],
            dashboard: ["view"],
            analytics: ["view"],
            kpi: ["view", "create", "edit", "approve"],
            staff: ["view"],
            menu: ["view", "create", "edit"],
            inventory: ["view", "create", "edit"],
            procurement: ["view", "create", "edit"],
            customers: ["view", "create", "edit"],
            suppliers: ["view", "create", "edit"],
        },
        CASHIER: {
            pos: ["view", "create", "edit"],
            menu: ["view"],
            customers: ["view", "create"],
        },
        BARTENDER: {
            pos: ["view", "create", "edit"],
            kitchen: ["view", "edit"],
            menu: ["view"],
            inventory: ["view"],
        },
        WAITER: {
            pos: ["view", "create"],
            menu: ["view"],
        },
        KITCHEN: {
            kitchen: ["view", "edit"],
            menu: ["view"],
            inventory: ["view"],
        },
    },
}
