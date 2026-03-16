"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import {
    ALL_ROLES, DEFAULT_RBAC, MODULES,
    type RbacConfig, type Permission,
} from "@/lib/rbac-constants"

// Re-export types for convenience (types are fine in "use server")
export type { Permission, RbacConfig, ModulePermission, RolePermissions } from "@/lib/rbac-constants"

const RBAC_KEY = "rbac_config"

export async function getRbacConfig(): Promise<RbacConfig> {
    try {
        const record = await prisma.systemSetting.findUnique({
            where: { key: RBAC_KEY },
        })
        if (record?.value) {
            const stored = record.value as object as RbacConfig
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

export async function hasPermission(
    role: string, moduleId: string, permission: Permission
): Promise<boolean> {
    if (role === "OWNER") return true
    const config = await getRbacConfig()
    const rolePerms = config.roles[role]
    if (!rolePerms) return false
    return rolePerms[moduleId]?.includes(permission) ?? false
}

export async function getAccessibleModules(role: string): Promise<string[]> {
    if (role === "OWNER") return MODULES.map(m => m.moduleId)
    const config = await getRbacConfig()
    const rolePerms = config.roles[role]
    if (!rolePerms) return []
    return Object.entries(rolePerms)
        .filter(([, perms]) => perms.length > 0)
        .map(([moduleId]) => moduleId)
}
