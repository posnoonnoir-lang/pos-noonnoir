import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
    return (
        <div className="ml-[220px] min-h-screen bg-cream-50 p-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-6 animate-pulse">
                <div className="space-y-2">
                    <div className="h-7 w-48 rounded-lg bg-cream-200" />
                    <div className="h-4 w-32 rounded bg-cream-200" />
                </div>
                <div className="h-10 w-28 rounded-xl bg-cream-200" />
            </div>

            {/* KPI cards skeleton */}
            <div className="grid grid-cols-4 gap-4 mb-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl border border-cream-200 bg-cream-100 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-8 w-8 rounded-lg bg-cream-200" />
                            <div className="h-5 w-12 rounded-full bg-cream-200" />
                        </div>
                        <div className="h-8 w-24 rounded bg-cream-200" />
                        <div className="h-3 w-20 rounded bg-cream-200" />
                    </div>
                ))}
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-3 gap-4 animate-pulse">
                <div className="col-span-2 rounded-xl border border-cream-200 bg-cream-100 p-5 h-48" />
                <div className="rounded-xl border border-cream-200 bg-cream-100 p-5 h-48" />
            </div>

            {/* Loading indicator */}
            <div className="flex items-center justify-center mt-8">
                <Loader2 className="h-5 w-5 animate-spin text-green-700" />
                <span className="ml-2 text-xs text-cream-400">Đang tải dữ liệu...</span>
            </div>
        </div>
    )
}
