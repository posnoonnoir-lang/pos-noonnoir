import { Loader2 } from "lucide-react"

export default function DashboardChildLoading() {
    return (
        <div className="min-h-screen bg-cream-50 p-6">
            {/* Breadcrumb skeleton */}
            <div className="flex items-center gap-2 mb-6 animate-pulse">
                <div className="h-5 w-32 rounded bg-cream-200" />
                <div className="h-5 w-4 rounded bg-cream-200" />
                <div className="h-5 w-24 rounded bg-cream-200" />
            </div>

            {/* Title + action bar */}
            <div className="flex items-center justify-between mb-6 animate-pulse">
                <div className="space-y-2">
                    <div className="h-8 w-56 rounded-lg bg-cream-200" />
                    <div className="h-4 w-40 rounded bg-cream-200" />
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-24 rounded-lg bg-cream-200" />
                    <div className="h-9 w-28 rounded-lg bg-cream-200" />
                </div>
            </div>

            {/* Table skeleton */}
            <div className="rounded-xl border border-cream-200 bg-cream-100 overflow-hidden animate-pulse">
                {/* Table header */}
                <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-cream-200">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-4 rounded bg-cream-200" />
                    ))}
                </div>
                {/* Table rows */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                    <div key={row} className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-cream-100">
                        {[1, 2, 3, 4, 5, 6].map((col) => (
                            <div key={col} className="h-4 rounded bg-cream-200/60" />
                        ))}
                    </div>
                ))}
            </div>

            {/* Center spinner */}
            <div className="flex items-center justify-center mt-8 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                <span className="text-xs text-cream-400">Đang tải...</span>
            </div>
        </div>
    )
}
