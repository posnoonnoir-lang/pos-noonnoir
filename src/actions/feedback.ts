"use server"

// ============================================================
// FEEDBACK — V2 Feature 5
// QR Code customer feedback on bill
// ============================================================

export type FeedbackRating = 1 | 2 | 3 | 4 | 5

export type FeedbackItemInput = {
    orderItemId: string
    productName: string
    rating: FeedbackRating
    comment?: string
}

export type FeedbackSessionData = {
    id: string
    orderId: string
    orderNumber: string
    sessionToken: string
    items: FeedbackItemInput[]
    overallRating: FeedbackRating | null
    overallComment: string | null
    visitRating: FeedbackRating | null
    serviceRating: FeedbackRating | null
    ambienceRating: FeedbackRating | null
    createdAt: string
    isCompleted: boolean
}

/**
 * Generate feedback session from order
 * Returns a token for QR code
 */
export async function createFeedbackSession(
    orderId: string,
    orderNumber: string,
    orderItems: { id: string; productName: string }[]
): Promise<{ sessionToken: string; feedbackUrl: string }> {
    // Mock — generates a short token
    const token = `fb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

    void orderId
    void orderItems

    return {
        sessionToken: token,
        feedbackUrl: `/feedback/${token}`,
    }
}

/**
 * Get feedback session data (used by public feedback page)
 */
export async function getFeedbackSession(
    _token: string
): Promise<FeedbackSessionData | null> {
    // Mock — return sample data
    return {
        id: "sess-1",
        orderId: "order-1",
        orderNumber: "NN-0042",
        sessionToken: _token,
        items: [
            { orderItemId: "item-1", productName: "Château Margaux 2018", rating: 0 as FeedbackRating, comment: "" },
            { orderItemId: "item-2", productName: "Cheese Board", rating: 0 as FeedbackRating, comment: "" },
            { orderItemId: "item-3", productName: "Tiramisu", rating: 0 as FeedbackRating, comment: "" },
        ],
        overallRating: null,
        overallComment: null,
        visitRating: null,
        serviceRating: null,
        ambienceRating: null,
        createdAt: new Date().toISOString(),
        isCompleted: false,
    }
}

/**
 * Submit feedback from customer
 */
export async function submitFeedback(
    _token: string,
    data: {
        items: FeedbackItemInput[]
        visitRating: FeedbackRating
        serviceRating: FeedbackRating
        ambienceRating: FeedbackRating
        overallRating: FeedbackRating
        overallComment: string
    }
): Promise<{ success: boolean }> {
    // Mock — in production:
    // 1. Update FeedbackSession with all data
    // 2. Create FeedbackItem records
    // 3. Send Telegram notification if rating ≤ 2
    void _token
    void data

    return { success: true }
}

/**
 * Get all feedback for dashboard
 */
export async function getAllFeedback(): Promise<{
    sessions: {
        id: string
        orderNumber: string
        overallRating: number
        serviceRating: number
        visitRating: number
        ambienceRating: number
        overallComment: string | null
        createdAt: string
        items: { productName: string; rating: number; comment: string | null }[]
    }[]
    stats: {
        total: number
        avgOverall: number
        avgService: number
        avgVisit: number
        avgAmbience: number
        distribution: Record<number, number>
    }
}> {
    const sessions = [
        {
            id: "sess-10",
            orderNumber: "NN-0042",
            overallRating: 5,
            serviceRating: 5,
            visitRating: 5,
            ambienceRating: 5,
            overallComment: "Tuyệt vời! Rượu rất ngon, không gian thư giãn tuyệt vời. Sẽ quay lại!",
            createdAt: "2026-03-10T21:30:00Z",
            items: [
                { productName: "Château Margaux 2018", rating: 5, comment: "Chai rượu tuyệt hảo" },
                { productName: "Cheese Board", rating: 5, comment: null },
                { productName: "Tiramisu", rating: 4, comment: "Hơi ngọt" },
            ],
        },
        {
            id: "sess-9",
            orderNumber: "NN-0038",
            overallRating: 4,
            serviceRating: 4,
            visitRating: 5,
            ambienceRating: 4,
            overallComment: "Không gian rất đẹp. Nhân viên thân thiện nhưng hơi chậm lúc đông.",
            createdAt: "2026-03-10T20:15:00Z",
            items: [
                { productName: "Rosé Provence", rating: 5, comment: "Refreshing!" },
                { productName: "Pasta Truffle", rating: 3, comment: "Bình thường" },
            ],
        },
        {
            id: "sess-8",
            orderNumber: "NN-0035",
            overallRating: 3,
            serviceRating: 2,
            visitRating: 4,
            ambienceRating: 3,
            overallComment: "Rượu ngon nhưng phải chờ khá lâu. Nhân viên không giải thích được về wine.",
            createdAt: "2026-03-09T22:00:00Z",
            items: [
                { productName: "Opus One 2019", rating: 5, comment: "Excellent wine" },
                { productName: "Bruschetta", rating: 3, comment: null },
            ],
        },
        {
            id: "sess-7",
            orderNumber: "NN-0030",
            overallRating: 5,
            serviceRating: 5,
            visitRating: 5,
            ambienceRating: 5,
            overallComment: "10/10! Đã recommend cho bạn bè. Trải nghiệm hoàn hảo.",
            createdAt: "2026-03-09T20:45:00Z",
            items: [
                { productName: "Cloudy Bay SB 2022", rating: 5, comment: null },
            ],
        },
        {
            id: "sess-6",
            orderNumber: "NN-0025",
            overallRating: 2,
            serviceRating: 2,
            visitRating: 3,
            ambienceRating: 2,
            overallComment: "Nhạc quá ồn, không thể ngồi nói chuyện. Rượu OK nhưng service cần cải thiện.",
            createdAt: "2026-03-08T21:30:00Z",
            items: [
                { productName: "Pinot Noir Reserve", rating: 4, comment: null },
                { productName: "Cheese Board", rating: 2, comment: "Phô mai bị khô" },
            ],
        },
    ]

    const total = sessions.length
    const avgOverall = Math.round((sessions.reduce((sum, s) => sum + s.overallRating, 0) / total) * 10) / 10
    const avgService = Math.round((sessions.reduce((sum, s) => sum + s.serviceRating, 0) / total) * 10) / 10
    const avgVisit = Math.round((sessions.reduce((sum, s) => sum + s.visitRating, 0) / total) * 10) / 10
    const avgAmbience = Math.round((sessions.reduce((sum, s) => sum + s.ambienceRating, 0) / total) * 10) / 10
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    sessions.forEach((s) => { distribution[s.overallRating] = (distribution[s.overallRating] || 0) + 1 })

    return {
        sessions,
        stats: { total, avgOverall, avgService, avgVisit, avgAmbience, distribution },
    }
}
