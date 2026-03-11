/**
 * 🧪 Unit Tests — Operational, Tax, QR Payment, Notifications
 */
import { describe, it, expect } from 'vitest'
import {
    get86List,
    getServiceChargeConfig,
    calculateServiceCharge,
    getDiscountLogs,
    getTransferHistory,
} from '@/actions/operational'
import { getTaxRates, calculateTax } from '@/actions/tax'
import {
    getBankConfig,
    generateQRPayment,
    checkQRPaymentStatus,
    confirmQRPayment,
    cancelQRPayment,
} from '@/actions/qr-payment'
import {
    getNotifications,
    getNotificationStats,
    markAsRead,
    markAllAsRead,
    getAlertRules,
} from '@/actions/notifications'

describe('Operational — 86, Service Charge, Discounts (Real DB)', () => {
    it('U-OPS-01: get86List — should return out-of-stock list', async () => {
        const list = await get86List()
        expect(Array.isArray(list)).toBe(true)
    })

    it('U-OPS-02: getServiceChargeConfig — should return config', async () => {
        const config = await getServiceChargeConfig()
        expect(config).toHaveProperty('enabled')
        expect(config).toHaveProperty('rate')
        expect(config).toHaveProperty('label')
        expect(config).toHaveProperty('applyTo')
    })

    it('U-OPS-03: calculateServiceCharge — dine-in should apply charge', async () => {
        const result = await calculateServiceCharge(1000000, 'DINE_IN')
        expect(result).toHaveProperty('amount')
        expect(result).toHaveProperty('rate')
        expect(result).toHaveProperty('label')
        expect(result.amount).toBeGreaterThanOrEqual(0)
    })

    it('U-OPS-04: calculateServiceCharge — takeaway should be 0', async () => {
        const result = await calculateServiceCharge(1000000, 'TAKEAWAY')
        // If applyTo is DINE_IN_ONLY, takeaway should be 0
        expect(result.amount).toBe(0)
    })

    it('U-OPS-05: getDiscountLogs — should return log list', async () => {
        const logs = await getDiscountLogs()
        expect(Array.isArray(logs)).toBe(true)
    })

    it('U-OPS-06: getTransferHistory — should return history', async () => {
        const history = await getTransferHistory()
        expect(Array.isArray(history)).toBe(true)
    })
})

describe('Tax (Real DB)', () => {
    it('U-TAX-01: getTaxRates — should return tax rate list', async () => {
        const rates = await getTaxRates()
        expect(Array.isArray(rates)).toBe(true)
        if (rates.length > 0) {
            expect(rates[0]).toHaveProperty('name')
            expect(rates[0]).toHaveProperty('code')
            expect(rates[0]).toHaveProperty('rate')
            expect(typeof rates[0].rate).toBe('number')
        }
    })

    it('U-TAX-02: calculateTax — without taxRateId returns 0', async () => {
        const result = await calculateTax(1000000)
        expect(result.taxAmount).toBe(0)
        expect(result.taxRate).toBe(0)
    })

    it('U-TAX-03: calculateTax — with valid taxRateId calculates correctly', async () => {
        const rates = await getTaxRates()
        if (rates.length === 0) return
        const result = await calculateTax(1000000, rates[0].id)
        expect(result.taxAmount).toBeGreaterThanOrEqual(0)
        expect(result.taxName).toBe(rates[0].name)
    })
})

describe('QR Payment (In-Memory)', () => {
    let paymentId: string

    it('U-QR-01: getBankConfig — should return bank config', async () => {
        const config = await getBankConfig()
        expect(config).toHaveProperty('bankId')
        expect(config).toHaveProperty('bankName')
        expect(config).toHaveProperty('accountNumber')
        expect(config).toHaveProperty('accountName')
    })

    it('U-QR-02: generateQRPayment — should create QR payment', async () => {
        const result = await generateQRPayment({
            orderId: 'test-order',
            amount: 500000,
            description: 'Test QR payment',
        })
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data!.qrDataUrl).toContain('vietqr.io')
        paymentId = result.data!.id
    })

    it('U-QR-03: checkQRPaymentStatus — should return PENDING', async () => {
        const result = await checkQRPaymentStatus(paymentId)
        expect(result.status).toBe('PENDING')
    })

    it('U-QR-04: confirmQRPayment — should confirm payment', async () => {
        const result = await confirmQRPayment(paymentId)
        expect(result.success).toBe(true)

        const status = await checkQRPaymentStatus(paymentId)
        expect(status.status).toBe('CONFIRMED')
    })

    it('U-QR-05: cancelQRPayment — already confirmed should fail', async () => {
        const result = await cancelQRPayment(paymentId)
        expect(result.success).toBe(false)
    })
})

describe('Notifications (Real DB)', () => {
    it('U-NOT-01: getNotifications — should return live notifications', async () => {
        const notifications = await getNotifications()
        expect(Array.isArray(notifications)).toBe(true)
        for (const n of notifications) {
            expect(n).toHaveProperty('title')
            expect(n).toHaveProperty('priority')
            expect(n).toHaveProperty('category')
            expect(['CRITICAL', 'WARNING', 'INFO']).toContain(n.priority)
        }
    })

    it('U-NOT-02: getNotificationStats — should return counts', async () => {
        const stats = await getNotificationStats()
        expect(stats).toHaveProperty('total')
        expect(stats).toHaveProperty('unread')
        expect(stats).toHaveProperty('critical')
        expect(stats).toHaveProperty('warning')
        expect(stats).toHaveProperty('info')
    })

    it('U-NOT-03: markAsRead — should mark notification as read', async () => {
        const result = await markAsRead('test-notification-id')
        expect(result.success).toBe(true)
    })

    it('U-NOT-04: markAllAsRead — should mark all as read', async () => {
        const result = await markAllAsRead()
        expect(result.success).toBe(true)
    })

    it('U-NOT-05: getAlertRules — should return system rules', async () => {
        const rules = await getAlertRules()
        expect(Array.isArray(rules)).toBe(true)
        expect(rules.length).toBeGreaterThan(0)
        expect(rules[0]).toHaveProperty('name')
        expect(rules[0]).toHaveProperty('category')
        expect(rules[0]).toHaveProperty('isEnabled')
    })
})
