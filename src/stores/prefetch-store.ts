import { create } from "zustand"

type CacheEntry = {
    data: any
    timestamp: number
}

type PrefetchStore = {
    cache: Map<string, CacheEntry>
    get: (key: string, maxAgeMs?: number) => any | null
    set: (key: string, data: any) => void
    prefetchFn: Map<string, () => Promise<any>>
    registerPrefetch: (key: string, fn: () => Promise<any>) => void
    prefetch: (key: string) => void
}

const CACHE_TTL = 30_000 // 30 seconds

export const usePrefetchStore = create<PrefetchStore>((set, get) => ({
    cache: new Map(),
    prefetchFn: new Map(),

    get: (key: string, maxAgeMs = CACHE_TTL) => {
        const entry = get().cache.get(key)
        if (!entry) return null
        if (Date.now() - entry.timestamp > maxAgeMs) return null
        return entry.data
    },

    set: (key: string, data: any) => {
        const cache = new Map(get().cache)
        cache.set(key, { data, timestamp: Date.now() })
        set({ cache })
    },

    registerPrefetch: (key: string, fn: () => Promise<any>) => {
        const prefetchFn = new Map(get().prefetchFn)
        prefetchFn.set(key, fn)
        set({ prefetchFn })
    },

    prefetch: (key: string) => {
        const store = get()
        // Already cached and fresh? Skip
        const existing = store.cache.get(key)
        if (existing && Date.now() - existing.timestamp < CACHE_TTL) return

        // Find registered fetcher
        const fn = store.prefetchFn.get(key)
        if (!fn) return

        // Fire and forget
        fn().then((data) => {
            const cache = new Map(get().cache)
            cache.set(key, { data, timestamp: Date.now() })
            set({ cache })
        }).catch(() => { })
    },
}))
