import { create } from "zustand"

type CacheEntry = {
    data: any
    timestamp: number
}

type PrefetchStore = {
    cache: Map<string, CacheEntry>
    get: (key: string, maxAgeMs?: number) => any | null
    set: (key: string, data: any) => void
    invalidate: (key: string) => void
    invalidatePrefix: (prefix: string) => void
    invalidateAll: () => void
    prefetchFn: Map<string, () => Promise<any>>
    registerPrefetch: (key: string, fn: () => Promise<any>) => void
    prefetch: (key: string) => void
    prefetchMultiple: (keys: string[]) => void
}

const CACHE_TTL = 300_000 // 5 minutes — stale-while-revalidate keeps data fresh

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

    invalidate: (key: string) => {
        const cache = new Map(get().cache)
        cache.delete(key)
        set({ cache })
    },

    invalidatePrefix: (prefix: string) => {
        const cache = new Map(get().cache)
        for (const k of cache.keys()) {
            if (k.startsWith(prefix)) cache.delete(k)
        }
        set({ cache })
    },

    invalidateAll: () => {
        set({ cache: new Map() })
    },

    registerPrefetch: (key: string, fn: () => Promise<any>) => {
        const prefetchFn = new Map(get().prefetchFn)
        prefetchFn.set(key, fn)
        set({ prefetchFn })
    },

    prefetch: (key: string) => {
        const store = get()
        const existing = store.cache.get(key)
        if (existing && Date.now() - existing.timestamp < CACHE_TTL) return

        const fn = store.prefetchFn.get(key)
        if (!fn) return

        fn().then((data) => {
            const cache = new Map(get().cache)
            cache.set(key, { data, timestamp: Date.now() })
            set({ cache })
        }).catch(() => { })
    },

    prefetchMultiple: (keys: string[]) => {
        keys.forEach((key) => get().prefetch(key))
    },
}))
