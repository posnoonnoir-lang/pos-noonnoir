"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ============================================================
// RBAC — Role-Based Access Control Config
// Stored as SystemSetting JSON. Only OWNER can edit.
// ============================================================

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

const PERMISSION_LABELS: Record<Permission, string> = {
    view: "Xem",
    create: "Tạo",
    edit: "Sửa",
    delete: "Xoá",
    approve: "Duyệt",
}

export { PERMISSION_LABELS }

// Default permission matrix — based on the review
const DEFAULT_RBAC: RbacConfig = {
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

const RBAC_KEY = "rbac_config"

export async function getRbacConfig(): Promise<RbacConfig> {
    try {
        const record = await prisma.systemSetting.findUnique({
            where: { key: RBAC_KEY },
        })
        if (record?.value) {
            const stored = record.value as object as RbacConfig
            // Merge with defaults to ensure new modules/roles are covered
            const merged: RbacConfig = { roles: {} }
            for (const role of ALL_ROLES) {
                merged.roles[role] = {
                    ...DEFAULT_RBAC.roles[role],
                    ...(stored.roles?.[role] ?? {}),
                }
            }
            return merged
        }
    } catch { /* table may not exist */ }
    return DEFAULT_RBAC
}

export async function updateRbacConfig(config: RbacConfig) {
    try {
        const jsonValue = JSON.parse(JSON.stringify(config))
        await prisma.systemSetting.upsert({
            where: { key: RBAC_KEY },
            create: { key: RBAC_KEY, value: jsonValue },
            update: { value: jsonValue },
        })
        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function resetRbacToDefault() {
    try {
        const jsonValue = JSON.parse(JSON.stringify(DEFAULT_RBAC))
        await prisma.systemSetting.upsert({
            where: { key: RBAC_KEY },
            create: { key: RBAC_KEY, value: jsonValue },
            update: { value: jsonValue },
        })
        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

// Helper: check if a role has a specific permission on a module
export async function hasPermission(
    role: string, moduleId: string, permission: Permission
): Promise<boolean> {
    if (role === "OWNER") return true // Owner always has full access
    const config = await getRbacConfig()
    const rolePerms = config.roles[role]
    if (!rolePerms) return false
    return rolePerms[moduleId]?.includes(permission) ?? false
}

// Helper: get all accessible module IDs for a role
export async function getAccessibleModules(role: string): Promise<string[]> {
    if (role === "OWNER") return MODULES.map(m => m.moduleId)
    const config = await getRbacConfig()
    const rolePerms = config.roles[role]
    if (!rolePerms) return []
    return Object.entries(rolePerms)
        .filter(([, perms]) => perms.length > 0)
        .map(([moduleId]) => moduleId)
}
