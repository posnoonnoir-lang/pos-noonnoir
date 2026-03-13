"use client"

export default function OfflinePage() {
    return (
        <div
            className="flex min-h-screen items-center justify-center bg-cream-50 p-8"
        >
            <div className="text-center max-w-md">
                <div className="text-7xl mb-6 animate-bounce">🍷</div>
                <h1 className="font-display text-2xl font-bold text-green-900 mb-3">
                    Mất kết nối mạng
                </h1>
                <p className="text-sm text-cream-500 leading-relaxed mb-8">
                    Noon & Noir POS đang hoạt động offline.
                    <br />
                    Các đơn hàng sẽ được lưu tạm và tự động gửi khi có mạng trở lại.
                </p>

                <div className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-cream-200 rounded-full text-xs font-semibold text-amber-700 shadow-sm">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Đang chờ kết nối...
                </div>

                <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl text-xs text-green-800">
                    📋 Đơn hàng offline sẽ tự động gửi khi có mạng
                </div>

                <button
                    onClick={() => typeof window !== "undefined" && window.location.reload()}
                    className="mt-6 px-8 py-3 bg-green-900 text-cream-50 rounded-xl text-sm font-bold hover:bg-green-800 transition-all shadow-md"
                >
                    Thử lại
                </button>
            </div>
        </div>
    )
}
