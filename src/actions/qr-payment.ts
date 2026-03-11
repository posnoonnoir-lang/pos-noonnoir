"use server"

// ============================================================
// QR PAYMENT — VietQR integration
// Bank config stored in-memory (could be StoreSettings)
// QR generation is real (uses VietQR API)
// ============================================================

export type QRPaymentConfig = {
    bankId: string; bankName: string; bankLogo: string
    accountNumber: string; accountName: string; template: "compact" | "print" | "compact2"
}

export type QRPaymentRequest = {
    id: string; orderId: string; amount: number; description: string; qrDataUrl: string
    status: "PENDING" | "CONFIRMED" | "EXPIRED" | "CANCELLED"
    createdAt: Date; expiresAt: Date; confirmedAt: Date | null
}

const BANK_CONFIG: QRPaymentConfig = {
    bankId: "970422", bankName: "MB Bank", bankLogo: "🏦",
    accountNumber: "0388899999", accountName: "NOON AND NOIR CO LTD", template: "compact2",
}

const QR_PAYMENTS: QRPaymentRequest[] = []

export async function getBankConfig(): Promise<QRPaymentConfig> { return { ...BANK_CONFIG } }

export async function generateQRPayment(params: {
    orderId: string; amount: number; description: string
}): Promise<{ success: boolean; data?: QRPaymentRequest }> {
    const addInfo = encodeURIComponent(params.description)
    const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNumber}-${BANK_CONFIG.template}.png?amount=${params.amount}&addInfo=${addInfo}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`

    const payment: QRPaymentRequest = {
        id: `qr-${Date.now()}`, orderId: params.orderId, amount: params.amount,
        description: params.description, qrDataUrl: qrUrl, status: "PENDING",
        createdAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60 * 1000), confirmedAt: null,
    }
    QR_PAYMENTS.push(payment)
    return { success: true, data: payment }
}

export async function checkQRPaymentStatus(paymentId: string): Promise<{
    status: "PENDING" | "CONFIRMED" | "EXPIRED" | "CANCELLED"; confirmedAt: Date | null
}> {
    const payment = QR_PAYMENTS.find((p) => p.id === paymentId)
    if (!payment) return { status: "EXPIRED", confirmedAt: null }
    if (payment.status === "PENDING" && new Date() > payment.expiresAt) payment.status = "EXPIRED"
    return { status: payment.status, confirmedAt: payment.confirmedAt }
}

export async function confirmQRPayment(paymentId: string): Promise<{ success: boolean }> {
    const payment = QR_PAYMENTS.find((p) => p.id === paymentId)
    if (!payment || payment.status !== "PENDING") return { success: false }
    payment.status = "CONFIRMED"
    payment.confirmedAt = new Date()
    return { success: true }
}

export async function cancelQRPayment(paymentId: string): Promise<{ success: boolean }> {
    const payment = QR_PAYMENTS.find((p) => p.id === paymentId)
    if (!payment || payment.status !== "PENDING") return { success: false }
    payment.status = "CANCELLED"
    return { success: true }
}

export async function updateBankConfig(config: Partial<QRPaymentConfig>): Promise<{ success: boolean }> {
    Object.assign(BANK_CONFIG, config)
    return { success: true }
}
