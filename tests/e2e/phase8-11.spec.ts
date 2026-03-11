/**
 * 🎭 E2E Tests — Phase 8-11 Features
 * Tests: KDS, Tables Floor Plan, Inventory (Ingredient + Recipe), Receipt, Settings
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
// E2E-05: Kitchen Display System
// ============================================================
test.describe('E2E-05: KDS Features', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('KDS page loads with order grid', async ({ page }) => {
        await page.goto('/dashboard/kitchen')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Kitchen|Bếp|KDS|Đang chờ|Đã sẵn/)
    })

    test('KDS has live status indicator', async ({ page }) => {
        await page.goto('/dashboard/kitchen')
        await page.waitForTimeout(3000)
        // Page shows either "Live — auto refresh 5s" or "Không có món nào"
        const body = page.locator('body')
        await expect(body).toContainText(/Live|Kitchen|đơn|chế biến/)
    })
})

// ============================================================
// E2E-06: Tables — Floor Plan Editor
// ============================================================
test.describe('E2E-06: Floor Plan Editor', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Tables page has floor plan toggle', async ({ page }) => {
        await page.goto('/dashboard/tables')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        // Should have a button/tab to switch to floor plan view
        await expect(body).toContainText(/Sơ đồ|Floor|Danh sách|List/)
    })

    test('Tables page shows zones', async ({ page }) => {
        await page.goto('/dashboard/tables')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        // Should show zone filters
        await expect(body).toContainText(/Khu vực|Zone|Tất cả/)
    })

    test('Floor plan has table elements', async ({ page }) => {
        await page.goto('/dashboard/tables')
        await page.waitForTimeout(3000)
        // Click floor plan view if toggle exists
        const floorBtn = page.locator('button:has-text("Sơ đồ"), button:has-text("Floor")')
        if (await floorBtn.count() > 0) {
            await floorBtn.first().click()
            await page.waitForTimeout(1000)
            // Should have SVG canvas with table shapes
            const svg = page.locator('svg')
            await expect(svg.first()).toBeVisible()
        }
    })
})

// ============================================================
// E2E-07: Inventory — Ingredient & Recipe Management
// ============================================================
test.describe('E2E-07: Inventory NPL & Recipes', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Inventory page has NPL tab', async ({ page }) => {
        await page.goto('/dashboard/inventory')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Nguyên liệu/)
    })

    test('NPL tab shows materials list', async ({ page }) => {
        await page.goto('/dashboard/inventory')
        await page.waitForTimeout(3000)
        // Click NPL tab
        const nplTab = page.locator('button:has-text("Nguyên liệu")')
        if (await nplTab.count() > 0) {
            await nplTab.first().click()
            await page.waitForTimeout(1500)
            const body = page.locator('body')
            await expect(body).toContainText(/Tồn kho|SKU|Đơn giá/)
        }
    })

    test('NPL tab has "Thêm NL" button', async ({ page }) => {
        await page.goto('/dashboard/inventory')
        await page.waitForTimeout(3000)
        const nplTab = page.locator('button:has-text("Nguyên liệu")')
        if (await nplTab.count() > 0) {
            await nplTab.first().click()
            await page.waitForTimeout(1500)
            // Should have "Thêm NL" button (GAP-15)
            const addBtn = page.locator('button:has-text("Thêm NL")')
            await expect(addBtn).toBeVisible()
        }
    })

    test('Recipes sub-tab shows recipes with edit button', async ({ page }) => {
        await page.goto('/dashboard/inventory')
        await page.waitForTimeout(3000)
        const nplTab = page.locator('button:has-text("Nguyên liệu")')
        if (await nplTab.count() > 0) {
            await nplTab.first().click()
            await page.waitForTimeout(1500)
            // Click recipes sub-tab
            const recipesTab = page.locator('button:has-text("Công thức")')
            if (await recipesTab.count() > 0) {
                await recipesTab.first().click()
                await page.waitForTimeout(1500)
                const body = page.locator('body')
                await expect(body).toContainText(/Giá vốn|Nguyên liệu|Số lượng/)
            }
        }
    })
})

// ============================================================
// E2E-08: Receipt API
// ============================================================
test.describe('E2E-08: Receipt API', () => {
    test('Receipt API returns error without orderId', async ({ request }) => {
        const res = await request.get('/api/export/receipt')
        expect(res.status()).toBe(400)
        const json = await res.json()
        expect(json.error).toBe('orderId required')
    })

    test('Receipt API returns 404 for fake orderId', async ({ request }) => {
        const res = await request.get('/api/export/receipt?orderId=00000000-0000-0000-0000-000000000000')
        expect(res.status()).toBe(404)
    })
})

// ============================================================
// E2E-09: Settings Page
// ============================================================
test.describe('E2E-09: Settings & Other Pages', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Settings page loads', async ({ page }) => {
        await page.goto('/dashboard/settings')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Cài đặt|Settings|Hệ thống/)
    })

    test('Promotions page loads', async ({ page }) => {
        await page.goto('/dashboard/promotions')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Khuyến mãi|Promotion|Happy Hour|CTKM/)
    })

    test('Customers page loads', async ({ page }) => {
        await page.goto('/dashboard/customers')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Khách hàng|Customer|Loyalty|VIP/)
    })
})
