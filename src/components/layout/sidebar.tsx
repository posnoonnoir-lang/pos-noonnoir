"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Wine,
    LayoutGrid,
    LayoutDashboard,
    UtensilsCrossed,
    ClipboardList,
    Armchair,
    Package,
    Users,
    BarChart3,
    Settings,
    LogOut,
    ChefHat,
    Truck,
    Heart,
    Sparkles,
    BookOpenCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuthStore } from "@/stores/auth-store"

const navItems = [
    { label: "POS", href: "/pos", icon: LayoutGrid },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Menu", href: "/dashboard/menu", icon: UtensilsCrossed },
    { label: "Bếp", href: "/pos/kitchen", icon: ChefHat },
    { label: "Đơn hàng", href: "/pos/orders", icon: ClipboardList },
    { label: "Bàn", href: "/dashboard/tables", icon: Armchair },
    { label: "Mua hàng", href: "/dashboard/procurement", icon: Truck },
    { label: "Kho", href: "/dashboard/inventory", icon: Package },
    { label: "Nhân sự", href: "/dashboard/staff", icon: Users },
    { label: "Khách hàng", href: "/dashboard/customers", icon: Heart },
    { label: "Khuyến mãi", href: "/dashboard/promotions", icon: Sparkles },
    { label: "Wine Guide", href: "/dashboard/wine-guide", icon: BookOpenCheck },
    { label: "Lãi Lỗ", href: "/dashboard/reports", icon: BarChart3 },
]

const bottomItems = [
    { label: "Cài đặt", href: "/settings", icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const { staff, logout } = useAuthStore()

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-[60px] flex-col bg-green-900 py-3">
            {/* Logo */}
            <Link
                href="/pos"
                className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-800 transition-colors hover:bg-green-700"
            >
                <Wine className="h-5 w-5 text-cream-50" />
            </Link>

            {/* Divider */}
            <div className="mx-3 mb-2 border-t border-green-800" />

            {/* Nav Items */}
            <nav className="flex flex-1 flex-col gap-1 px-2">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    const Icon = item.icon
                    return (
                        <Tooltip key={item.href}>
                            <TooltipTrigger
                                className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-lg transition-all",
                                    isActive
                                        ? "bg-green-700 text-cream-50 shadow-sm"
                                        : "text-green-300 hover:bg-green-800 hover:text-cream-50"
                                )}
                                render={<Link href={item.href} />}
                            >
                                <Icon className="h-5 w-5" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-green-800 text-cream-50 border-green-700">
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </nav>

            {/* Bottom */}
            <div className="flex flex-col gap-1 px-2">
                {bottomItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <Tooltip key={item.href}>
                            <TooltipTrigger
                                className="flex h-10 w-10 items-center justify-center rounded-lg text-green-300 hover:bg-green-800 hover:text-cream-50 transition-all"
                                render={<Link href={item.href} />}
                            >
                                <Icon className="h-5 w-5" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-green-800 text-cream-50 border-green-700">
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    )
                })}

                {/* Staff indicator + Logout */}
                <Tooltip>
                    <TooltipTrigger
                        onClick={logout}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-green-300 hover:bg-wine-700 hover:text-white transition-all"
                    >
                        <LogOut className="h-5 w-5" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-green-800 text-cream-50 border-green-700">
                        {staff?.fullName ?? "Đăng xuất"}
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* Checkered footer */}
            <div className="mt-2 h-2 pattern-checkered-sm mx-1 rounded-sm" />
        </aside>
    )
}
