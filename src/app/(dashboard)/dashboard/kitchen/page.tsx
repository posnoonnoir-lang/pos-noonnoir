"use client"

import { useState, useEffect, useCallback } from "react"
import { getKitchenOrders, updateItemStatus } from "@/actions/orders"

type KitchenOrder = Awaited<ReturnType<typeof getKitchenOrders>>[0]

export default function KitchenPage() {
    const [orders, setOrders] = useState<KitchenOrder[]>([])
    const [loading, setLoading] = useState(true)

    const loadOrders = useCallback(async () => {
        const data = await getKitchenOrders()
        setOrders(data)
        setLoading(false)
    }, [])

    useEffect(() => {
        loadOrders()
        const interval = setInterval(loadOrders, 5000) // auto-refresh 5s
        return () => clearInterval(interval)
    }, [loadOrders])

    const handleMark = async (itemId: string, status: "READY" | "SERVED") => {
        await updateItemStatus(itemId, status)
        loadOrders()
    }

    if (loading) return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6B8F71] border-t-transparent" />
        </div>
    )

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-[#F5F0E8]">
            {/* Header */}
            <div className="bg-[#2a2a2a] border-b border-[#3a3a3a] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">👨‍🍳</span>
                    <h1 className="text-xl font-bold">Kitchen Display</h1>
                    <span className="bg-[#6B8F71] text-white px-2 py-0.5 rounded-full text-sm font-medium">
                        {orders.length} đơn
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#999]">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Live — auto refresh 5s
                </div>
            </div>

            {/* Orders Grid */}
            <div className="p-6">
                {orders.length === 0 ? (
                    <div className="text-center py-20 text-[#666]">
                        <span className="text-6xl block mb-4">✅</span>
                        <p className="text-xl">Không có món nào đang chế biến</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {orders.map((order) => (
                            <div key={order.orderId} className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] overflow-hidden">
                                {/* Order header */}
                                <div className="bg-[#333] px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <span className="font-bold text-[#F5F0E8]">{order.orderNo}</span>
                                        {order.tableNumber && (
                                            <span className="ml-2 bg-[#6B8F71]/20 text-[#6B8F71] px-2 py-0.5 rounded text-sm">
                                                Bàn {order.tableNumber}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="p-3 space-y-2">
                                    {order.items.map((item) => {
                                        const isPreparing = item.status === "PREPARING"
                                        const isReady = item.status === "READY"
                                        const sentAgo = item.sentAt
                                            ? Math.round((Date.now() - new Date(item.sentAt).getTime()) / 60000)
                                            : 0
                                        const isLate = sentAgo > 15

                                        return (
                                            <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${isReady ? "bg-green-900/20 border-green-800" :
                                                    isLate ? "bg-red-900/20 border-red-800" :
                                                        "bg-[#1a1a1a] border-[#3a3a3a]"
                                                }`}>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">
                                                            {item.productType === "FOOD" ? "🍽️" :
                                                                item.productType === "DRINK" ? "🍹" : "📦"}
                                                        </span>
                                                        <span className="font-medium">{item.productName}</span>
                                                        <span className="text-[#6B8F71] font-bold">×{item.quantity}</span>
                                                    </div>
                                                    {item.notes && (
                                                        <p className="text-xs text-yellow-400 mt-1 ml-7">📝 {item.notes}</p>
                                                    )}
                                                    <p className="text-xs text-[#666] mt-0.5 ml-7">
                                                        {sentAgo}p trước
                                                        {isLate && <span className="text-red-400 ml-1">⚠️ Quá lâu!</span>}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    {isPreparing && (
                                                        <button
                                                            onClick={() => handleMark(item.id, "READY")}
                                                            className="px-3 py-2 bg-[#6B8F71] hover:bg-[#5a7d60] text-white rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            ✅ Xong
                                                        </button>
                                                    )}
                                                    {isReady && (
                                                        <button
                                                            onClick={() => handleMark(item.id, "SERVED")}
                                                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            🍽️ Phục vụ
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
