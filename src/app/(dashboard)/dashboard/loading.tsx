export default function DashboardChildLoading() {
    return (
        <div className="min-h-screen bg-cream-50 p-4 lg:p-6 animate-fade-in">
            {/* Header skeleton with shimmer */}
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                    <div className="h-8 w-56 rounded-lg skeleton-shimmer" />
                    <div className="h-4 w-40 rounded skeleton-shimmer" />
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-24 rounded-lg skeleton-shimmer" />
                    <div className="h-9 w-28 rounded-lg skeleton-shimmer" />
                </div>
            </div>

            {/* KPI row skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-cream-200 bg-cream-100 p-4 space-y-3"
                        style={{ animation: `fadeInUp 350ms var(--ease-out-expo) ${i * 60}ms both` }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                            <div className="h-5 w-12 rounded-full skeleton-shimmer" />
                        </div>
                        <div className="h-8 w-24 rounded skeleton-shimmer" />
                        <div className="h-3 w-20 rounded skeleton-shimmer" />
                    </div>
                ))}
            </div>

            {/* Table skeleton with staggered rows */}
            <div
                className="rounded-xl border border-cream-200 bg-cream-100 overflow-x-auto"
                style={{ animation: "fadeInUp 350ms var(--ease-out-expo) 300ms both" }}
            >
                {/* Table header */}
                <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-cream-200 bg-cream-200/50">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-4 rounded skeleton-shimmer" />
                    ))}
                </div>
                {/* Table rows — stagger entrance */}
                {[1, 2, 3, 4, 5, 6].map((row) => (
                    <div
                        key={row}
                        className="grid grid-cols-6 gap-4 px-5 py-3.5 border-b border-cream-100"
                        style={{ animation: `fadeIn 300ms var(--ease-smooth) ${300 + row * 50}ms both` }}
                    >
                        {[1, 2, 3, 4, 5, 6].map((col) => (
                            <div key={col} className="h-4 rounded skeleton-shimmer" style={{ opacity: 0.7 }} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
