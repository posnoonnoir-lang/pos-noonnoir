"use client"

import { useEffect, useRef } from "react"
import { usePrefetchStore } from "@/stores/prefetch-store"

// Only import LIGHTWEIGHT fetchers — NOT heavy analytics/reports
import { getInventoryItems, getInventoryStats } from "@/actions/inventory"
import { getAllPromotions, getPromoStats } from "@/actions/promotions"
import { getAllCustomers, getCustomerStats } from "@/actions/customers"
import { getReservations } from "@/actions/reservations"
import { getPurchaseOrders, getSuppliers, getProcurementStats } from "@/actions/procurement"

/**
 * GlobalPrefetcher — mounts in dashboard layout.
 * 
 * IMPORTANT: Only prefetches LIGHTWEIGHT data (simple list queries).
 * Heavy pages (Analytics, Reports) are NOT prefetched here — they cache
 * themselves on first visit and load instantly on revisit.
 * 
 * Strategy: Sequential phases with small batches (max 2-3 concurrent)
 * to avoid connection pool exhaustion on Supabase free tier.
 */
export function GlobalPrefetcher() {
    const didPrefetch = useRef(false)

    useEffect(() => {
        if (didPrefetch.current) return
        didPrefetch.current = true

        const store = usePrefetchStore.getState()

        const prefetchIfMissing = async (key: string, fetcher: () => Promise<any>) => {
            store.registerPrefetch(key, fetcher)
            if (store.get(key)) return
            try {
                const data = await fetcher()
                store.set(key, data)
            } catch { /* silent */ }
        }

        // Phase 1 — after 3s (let current page finish loading first!)
        const t1 = setTimeout(async () => {
            // Max 2 concurrent — lightweight lists only
            await Promise.allSettled([
                prefetchIfMissing("promotions:list", getAllPromotions),
                prefetchIfMissing("customers:list", () => getAllCustomers()),
            ])
        }, 3000)

        // Phase 2 — after 6s
        const t2 = setTimeout(async () => {
            await Promise.allSettled([
                prefetchIfMissing("inv:items", getInventoryItems),
                prefetchIfMissing("inv:stats", getInventoryStats),
            ])
        }, 6000)

        // Phase 3 — after 9s
        const t3 = setTimeout(async () => {
            await Promise.allSettled([
                prefetchIfMissing("proc:orders", getPurchaseOrders),
                prefetchIfMissing("proc:suppliers", getSuppliers),
            ])
        }, 9000)

        // Phase 4 — after 12s (very low priority)
        const t4 = setTimeout(async () => {
            await Promise.allSettled([
                prefetchIfMissing("promotions:stats", getPromoStats),
                prefetchIfMissing("customers:stats", getCustomerStats),
                prefetchIfMissing("reservations:list", getReservations),
                prefetchIfMissing("proc:stats", getProcurementStats),
            ])
        }, 12000)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
            clearTimeout(t4)
        }
    }, [])

    return null
}
