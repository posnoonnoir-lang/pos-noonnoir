/**
 * 🧪 Unit Tests — QR Payment + Notifications (P2)
 * Tests VietQR flow and notification management
 */
import { describe, it, expect } from 'vitest'
import {
    getBankConfig,
    generateQRPayment,
    checkQRPaymentStatus,
    confirmQRPayment,
    cancelQRPayment,
    updateBankConfig,
} from '@/actions/qr-payment'
import {
    getNotifications,
    markAllAsRead,
    getNotificationStats,
    getAlertRules,
} from '@/actions/notifications'

// ─── QR PAYMENT ───────────────────────────────────────────────

describe('QR Payment — VietQR (Real DB)', () => {
    let qrPaymentId: string

    it('U-QR-01: getBankConfig — should return bank account info', async () => {
        const config = await getBankConfig()
        expect(config).toHaveProperty('bankId')
        expect(config).toHaveProperty('bankName')
        expect(config).toHaveProperty('accountNumber')
        expect(config).toHaveProperty('accountName')
        expect(config).toHaveProperty('template')
        expect(config.accountNumber).toBeTruthy()
    })

    it('U-QR-02: generateQRPayment — should return QR data', async () => {
        const result = await generateQRPayment({
            orderId: 'test-order-id',
            amount: 500000,
            description: 'Test QR Payment',
        })
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data!.qrDataUrl).toContain('vietqr.io')
        expect(result.data!.amount).toBe(500000)
        expect(result.data!.status).toBe('PENDING')
        qrPaymentId = result.data!.id
    })

    it('U-QR-03: checkQRPaymentStatus — PENDING payment should be PENDING', async () => {
        if (!qrPaymentId) return
        const result = await checkQRPaymentStatus(qrPaymentId)
        expect(result.status).toBe('PENDING')
        expect(result.confirmedAt).toBeNull()
    })

    it('U-QR-04: confirmQRPayment — should mark as CONFIRMED', async () => {
        if (!qrPaymentId) return
        const result = await confirmQRPayment(qrPaymentId)
        expect(result.success).toBe(true)

        const status = await checkQRPaymentStatus(qrPaymentId)
        expect(status.status).toBe('CONFIRMED')
        expect(status.confirmedAt).not.toBeNull()
    })

    it('U-QR-05: cancelQRPayment — non-PENDING should fail', async () => {
        if (!qrPaymentId) return
        // Payment was already confirmed, so cancel should fail
        const result = await cancelQRPayment(qrPaymentId)
        expect(result.success).toBe(false)
    })

    it('U-QR-06: generateQRPayment + cancelQRPayment — PENDING can be cancelled', async () => {
        const result = await generateQRPayment({
            orderId: 'test-cancel',
            amount: 100000,
            description: 'Test cancel',
        })
        expect(result.success).toBe(true)
        const cancelResult = await cancelQRPayment(result.data!.id)
        expect(cancelResult.success).toBe(true)
    })

    it('U-QR-07: updateBankConfig — should update config', async () => {
        const result = await updateBankConfig({ bankName: 'Test Bank' })
        expect(result.success).toBe(true)
        const config = await getBankConfig()
        expect(config.bankName).toBe('Test Bank')
        // Restore
        await updateBankConfig({ bankName: 'MB Bank' })
    })

    it('U-QR-08: checkQRPaymentStatus — expired payment should be EXPIRED', async () => {
        const result = await checkQRPaymentStatus('nonexistent-payment-id')
        expect(result.status).toBe('EXPIRED')
    })
})

// ─── NOTIFICATIONS ────────────────────────────────────────────

describe('Notifications (Real DB)', () => {
    it('U-NOT-01: getNotifications — should return notification list', async () => {
        const notifications = await getNotifications()
        expect(Array.isArray(notifications)).toBe(true)
        if (notifications.length > 0) {
            expect(notifications[0]).toHaveProperty('id')
            expect(notifications[0]).toHaveProperty('title')
            expect(notifications[0]).toHaveProperty('priority')
        }
    })

    it('U-NOT-02: getNotificationStats — should return unread/total counts', async () => {
        const stats = await getNotificationStats()
        expect(stats).toHaveProperty('total')
        expect(stats).toHaveProperty('unread')
        expect(typeof stats.total).toBe('number')
        expect(typeof stats.unread).toBe('number')
    })

    it('U-NOT-03: getAlertRules — should return configurable alert rules', async () => {
        const rules = await getAlertRules()
        expect(Array.isArray(rules)).toBe(true)
        if (rules.length > 0) {
            expect(rules[0]).toHaveProperty('id')
            expect(rules[0]).toHaveProperty('name')
            expect(rules[0]).toHaveProperty('isEnabled')
        }
    })

    it('U-NOT-04: markAllAsRead — should not throw', async () => {
        const result = await markAllAsRead()
        expect(result).toHaveProperty('success')
    })
})
