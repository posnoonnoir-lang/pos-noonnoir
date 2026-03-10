"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuthStore } from "@/stores/auth-store"
import { Loader2 } from "lucide-react"

export default function POSLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { isAuthenticated, _hasHydrated } = useAuthStore()

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

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="ml-[60px] flex-1">
                {children}
            </main>
        </div>
    )
}
