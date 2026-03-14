"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
    Wine,
    LayoutDashboard,
    UtensilsCrossed,
    Armchair,
    Package,
    Users,
    BarChart3,
    Settings,
    LogOut,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Truck,
    CalendarDays,
    Tag,
    Heart,
    BookOpen,
    ChefHat,
    ClipboardList,
    Handshake,
    AlertTriangle,
    TrendingUp,
    MessageCircle,
    GlassWater,
    PieChart,
    Trash2,
    DollarSign,
    Target,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { usePrefetchStore } from "@/stores/prefetch-store"
import { useSidebarStore } from "@/stores/sidebar-store"
import { PageTransition } from "@/components/page-transition"
import { GlobalPrefetcher } from "@/components/global-prefetcher"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Map routes to prefetch cache keys
const PREFETCH_KEYS: Record<string, string> = {
    "/pos": "pos",
    "/dashboard": "dashboard",
    "/dashboard/tables": "tables",
}

const navSections = [
    {
        label: "Tổng quan",
        items: [
            { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { label: "Phân tích", href: "/dashboard/analytics", icon: PieChart },
            { label: "Tài chính (P&L)", href: "/dashboard/finance", icon: DollarSign },
            { label: "Chỉ tiêu KPI", href: "/dashboard/kpi", icon: Target },
        ],
    },
    {
        label: "Bán hàng",
        items: [
            { label: "POS Terminal", href: "/pos", icon: Wine },
            { label: "Kitchen Display", href: "/pos/kitchen", icon: ChefHat },
            { label: "Đơn hàng", href: "/pos/orders", icon: ClipboardList },
            { label: "Quản lý Bàn", href: "/dashboard/tables", icon: Armchair },
        ],
    },
    {
        label: "Kho & Nhập hàng",
        items: [
            { label: "Kho hàng", href: "/dashboard/inventory", icon: Package },
            { label: "Mua hàng", href: "/dashboard/procurement", icon: Truck },
            { label: "Ký gửi", href: "/dashboard/consignment", icon: Handshake },
            { label: "Cảnh báo tồn", href: "/dashboard/alerts", icon: AlertTriangle },
            { label: "Dự báo nhập", href: "/dashboard/forecast", icon: TrendingUp },
            { label: "Hao hụt", href: "/dashboard/waste", icon: Trash2 },
        ],
    },
    {
        label: "Sản phẩm & Rượu",
        items: [
            { label: "Menu & Sản phẩm", href: "/dashboard/menu", icon: UtensilsCrossed },
            { label: "Wine Guide", href: "/dashboard/wine-guide", icon: BookOpen },
            { label: "Bán theo ly", href: "/dashboard/bottle-tracking", icon: GlassWater },
        ],
    },
    {
        label: "Khách & Marketing",
        items: [
            { label: "Khách hàng", href: "/dashboard/customers", icon: Heart },
            { label: "Khuyến mãi", href: "/dashboard/promotions", icon: Tag },
            { label: "Feedback", href: "/dashboard/feedback", icon: MessageCircle },
        ],
    },
    {
        label: "Nội bộ",
        items: [
            { label: "Nhân sự", href: "/dashboard/staff", icon: Users },
            { label: "Đặt bàn", href: "/dashboard/reservations", icon: CalendarDays },
            { label: "Báo cáo", href: "/dashboard/reports", icon: BarChart3 },
        ],
    },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const { isAuthenticated, _hasHydrated, staff, logout } = useAuthStore()
    const { collapsed, toggle: toggleSidebar } = useSidebarStore()

    useEffect(() => {
        if (_hasHydrated && !isAuthenticated) {
            router.replace("/login")
        }
    }, [isAuthenticated, _hasHydrated, router])

    if (!_hasHydrated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-cream-50">
                <Loader2 className="h-8 w-8 animate-spin text-green-700" />
            </div>
        )
    }

    if (!isAuthenticated) return null

    const handleLogout = () => {
        logout()
        router.replace("/login")
    }

    const sidebarWidth = collapsed ? 60 : 220

    return (
        <div className="flex min-h-screen">
            {/* Sidebar — Collapsible */}
            <aside
                className="fixed left-0 top-0 z-40 flex h-screen flex-col bg-green-900 transition-all duration-300 ease-out"
                style={{ width: sidebarWidth }}
            >
                {/* Logo */}
                <Link
                    href="/dashboard"
                    className="group flex items-center gap-3 px-4 py-5 border-b border-green-800 transition-all hover:bg-green-800/50 overflow-hidden"
                    style={{ justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? "20px 0" : undefined }}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-800 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                        <Wine className="h-5 w-5 text-cream-50" />
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="font-display text-sm font-bold text-cream-50">Noon & Noir</p>
                            <p className="font-script text-xs text-green-300">Wine Alley</p>
                        </div>
                    )}
                </Link>

                {/* Collapse toggle button */}
                <button
                    onClick={toggleSidebar}
                    className="fixed z-50 flex h-6 w-6 items-center justify-center rounded-full bg-green-700 border-2 border-cream-50 text-cream-50 shadow-md hover:bg-green-600 transition-all duration-300 hover:scale-110"
                    style={{ left: sidebarWidth - 12, top: 72 }}
                >
                    {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                </button>

                {/* Nav Sections */}
                <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
                    {navSections.map((section) => (
                        <div key={section.label}>
                            {!collapsed && (
                                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-green-400/60">
                                    {section.label}
                                </p>
                            )}
                            {collapsed && <div className="mx-auto mb-1 w-6 border-t border-green-700/60" />}
                            <div className="space-y-0.5">
                                {section.items.map((item) => {
                                    const isActive =
                                        pathname === item.href ||
                                        (item.href !== "/dashboard" && pathname.startsWith(item.href))
                                    const Icon = item.icon

                                    const linkContent = (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            prefetch={true}
                                            onMouseEnter={() => {
                                                const key = PREFETCH_KEYS[item.href]
                                                if (key) usePrefetchStore.getState().prefetch(key)
                                            }}
                                            className={cn(
                                                "relative flex items-center rounded-lg transition-all nav-link-smooth",
                                                collapsed
                                                    ? "h-10 w-10 mx-auto justify-center"
                                                    : "gap-2.5 px-2.5 py-2 text-[13px] font-medium",
                                                isActive
                                                    ? "bg-green-700 text-cream-50 shadow-sm"
                                                    : "text-green-300 hover:bg-green-800 hover:text-cream-50"
                                            )}
                                        >
                                            {/* Active indicator bar */}
                                            {isActive && !collapsed && (
                                                <span
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-cream-50"
                                                    style={{ animation: "navIndicator 200ms var(--ease-out-expo) forwards" }}
                                                />
                                            )}
                                            <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isActive && "scale-110")} />
                                            {!collapsed && <span className="truncate">{item.label}</span>}
                                            {!collapsed && isActive && (
                                                <ChevronRight className="ml-auto h-3.5 w-3.5 text-green-400 animate-fade-in" />
                                            )}
                                        </Link>
                                    )

                                    if (collapsed) {
                                        return (
                                            <Tooltip key={item.href}>
                                                <TooltipTrigger
                                                    className={cn(
                                                        "relative flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition-all nav-link-smooth",
                                                        isActive
                                                            ? "bg-green-700 text-cream-50 shadow-sm"
                                                            : "text-green-300 hover:bg-green-800 hover:text-cream-50"
                                                    )}
                                                    render={<Link href={item.href} prefetch={true} />}
                                                    onMouseEnter={() => {
                                                        const key = PREFETCH_KEYS[item.href]
                                                        if (key) usePrefetchStore.getState().prefetch(key)
                                                    }}
                                                >
                                                    <Icon className={cn("h-4 w-4 shrink-0", isActive && "scale-110")} />
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="bg-green-800 text-cream-50 border-green-700 text-xs">
                                                    {item.label}
                                                </TooltipContent>
                                            </Tooltip>
                                        )
                                    }

                                    return linkContent
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom — Staff info + Settings + Logout */}
                <div className="border-t border-green-800 px-2 py-2 space-y-0.5">
                    {collapsed ? (
                        <>
                            <Tooltip>
                                <TooltipTrigger
                                    className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg text-green-300 nav-link-smooth hover:bg-green-800 hover:text-cream-50"
                                    render={<Link href="/dashboard/settings" prefetch={true} />}
                                >
                                    <Settings className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-green-800 text-cream-50 border-green-700 text-xs">
                                    Cài đặt
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger
                                    onClick={handleLogout}
                                    className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg text-green-300 btn-press hover:bg-wine-700 hover:text-white"
                                >
                                    <LogOut className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-green-800 text-cream-50 border-green-700 text-xs">
                                    {staff?.fullName ?? "Đăng xuất"}
                                </TooltipContent>
                            </Tooltip>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/dashboard/settings"
                                prefetch={true}
                                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-green-300 nav-link-smooth hover:bg-green-800 hover:text-cream-50"
                            >
                                <Settings className="h-4 w-4 icon-hover" />
                                <span>Cài đặt</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-green-300 btn-press hover:bg-wine-700 hover:text-white"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>{staff?.fullName ?? "Đăng xuất"}</span>
                            </button>
                        </>
                    )}
                </div>

                {/* Checkered footer */}
                <div className="h-2 pattern-checkered-sm mx-2 mb-1 rounded-sm" />
            </aside>

            {/* Main Content — with page transition animation */}
            <main
                className="flex-1 min-h-screen bg-cream-50 transition-all duration-300 ease-out"
                style={{ marginLeft: sidebarWidth }}
            >
                <GlobalPrefetcher />
                <PageTransition>
                    {children}
                </PageTransition>
            </main>
        </div>
    )
}
