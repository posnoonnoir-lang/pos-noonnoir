"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { getRbacConfig } from "@/actions/rbac"
import type { RbacConfig } from "@/lib/rbac-constants"

// Route → RBAC module mapping
const ROUTE_MODULE_MAP: Record<string, string> = {
    "/pos": "pos",
    "/pos/kitchen": "kitchen",
    "/pos/orders": "pos",
    "/dashboard": "dashboard",
    "/dashboard/analytics": "analytics",
    "/dashboard/finance": "finance",
    "/dashboard/kpi": "kpi",
    "/dashboard/tables": "pos",
    "/dashboard/reservations": "pos",
    "/dashboard/feedback": "customers",
    "/dashboard/menu/products": "menu",
    "/dashboard/menu/categories": "menu",
    "/dashboard/menu/recipes": "menu",
    "/dashboard/wine-guide": "menu",
    "/dashboard/inventory": "inventory",
    "/dashboard/bottle-tracking": "inventory",
    "/dashboard/procurement": "procurement",
    "/dashboard/kitchen": "inventory",
    "/dashboard/waste": "inventory",
    "/dashboard/alerts": "inventory",
    "/dashboard/staff": "staff",
    "/dashboard/customers": "customers",
    "/dashboard/suppliers": "suppliers",
    "/dashboard/promotions": "menu",
    "/dashboard/reports": "analytics",
    "/dashboard/settings": "settings",
}

export { ROUTE_MODULE_MAP }

export function useRbac() {
    const staff = useAuthStore(s => s.staff)
    const [config, setConfig] = useState<RbacConfig | null>(null)

    useEffect(() => {
        getRbacConfig().then(setConfig)
    }, [])

    const role = staff?.role ?? "WAITER"

    const canAccess = (moduleId: string): boolean => {
        if (role === "OWNER") return true
        if (!config) return false
        const perms = config.roles[role]?.[moduleId]
        return !!perms && perms.length > 0
    }

    const hasPermission = (moduleId: string, permission: string): boolean => {
        if (role === "OWNER") return true
        if (!config) return false
        return config.roles[role]?.[moduleId]?.includes(permission as never) ?? false
    }

    const canAccessRoute = (href: string): boolean => {
        if (role === "OWNER") return true
        const moduleId = ROUTE_MODULE_MAP[href]
        if (!moduleId) return true // Unknown routes are accessible
        return canAccess(moduleId)
    }

    return { role, config, canAccess, hasPermission, canAccessRoute, isLoaded: !!config }
}
