// Server-side RBAC guard utility (imported by server action files)

import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getRbacConfig } from "@/actions/rbac"
import type { Permission } from "@/lib/rbac-constants"

/**
 * Server-side RBAC guard for Server Actions.
 * 
 * Usage:
 *   const guard = await withRbac("staff", "view")
 *   if (!guard.ok) return { success: false, error: guard.error }
 *   // proceed with action...
 * 
 * Or with multiple permissions:
 *   const guard = await withRbac("staff", ["view", "edit"])
 */

type RbacGuardResult =
    | { ok: true; staffId: string; role: string; error?: undefined }
    | { ok: false; error: string; staffId?: undefined; role?: undefined }

export async function withRbac(
    moduleId: string,
    requiredPermission: Permission | Permission[]
): Promise<RbacGuardResult> {
    try {
        // 1. Check authentication cookie
        const cookieStore = await cookies()
        const authCookie = cookieStore.get("pos_auth")
        if (!authCookie || authCookie.value !== "true") {
            return { ok: false, error: "Chưa đăng nhập" }
        }

        // 2. Get staff from pos_staff_id cookie (we'll need to set this on login)
        const staffIdCookie = cookieStore.get("pos_staff_id")
        if (!staffIdCookie?.value) {
            // Fallback: if no staff ID cookie, allow (backward compatibility)
            return { ok: true, staffId: "", role: "OWNER" }
        }

        const staff = await prisma.staff.findUnique({
            where: { id: staffIdCookie.value },
            select: { id: true, role: true, isActive: true },
        })

        if (!staff || !staff.isActive) {
            return { ok: false, error: "Tài khoản không hợp lệ hoặc đã bị vô hiệu hoá" }
        }

        // 3. OWNER bypass — always allowed
        if (staff.role === "OWNER") {
            return { ok: true, staffId: staff.id, role: staff.role }
        }

        // 4. Check RBAC permissions
        const config = await getRbacConfig()
        const rolePerms = config.roles[staff.role]
        if (!rolePerms) {
            return { ok: false, error: "Vai trò không có quyền truy cập" }
        }

        const modulePerms = rolePerms[moduleId] ?? []
        const permsToCheck = Array.isArray(requiredPermission)
            ? requiredPermission
            : [requiredPermission]

        const hasAll = permsToCheck.every(p => modulePerms.includes(p))
        if (!hasAll) {
            return {
                ok: false,
                error: `Bạn không có quyền ${permsToCheck.join("/")} trên module này`,
            }
        }

        return { ok: true, staffId: staff.id, role: staff.role }
    } catch {
        return { ok: false, error: "Lỗi kiểm tra quyền" }
    }
}
