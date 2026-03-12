"use client"

import { useEffect, useRef } from "react"
import { usePrefetchStore } from "@/stores/prefetch-store"

// Server actions — imported lazily to avoid bundling on unused pages
import { getProducts, getCategories } from "@/actions/menu"
import { getInventoryItems, getStockMovements as getInventoryMovements, getInventoryStats } from "@/actions/inventory"
import { getAllPromotions as getPromotions, getPromoStats as getPromotionStats } from "@/actions/promotions"
import { getAllCustomers as getCustomers, getCustomerStats } from "@/actions/customers"
import { getReservations } from "@/actions/reservations"
import { getPurchaseOrders as getProcurementOrders, getSuppliers, getProcurementStats } from "@/actions/procurement"
import { getPOSInitialData } from "@/actions/pos-loader"

/**
 * GlobalPrefetcher — mounts once in dashboard layout.
 * Immediately starts background-fetching ALL page data so that
 * when user navigates, data is already in memory → instant display.
 *
 * Strategy: Staggered prefetch to avoid flooding connection pool.
 * Phase 1 (immediate): Critical operational pages
 * Phase 2 (after 2s): Management pages
 * Phase 3 (after 5s): Analytics/Reports (heavy queries)
 */
export function GlobalPrefetcher() {
    const didPrefetch = useRef(false)

    useEffect(() => {
        if (didPrefetch.current) return
        didPrefetch.current = true

        const store = usePrefetchStore.getState()

        // Helper: fetch + cache if not already cached
        const prefetchIfMissing = async (key: string, fetcher: () => Promise<any>) => {
            store.registerPrefetch(key, fetcher)
            if (store.get(key)) return // already cached
            try {
                const data = await fetcher()
                store.set(key, data)
            } catch { /* silent — non-blocking */ }
        }

        // ★ Phase 1 — Critical pages (immediate)
        const phase1 = async () => {
            await Promise.allSettled([
                prefetchIfMissing("pos", getPOSInitialData),
                prefetchIfMissing("promotions:list", getPromotions),
                prefetchIfMissing("promotions:stats", getPromotionStats),
            ])
        }

        // ★ Phase 2 — Management pages (after 1.5s)
        const phase2 = async () => {
            await Promise.allSettled([
                prefetchIfMissing("inv:items", getInventoryItems),
                prefetchIfMissing("inv:stats", getInventoryStats),
                prefetchIfMissing("inv:movements", getInventoryMovements),
                prefetchIfMissing("customers:list", () => getCustomers()),
                prefetchIfMissing("customers:stats", getCustomerStats),
                prefetchIfMissing("reservations:list", getReservations),
            ])
        }

        // ★ Phase 3 — Procurement + more (after 3s)
        const phase3 = async () => {
            await Promise.allSettled([
                prefetchIfMissing("proc:orders", getProcurementOrders),
                prefetchIfMissing("proc:suppliers", getSuppliers),
                prefetchIfMissing("proc:stats", getProcurementStats),
                prefetchIfMissing("products:all", getProducts),
                prefetchIfMissing("categories:all", getCategories),
            ])
        }

        // Staggered execution
        phase1()
        const t2 = setTimeout(phase2, 1500)
        const t3 = setTimeout(phase3, 3000)

        return () => {
            clearTimeout(t2)
            clearTimeout(t3)
        }
    }, [])

    return null // Invisible component
}
