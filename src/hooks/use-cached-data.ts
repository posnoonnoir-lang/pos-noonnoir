"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { usePrefetchStore } from "@/stores/prefetch-store"

type UseCachedDataOptions<T> = {
    key: string
    fetcher: () => Promise<T>
    ttl?: number  // cache TTL in ms, default 60s
    staleWhileRevalidate?: boolean // show stale data while fetching new
}

type UseCachedDataResult<T> = {
    data: T | null
    loading: boolean
    error: Error | null
    refresh: () => Promise<void>
    isStale: boolean
}

/**
 * Hook that provides instant data display using client cache + background revalidation.
 * - First visit: fetch from server, cache result
 * - Subsequent visits: show cached data instantly, refresh in background
 * - Navigation back: instant display, no loading skeleton
 */
export function useCachedData<T>({
    key,
    fetcher,
    ttl = 60_000,
    staleWhileRevalidate = true,
}: UseCachedDataOptions<T>): UseCachedDataResult<T> {
    const store = usePrefetchStore()
    const cachedData = store.get(key, ttl)

    const [data, setData] = useState<T | null>(cachedData)
    const [loading, setLoading] = useState(!cachedData)
    const [error, setError] = useState<Error | null>(null)
    const [isStale, setIsStale] = useState(!!cachedData)
    const fetchingRef = useRef(false)
    const mountedRef = useRef(true)

    const fetchData = useCallback(async (showLoading = true) => {
        if (fetchingRef.current) return
        fetchingRef.current = true

        if (showLoading) setLoading(true)
        setError(null)

        try {
            const result = await fetcher()
            if (mountedRef.current) {
                setData(result)
                setIsStale(false)
                store.set(key, result)
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err : new Error("Fetch failed"))
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false)
            }
            fetchingRef.current = false
        }
    }, [key, fetcher, store])

    useEffect(() => {
        mountedRef.current = true

        if (cachedData && staleWhileRevalidate) {
            // Have cached data → show it instantly, revalidate in background
            setData(cachedData)
            setLoading(false)
            setIsStale(true)
            fetchData(false) // silent background refresh
        } else if (cachedData) {
            // Have cache + no revalidation needed
            setData(cachedData)
            setLoading(false)
            setIsStale(false)
        } else {
            // No cache → normal loading
            fetchData(true)
        }

        // Register for prefetching from sidebar
        store.registerPrefetch(key, fetcher)

        return () => { mountedRef.current = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])

    const refresh = useCallback(async () => {
        await fetchData(true)
    }, [fetchData])

    return { data, loading, error, refresh, isStale }
}

/**
 * Hook for multiple parallel cached data fetches.
 * Returns data as a tuple matching the fetchers order.
 */
export function useMultiCachedData<T extends any[]>(
    configs: { [K in keyof T]: { key: string; fetcher: () => Promise<T[K]>; ttl?: number } }
): {
    data: { [K in keyof T]: T[K] | null }
    loading: boolean
    error: Error | null
    refresh: () => Promise<void>
} {
    const store = usePrefetchStore()

    // Get all cached data
    const cachedEntries = configs.map(c => store.get(c.key, c.ttl ?? 60_000))
    const hasAllCached = cachedEntries.every(e => e !== null)

    const [data, setData] = useState<{ [K in keyof T]: T[K] | null }>(
        cachedEntries as any
    )
    const [loading, setLoading] = useState(!hasAllCached)
    const [error, setError] = useState<Error | null>(null)
    const fetchingRef = useRef(false)
    const mountedRef = useRef(true)

    const fetchAll = useCallback(async (showLoading = true) => {
        if (fetchingRef.current) return
        fetchingRef.current = true
        if (showLoading) setLoading(true)
        setError(null)

        try {
            const results = await Promise.all(configs.map(c => c.fetcher()))
            if (mountedRef.current) {
                setData(results as any)
                results.forEach((r, i) => store.set(configs[i].key, r))
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err : new Error("Fetch failed"))
            }
        } finally {
            if (mountedRef.current) setLoading(false)
            fetchingRef.current = false
        }
    }, [configs, store])

    useEffect(() => {
        mountedRef.current = true

        if (hasAllCached) {
            setData(cachedEntries as any)
            setLoading(false)
            fetchAll(false) // silent revalidation
        } else {
            fetchAll(true)
        }

        // Register prefetchers
        configs.forEach(c => store.registerPrefetch(c.key, c.fetcher))

        return () => { mountedRef.current = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [configs.map(c => c.key).join(",")])

    const refresh = useCallback(async () => {
        await fetchAll(true)
    }, [fetchAll])

    return { data, loading, error, refresh }
}
