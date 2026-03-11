/**
 * 🎭 E2E Tests — POS Noonnoir
 * Tests critical user flows on a real browser.
 */
import { test, expect, type Page } from '@playwright/test'

// ============================================================
// Helper: Login via PIN numpad
// ============================================================
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
// E2E-01: Login Flow
// ============================================================
test.describe('E2E-01: Login Flow', () => {
    test('Should display login page with PIN numpad', async ({ page }) => {
        await page.goto('/login')
        await expect(page.locator('text=Noon')).toBeVisible({ timeout: 10000 })
        await expect(page.locator('text=Nhập mã PIN')).toBeVisible()
        // Numpad grid should be visible
        await expect(page.locator('.grid-cols-3')).toBeVisible()
    })

    test('Should login with Owner PIN (1234) and reach POS', async ({ page }) => {
        await loginWithPin(page, '1234')
        await expect(page).toHaveURL(/\/pos/)
        // POS should have product cards
        await page.waitForTimeout(2000)
        const body = page.locator('body')
        await expect(body).toContainText(/Tìm sản phẩm|Tại bàn|Mang đi/)
    })

    test('Should reject invalid PIN and stay on login', async ({ page }) => {
        await page.goto('/login')
        await page.waitForSelector('.grid-cols-3', { timeout: 10000 })

        for (const digit of '9999') {
            await page.locator(`.grid-cols-3 button:has-text("${digit}")`).first().click()
            await page.waitForTimeout(150)
        }

        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/\/login/)
    })
})

// ============================================================
// E2E-02: POS Page — Products & Cart
// ============================================================
test.describe('E2E-02: POS — Products & Cart', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
        await page.waitForTimeout(2000)
    })

    test('Should display product cards', async ({ page }) => {
        // Products section should have wine/food items
        const body = page.locator('body')
        // Look for price patterns like "đ" or product names
        await expect(body).toContainText(/đ/)
    })

    test('Should have order type toggle (Dine-in/Takeaway)', async ({ page }) => {
        const body = page.locator('body')
        await expect(body).toContainText(/Tại bàn/)
        await expect(body).toContainText(/Mang đi/)
    })

    test('Should have search input', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Tìm"]').first()
        await expect(searchInput).toBeVisible()
    })

    test('Should show shift button', async ({ page }) => {
        const body = page.locator('body')
        // Should show either "Mở ca" or "Ca đang mở" or shift info
        await expect(body).toContainText(/ca|Ca/)
    })
})

// ============================================================
// E2E-03: Dashboard Navigation
// ============================================================
test.describe('E2E-03: Dashboard Pages', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Dashboard overview loads', async ({ page }) => {
        await page.goto('/dashboard')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        // Should have some dashboard content
        await expect(body).not.toBeEmpty()
    })

    test('Menu page loads', async ({ page }) => {
        await page.goto('/dashboard/menu')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Thực đơn|Menu|Sản phẩm|Danh mục/)
    })

    test('Inventory page loads', async ({ page }) => {
        await page.goto('/dashboard/inventory')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Kho|Tồn kho|Inventory|Nguyên liệu/)
    })

    test('Finance page loads', async ({ page }) => {
        await page.goto('/dashboard/finance')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Tài chính|Finance|Doanh thu|Ca làm/)
    })

    test('Tables page loads', async ({ page }) => {
        await page.goto('/dashboard/tables')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Bàn|Table|Zone|Khu vực/)
    })

    test('Staff page loads', async ({ page }) => {
        await page.goto('/dashboard/staff')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Nhân sự|Staff|nhân viên/)
    })

    test('Reports page loads', async ({ page }) => {
        await page.goto('/dashboard/reports')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Báo cáo|Report|Doanh thu|Thống kê/)
    })
})

// ============================================================
// E2E-04: Kitchen Display
// ============================================================
test.describe('E2E-04: Kitchen & Orders', () => {
    test.beforeEach(async ({ page }) => {
        await loginWithPin(page, '1234')
    })

    test('Kitchen page loads', async ({ page }) => {
        await page.goto('/pos/kitchen')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Kitchen|Bếp|Đơn|Chờ/)
    })

    test('Orders history page loads', async ({ page }) => {
        await page.goto('/pos/orders')
        await page.waitForTimeout(3000)
        const body = page.locator('body')
        await expect(body).toContainText(/Đơn hàng|Orders|Lịch sử|ORD/)
    })
})
