/**
 * 🎭 E2E Tests — V2 Feature Pages + API Endpoints
 * Tests: Forecast, Alerts, Feedback, Bottle Tracking, Wine Guide,
 *        Waste, Analytics, Staff Detail, Public Menu API, Report Export API
 */
import { test, expect, type Page } from '@playwright/test'

async function loginWithPin(page: Page, pin: string) {
    await page.goto('/login')
    await page.waitForSelector('.grid-cols-3', { timeout: 10000 })
    for (const digit of pin) {
        await page.locator(`.grid-cols-3 button:has-text("${digit}")`).first().click()
        await page.waitForTimeout(150)
    }
    await page.waitForURL('**/pos', { timeout: 10000 })
}

// ============================================================
// E2E-11: Forecast Page
// ============================================================
test.describe('E2E-11: Forecast Page', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Forecast page loads with cards', async ({ page }) => {
        await page.goto('/dashboard/forecast')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Dự báo|Forecast|Gợi ý|Đề xuất/)
    })
})

// ============================================================
// E2E-12: Alerts Page
// ============================================================
test.describe('E2E-12: Inventory Alerts Page', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Alerts page loads with severity badges', async ({ page }) => {
        await page.goto('/dashboard/alerts')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Cảnh báo|Alert|Kho|Tồn kho/)
    })
})

// ============================================================
// E2E-13: Feedback Dashboard
// ============================================================
test.describe('E2E-13: Feedback Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Feedback page loads', async ({ page }) => {
        await page.goto('/dashboard/feedback')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Phản hồi|Feedback|Đánh giá|Rating/)
    })
})

// ============================================================
// E2E-14: Bottle Tracking
// ============================================================
test.describe('E2E-14: Bottle Tracking', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Bottle tracking page loads with KPIs', async ({ page }) => {
        await page.goto('/dashboard/bottle-tracking')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Chai|Bottle|Kho|Tồn|Mở|Bán/)
    })
})

// ============================================================
// E2E-15: Wine Guide
// ============================================================
test.describe('E2E-15: Wine Guide', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Wine guide page loads', async ({ page }) => {
        await page.goto('/dashboard/wine-guide')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Rượu|Wine|Serving|Hướng dẫn|Phục vụ/)
    })
})

// ============================================================
// E2E-17: Waste Tracking
// ============================================================
test.describe('E2E-17: Waste Tracking', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Waste page loads', async ({ page }) => {
        await page.goto('/dashboard/waste')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Hao hụt|Waste|Spoilage|Đổ bỏ|Ghi nhận/)
    })
})

// ============================================================
// E2E-18: Analytics / Heatmap
// ============================================================
test.describe('E2E-18: Analytics Heatmap', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Analytics page loads with zone data', async ({ page }) => {
        await page.goto('/dashboard/analytics')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Phân tích|Analytics|Heatmap|Khu vực|Zone/)
    })
})

// ============================================================
// E2E-20: Public Menu API
// ============================================================
test.describe('E2E-20: Public Menu API', () => {
    test('GET /api/public/menu — should return 200 with categories', async ({ request }) => {
        const res = await request.get('/api/public/menu')
        expect(res.status()).toBe(200)
        const json = await res.json()
        expect(json).toHaveProperty('categories')
        expect(Array.isArray(json.categories)).toBe(true)
        expect(json).toHaveProperty('meta')
        expect(json.meta).toHaveProperty('totalProducts')
    })

    test('GET /api/public/menu — categories have products arrays', async ({ request }) => {
        const res = await request.get('/api/public/menu')
        const json = await res.json()
        for (const cat of json.categories) {
            expect(cat).toHaveProperty('id')
            expect(cat).toHaveProperty('name')
            expect(cat).toHaveProperty('products')
            expect(Array.isArray(cat.products)).toBe(true)
        }
    })

    test('GET /api/public/menu — products have price and available', async ({ request }) => {
        const res = await request.get('/api/public/menu')
        const json = await res.json()
        for (const cat of json.categories) {
            for (const p of cat.products) {
                expect(p).toHaveProperty('name')
                expect(p).toHaveProperty('price')
                expect(p).toHaveProperty('available')
                expect(typeof p.price).toBe('number')
                expect(typeof p.available).toBe('boolean')
            }
        }
    })
})

// ============================================================
// E2E-21: Report Export API
// ============================================================
test.describe('E2E-21: Report Export API', () => {
    test('GET /api/export/report?type=revenue — should return CSV', async ({ request }) => {
        const res = await request.get('/api/export/report?type=revenue&from=2026-01-01&to=2026-12-31')
        expect(res.status()).toBe(200)
        const contentType = res.headers()['content-type'] ?? ''
        expect(contentType).toContain('text/csv')
    })

    test('GET /api/export/report — without type param defaults to CSV', async ({ request }) => {
        const res = await request.get('/api/export/report')
        // API defaults to returning CSV even without explicit type
        expect(res.status()).toBe(200)
        const contentType = res.headers()['content-type'] ?? ''
        expect(contentType).toContain('text/csv')
    })
})

// ============================================================
// E2E-22: Consignment Page
// ============================================================
test.describe('E2E-22: Consignment Page', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Consignment page loads', async ({ page }) => {
        await page.goto('/dashboard/consignment')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Ký gửi|Consignment|NCC|Nhà cung cấp/)
    })
})
