/// <reference lib="webworker" />

/**
 * Noon & Noir POS — Service Worker
 * Strategy: Network-first for API/actions, Cache-first for static assets
 * Offline queue: stores failed POST/PUT requests and replays when back online
 */

const SW_VERSION = "v1.0.0"
const CACHE_STATIC = `nn-static-${SW_VERSION}`
const CACHE_RUNTIME = `nn-runtime-${SW_VERSION}`
const CACHE_API = `nn-api-${SW_VERSION}`
const OFFLINE_QUEUE_KEY = "nn-offline-queue"

// Static assets to pre-cache on install
const PRECACHE_URLS = [
    "/",
    "/pos",
    "/offline",
    "/manifest.json",
]

// Patterns to cache (regex)
const CACHEABLE_STATIC = /\.(js|css|woff2?|ttf|png|svg|ico|webp|jpg|jpeg)$/
const API_PATTERNS = /\/(api|_next\/data)\//
const SERVER_ACTION_PATTERN = /\/_next\/server/

// ============================================================
// INSTALL — pre-cache critical assets
// ============================================================
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_STATIC).then((cache) => {
            console.log(`[SW] Installing ${SW_VERSION}, pre-caching ${PRECACHE_URLS.length} URLs`)
            return cache.addAll(PRECACHE_URLS).catch((err) => {
                console.warn("[SW] Pre-cache partial failure:", err)
            })
        })
    )
    self.skipWaiting()
})

// ============================================================
// ACTIVATE — clean old caches
// ============================================================
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key.startsWith("nn-") && key !== CACHE_STATIC && key !== CACHE_RUNTIME && key !== CACHE_API)
                    .map((key) => {
                        console.log(`[SW] Deleting old cache: ${key}`)
                        return caches.delete(key)
                    })
            )
        })
    )
    self.clients.claim()
})

// ============================================================
// FETCH — strategy router
// ============================================================
self.addEventListener("fetch", (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Skip non-GET for caching (but queue offline writes)
    if (request.method !== "GET") {
        if (request.method === "POST" && !navigator.onLine) {
            event.respondWith(handleOfflinePost(request))
            return
        }
        return
    }

    // Strategy: API calls → Network-first with cache fallback
    if (API_PATTERNS.test(url.pathname)) {
        event.respondWith(networkFirstWithCache(request, CACHE_API, 5000))
        return
    }

    // Strategy: Static assets → Cache-first with network fallback
    if (CACHEABLE_STATIC.test(url.pathname) || url.pathname.startsWith("/_next/static/")) {
        event.respondWith(cacheFirstWithNetwork(request, CACHE_STATIC))
        return
    }

    // Strategy: HTML pages → Network-first, offline fallback
    if (request.headers.get("accept")?.includes("text/html")) {
        event.respondWith(networkFirstWithOffline(request))
        return
    }

    // Default: network
    event.respondWith(fetch(request))
})

// ============================================================
// CACHE STRATEGIES
// ============================================================

async function networkFirstWithCache(request, cacheName, timeout = 5000) {
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(request, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (response.ok) {
            const cache = await caches.open(cacheName)
            cache.put(request, response.clone())
        }
        return response
    } catch {
        const cached = await caches.match(request)
        if (cached) {
            console.log("[SW] Serving from cache (offline):", request.url)
            return cached
        }
        return new Response(JSON.stringify({ error: "Offline", cached: false }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
        })
    }
}

async function cacheFirstWithNetwork(request, cacheName) {
    const cached = await caches.match(request)
    if (cached) return cached

    try {
        const response = await fetch(request)
        if (response.ok) {
            const cache = await caches.open(cacheName)
            cache.put(request, response.clone())
        }
        return response
    } catch {
        return new Response("Offline", { status: 503 })
    }
}

async function networkFirstWithOffline(request) {
    try {
        const response = await fetch(request)
        if (response.ok) {
            const cache = await caches.open(CACHE_RUNTIME)
            cache.put(request, response.clone())
        }
        return response
    } catch {
        // Try cache
        const cached = await caches.match(request)
        if (cached) return cached

        // Fallback to offline page
        const offlinePage = await caches.match("/offline")
        if (offlinePage) return offlinePage

        return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
        })
    }
}

// ============================================================
// OFFLINE QUEUE — store failed POST requests for replay
// ============================================================

async function handleOfflinePost(request) {
    try {
        const body = await request.text()
        const queueItem = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body,
            timestamp: Date.now(),
        }

        // Store in IndexedDB via BroadcastChannel
        const clients = await self.clients.matchAll()
        for (const client of clients) {
            client.postMessage({
                type: "OFFLINE_QUEUE_ADD",
                payload: queueItem,
            })
        }

        return new Response(
            JSON.stringify({
                success: true,
                queued: true,
                message: "Đã lưu offline — sẽ gửi khi có mạng",
                queueId: queueItem.id,
            }),
            {
                status: 202,
                headers: { "Content-Type": "application/json" },
            }
        )
    } catch {
        return new Response(
            JSON.stringify({ error: "Không thể lưu offline" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
}

// ============================================================
// SYNC — replay queued requests when back online
// ============================================================
self.addEventListener("sync", (event) => {
    if (event.tag === "nn-offline-sync") {
        event.waitUntil(replayOfflineQueue())
    }
})

async function replayOfflineQueue() {
    const clients = await self.clients.matchAll()
    for (const client of clients) {
        client.postMessage({ type: "OFFLINE_QUEUE_REPLAY" })
    }
}

// Listen for online event from clients
self.addEventListener("message", (event) => {
    if (event.data?.type === "ONLINE_RESTORED") {
        replayOfflineQueue()
    }
    if (event.data?.type === "SKIP_WAITING") {
        self.skipWaiting()
    }
})

// ============================================================
// OFFLINE HTML FALLBACK
// ============================================================
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline — Noon & Noir</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    background: #faf7f2;
    color: #14532d;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
  }
  .container {
    text-align: center;
    max-width: 420px;
  }
  .icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    animation: float 3s ease-in-out infinite;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
  }
  p {
    color: #8b7355;
    font-size: 0.875rem;
    line-height: 1.6;
    margin-bottom: 2rem;
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #fff;
    border: 1px solid #e8e0d5;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #b45309;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .dot {
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  .queue-info {
    margin-top: 1.5rem;
    padding: 1rem;
    background: rgba(22, 101, 52, 0.05);
    border: 1px solid rgba(22, 101, 52, 0.1);
    border-radius: 12px;
    font-size: 0.75rem;
    color: #166534;
  }
  button {
    margin-top: 1.5rem;
    padding: 0.75rem 2rem;
    background: #14532d;
    color: #faf7f2;
    border: none;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  button:hover { background: #166534; }
</style>
</head>
<body>
  <div class="container">
    <div class="icon">🍷</div>
    <h1>Mất kết nối mạng</h1>
    <p>
      Noon & Noir POS đang hoạt động offline.<br>
      Các đơn hàng sẽ được lưu tạm và tự động gửi khi có mạng trở lại.
    </p>
    <div class="status">
      <span class="dot"></span>
      Đang chờ kết nối...
    </div>
    <div class="queue-info" id="queueInfo" style="display:none">
      📋 <span id="queueCount">0</span> đơn đang chờ gửi
    </div>
    <button onclick="location.reload()">Thử lại</button>
  </div>
  <script>
    window.addEventListener('online', () => location.reload());
  </script>
</body>
</html>`
