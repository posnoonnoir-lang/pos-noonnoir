"use server"

// ============================================================
// SHIFT TARGETS — V2 Feature 2
// Giao chỉ tiêu đầu ca, tổng kết cuối ca
// ============================================================

export type ShiftTargetSuggestion = {
    revenueTarget: number
    orderTarget: number
    customerTarget: number
    pushProducts: { productId: string; productName: string; reason: string }[]
    basedOn: string
}

export type ShiftTargetData = {
    id: string
    shiftRecordId: string
    revenueTarget: number
    orderTarget: number
    customerTarget: number
    pushProducts: { productId: string; productName: string; reason: string }[]
    suggestedBy: string
    approvedBy: string | null
    approvedAt: string | null
    isApproved: boolean
    actualRevenue: number | null
    actualOrders: number | null
    actualCustomers: number | null
    evaluation: string | null
    evaluatedAt: string | null
}

export type ShiftEvaluation = {
    revenueAchieved: number
    orderAchieved: number
    customerAchieved: number
    revenuePct: number
    orderPct: number
    customerPct: number
    overallGrade: "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "POOR"
    gradeLabel: string
    gradeColor: string
}

/**
 * System suggests shift targets based on historical data
 * Queries last 4 weeks same day-of-week performance
 */
export async function suggestShiftTargets(_shiftId: string): Promise<ShiftTargetSuggestion> {
    // Mock — in production, query last 4 weeks of ShiftRecord + Order data
    const dayOfWeek = new Date().getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6

    const baseRevenue = isWeekend ? 8500000 : 5200000
    const baseOrders = isWeekend ? 18 : 12
    const baseCustomers = isWeekend ? 25 : 15

    return {
        revenueTarget: baseRevenue,
        orderTarget: baseOrders,
        customerTarget: baseCustomers,
        pushProducts: [
            { productId: "prod-3", productName: "Cloudy Bay SB 2022", reason: "Chai đã mở – còn 3/8 ly" },
            { productId: "prod-barolo", productName: "Barolo 2017", reason: "Tồn lâu – 21 ngày" },
            { productId: "prod-13", productName: "Tiramisu", reason: "Sắp hết hạn nguyên liệu" },
        ],
        basedOn: `Trung bình ${isWeekend ? "cuối tuần" : "ngày thường"} (4 tuần gần nhất)`,
    }
}

/**
 * Manager approves targets with optional overrides
 */
export async function approveTargets(
    shiftId: string,
    managerId: string,
    overrides?: {
        revenueTarget?: number
        orderTarget?: number
        customerTarget?: number
    }
): Promise<{ success: boolean; targetId: string }> {
    // Mock — in production:
    // 1. Find or create ShiftTarget for shiftId
    // 2. Apply overrides
    // 3. Set approvedBy, approvedAt, isApproved
    void shiftId
    void managerId
    void overrides

    return {
        success: true,
        targetId: "target-" + Date.now(),
    }
}

/**
 * Evaluate shift performance at shift close
 */
export async function evaluateShift(
    _shiftId: string,
    actuals: {
        revenue: number
        orders: number
        customers: number
    },
    evaluationNotes?: string
): Promise<ShiftEvaluation> {
    // Mock targets for comparison
    const targets = await suggestShiftTargets(_shiftId)

    const revenuePct = Math.round((actuals.revenue / targets.revenueTarget) * 100)
    const orderPct = Math.round((actuals.orders / targets.orderTarget) * 100)
    const customerPct = Math.round((actuals.customers / targets.customerTarget) * 100)
    const avgPct = Math.round((revenuePct + orderPct + customerPct) / 3)

    let overallGrade: ShiftEvaluation["overallGrade"]
    let gradeLabel: string
    let gradeColor: string

    if (avgPct >= 100) {
        overallGrade = "EXCELLENT"
        gradeLabel = "🌟 Xuất sắc"
        gradeColor = "text-green-700"
    } else if (avgPct >= 80) {
        overallGrade = "GOOD"
        gradeLabel = "👍 Tốt"
        gradeColor = "text-blue-700"
    } else if (avgPct >= 60) {
        overallGrade = "NEEDS_IMPROVEMENT"
        gradeLabel = "⚠️ Cần cải thiện"
        gradeColor = "text-amber-700"
    } else {
        overallGrade = "POOR"
        gradeLabel = "🔴 Chưa đạt"
        gradeColor = "text-red-700"
    }

    void evaluationNotes // would save in production

    return {
        revenueAchieved: actuals.revenue,
        orderAchieved: actuals.orders,
        customerAchieved: actuals.customers,
        revenuePct,
        orderPct,
        customerPct,
        overallGrade,
        gradeLabel,
        gradeColor,
    }
}

/**
 * Get shift target history for analytics
 */
export async function getShiftTargetHistory(_days: number = 30): Promise<
    {
        date: string
        staffName: string
        revenueTarget: number
        actualRevenue: number
        revenuePct: number
        grade: string
    }[]
> {
    // Mock history data
    return [
        { date: "2026-03-10", staffName: "Ngọc Linh", revenueTarget: 5200000, actualRevenue: 5800000, revenuePct: 112, grade: "EXCELLENT" },
        { date: "2026-03-09", staffName: "Minh Tuấn", revenueTarget: 8500000, actualRevenue: 7200000, revenuePct: 85, grade: "GOOD" },
        { date: "2026-03-08", staffName: "Ngọc Linh", revenueTarget: 8500000, actualRevenue: 9100000, revenuePct: 107, grade: "EXCELLENT" },
        { date: "2026-03-07", staffName: "Hải Yến", revenueTarget: 5200000, actualRevenue: 3900000, revenuePct: 75, grade: "NEEDS_IMPROVEMENT" },
        { date: "2026-03-06", staffName: "Minh Tuấn", revenueTarget: 5200000, actualRevenue: 5100000, revenuePct: 98, grade: "GOOD" },
    ]
}
