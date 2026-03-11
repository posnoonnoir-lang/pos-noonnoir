"use server"

// ============================================================
// PUSH SALE — V2 Feature 6
// Items that should be push-sold: oxidation risk, low glasses, slow-moving
// ============================================================

export type PushSaleItem = {
    id: string
    productId: string
    productName: string
    reason: string
    reasonType: "OXIDATION" | "LOW_GLASSES" | "SLOW_MOVING" | "NEAR_EXPIRY"
    urgency: "HIGH" | "MEDIUM" | "LOW"
    detail: string
    suggestedDiscount: number
    currentPrice: number
    glassesRemaining?: number
    hoursOpened?: number
    daysUnsold?: number
}

export async function getPushSaleItems(): Promise<PushSaleItem[]> {
    // Mock data — will be replaced with real Prisma queries
    const items: PushSaleItem[] = [
        {
            id: "push-1",
            productId: "prod-3",
            productName: "Cloudy Bay SB 2022",
            reason: "Oxy hóa — quá ngưỡng",
            reasonType: "OXIDATION",
            urgency: "HIGH",
            detail: "Mở 52h trước · Ngưỡng: 48h · Còn 3/8 ly",
            suggestedDiscount: 30,
            currentPrice: 85000,
            glassesRemaining: 3,
            hoursOpened: 52,
        },
        {
            id: "push-2",
            productId: "prod-rosé",
            productName: "Rosé Provence",
            reason: "Oxy hóa — quá ngưỡng",
            reasonType: "OXIDATION",
            urgency: "HIGH",
            detail: "Mở 30h trước · Ngưỡng: 24h · Còn 5/8 ly",
            suggestedDiscount: 25,
            currentPrice: 95000,
            glassesRemaining: 5,
            hoursOpened: 30,
        },
        {
            id: "push-3",
            productId: "prod-4",
            productName: "Cabernet Sauvignon",
            reason: "Sắp hết ly",
            reasonType: "LOW_GLASSES",
            urgency: "MEDIUM",
            detail: "Còn 2/8 ly · Chai gần cạn",
            suggestedDiscount: 15,
            currentPrice: 90000,
            glassesRemaining: 2,
            hoursOpened: 18,
        },
        {
            id: "push-4",
            productId: "prod-barolo",
            productName: "Barolo 2017",
            reason: "Tồn lâu — 21 ngày không bán",
            reasonType: "SLOW_MOVING",
            urgency: "LOW",
            detail: "21 ngày không bán · Tồn: 4 chai",
            suggestedDiscount: 10,
            currentPrice: 2500000,
            daysUnsold: 21,
        },
    ]

    return items
}

export async function applyPushDiscount(
    productId: string,
    discountPct: number,
    _managerPin: string
): Promise<{ success: boolean; error?: string }> {
    // Mock — verify PIN + apply discount to product
    if (!_managerPin || _managerPin.length < 4) {
        return { success: false, error: "PIN không hợp lệ" }
    }

    if (discountPct < 5 || discountPct > 50) {
        return { success: false, error: "Giảm giá phải từ 5% đến 50%" }
    }

    // In real implementation:
    // 1. Verify manager PIN
    // 2. Create a temporary price override
    // 3. Log to AuditLog
    // 4. Notify via Telegram if configured

    return { success: true }
}
