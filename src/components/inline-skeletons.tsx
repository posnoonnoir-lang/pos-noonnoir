"use client"

/**
 * Inline loading skeletons for critical pages.
 * These show INSIDE the page component while data is loading,
 * replacing empty grids/tables with beautiful animated placeholders.
 */

// ============================================================
// POS SKELETON — product grid + categories + cart panel
// ============================================================
export function POSInlineSkeleton() {
    return (
        <div className="flex h-screen animate-fade-in">
            {/* Left panel — categories + products */}
            <div className="flex-1 flex flex-col">
                {/* Category tabs */}
                <div className="flex gap-2 p-4 border-b border-cream-200">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="h-9 rounded-lg skeleton-shimmer"
                            style={{
                                width: `${60 + i * 12}px`,
                                animationDelay: `${i * 50}ms`,
                            }}
                        />
                    ))}
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-3 gap-3 p-4 lg:grid-cols-4">
                    {Array.from({ length: 12 }, (_, i) => (
                        <div
                            key={i}
                            className="rounded-xl border border-cream-200 bg-cream-50 p-3 space-y-2"
                            style={{ animation: `fadeInUp 350ms var(--ease-out-expo) ${i * 40}ms both` }}
                        >
                            <div className="h-20 rounded-lg skeleton-shimmer" />
                            <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                            <div className="h-3 w-1/2 rounded skeleton-shimmer" />
                            <div className="flex justify-between items-center mt-1">
                                <div className="h-5 w-20 rounded skeleton-shimmer" />
                                <div className="h-7 w-7 rounded-lg skeleton-shimmer" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel — cart */}
            <div className="w-[340px] border-l border-cream-200 bg-cream-50 p-4 space-y-3">
                <div className="h-8 w-48 rounded-lg skeleton-shimmer" />
                <div className="h-px bg-cream-200 my-2" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3" style={{ animation: `fadeIn 300ms var(--ease-smooth) ${i * 80}ms both` }}>
                        <div className="h-10 w-10 rounded-lg skeleton-shimmer" />
                        <div className="flex-1 space-y-1">
                            <div className="h-4 w-24 rounded skeleton-shimmer" />
                            <div className="h-3 w-16 rounded skeleton-shimmer" />
                        </div>
                        <div className="h-5 w-14 rounded skeleton-shimmer" />
                    </div>
                ))}
                <div className="mt-auto pt-4 space-y-2 border-t border-cream-200">
                    <div className="h-5 w-full rounded skeleton-shimmer" />
                    <div className="h-12 w-full rounded-xl skeleton-shimmer" />
                </div>
            </div>
        </div>
    )
}

// ============================================================
// TABLES SKELETON — stats bar + table grid
// ============================================================
export function TablesInlineSkeleton() {
    return (
        <div className="p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6" style={{ animation: "fadeInUp 300ms var(--ease-out-expo) both" }}>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl skeleton-shimmer" />
                    <div className="space-y-1">
                        <div className="h-7 w-40 rounded-lg skeleton-shimmer" />
                        <div className="h-4 w-52 rounded skeleton-shimmer" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-24 rounded-lg skeleton-shimmer" />
                    <div className="h-9 w-24 rounded-lg skeleton-shimmer" />
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-5 gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-cream-200 px-4 py-3"
                        style={{ animation: `fadeInUp 300ms var(--ease-out-expo) ${50 + i * 60}ms both` }}
                    >
                        <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                        <div className="space-y-1">
                            <div className="h-6 w-8 rounded skeleton-shimmer" />
                            <div className="h-3 w-12 rounded skeleton-shimmer" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Zone filter */}
            <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 rounded-lg skeleton-shimmer" style={{ width: `${55 + i * 8}px` }} />
                ))}
            </div>

            {/* Table grid */}
            <div className="grid grid-cols-4 gap-4 xl:grid-cols-6">
                {Array.from({ length: 12 }, (_, i) => (
                    <div
                        key={i}
                        className="flex flex-col items-center rounded-xl border-2 border-cream-200 bg-cream-50 p-4 space-y-2"
                        style={{ animation: `fadeInUp 350ms var(--ease-out-expo) ${200 + i * 40}ms both` }}
                    >
                        <div className="h-8 w-12 rounded skeleton-shimmer" />
                        <div className="h-3 w-10 rounded skeleton-shimmer" />
                        <div className="h-5 w-16 rounded-full skeleton-shimmer" />
                    </div>
                ))}
            </div>
        </div>
    )
}

// ============================================================
// REPORTS SKELETON — KPI cards + charts
// ============================================================
export function ReportsInlineSkeleton() {
    return (
        <div className="p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6" style={{ animation: "fadeInUp 300ms var(--ease-out-expo) both" }}>
                <div className="space-y-1">
                    <div className="h-8 w-48 rounded-lg skeleton-shimmer" />
                    <div className="h-4 w-64 rounded skeleton-shimmer" />
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-32 rounded-lg skeleton-shimmer" />
                    <div className="h-9 w-28 rounded-lg skeleton-shimmer" />
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-cream-200 bg-cream-50 p-4 space-y-2"
                        style={{ animation: `fadeInUp 300ms var(--ease-out-expo) ${i * 60}ms both` }}
                    >
                        <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                        <div className="h-7 w-24 rounded skeleton-shimmer" />
                        <div className="h-3 w-16 rounded skeleton-shimmer" />
                    </div>
                ))}
            </div>

            {/* Chart area */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-cream-200 bg-cream-50 p-4"
                        style={{ animation: `fadeInUp 350ms var(--ease-out-expo) ${300 + i * 80}ms both` }}
                    >
                        <div className="h-5 w-32 rounded skeleton-shimmer mb-4" />
                        <div className="h-48 rounded-lg skeleton-shimmer" />
                    </div>
                ))}
            </div>

            {/* Table */}
            <div
                className="rounded-xl border border-cream-200 overflow-hidden"
                style={{ animation: "fadeInUp 350ms var(--ease-out-expo) 500ms both" }}
            >
                <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-cream-100">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-4 rounded skeleton-shimmer" />
                    ))}
                </div>
                {[1, 2, 3, 4, 5].map((row) => (
                    <div key={row} className="grid grid-cols-5 gap-4 px-5 py-3.5 border-t border-cream-100">
                        {[1, 2, 3, 4, 5].map((col) => (
                            <div key={col} className="h-4 rounded skeleton-shimmer" style={{ opacity: 0.6 }} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ============================================================
// GENERIC DASHBOARD SKELETON (for any page)
// ============================================================
export function DashboardInlineSkeleton() {
    return (
        <div className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                    <div className="h-8 w-48 rounded-lg skeleton-shimmer" />
                    <div className="h-4 w-64 rounded skeleton-shimmer" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-cream-200 bg-cream-50 p-4 space-y-2" style={{ animation: `fadeInUp 300ms var(--ease-out-expo) ${i * 60}ms both` }}>
                        <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                        <div className="h-6 w-20 rounded skeleton-shimmer" />
                        <div className="h-3 w-14 rounded skeleton-shimmer" />
                    </div>
                ))}
            </div>
            <div className="rounded-xl border border-cream-200 bg-cream-50 p-4">
                <div className="h-64 rounded-lg skeleton-shimmer" />
            </div>
        </div>
    )
}
