"use server"

import { prisma } from "@/lib/prisma"

// ============================================================
// POS CONFIG — Global POS settings stored in AuditLog
// Key-value config using AuditLog as persistent store
// ============================================================

export type PaymentMode = "PAY_FIRST" | "PAY_AFTER"

export type PosConfig = {
    paymentMode: PaymentMode
    takeawayAlwaysPayFirst: boolean // always true, but kept for clarity
    allowTableAssignLater: boolean  // in PAY_FIRST, assign table after serving
}

const CONFIG_KEY = "POS_CONFIG"

const DEFAULT_CONFIG: PosConfig = {
    paymentMode: "PAY_AFTER",
    takeawayAlwaysPayFirst: true,
    allowTableAssignLater: true,
}

/** Get POS config from DB (latest AuditLog entry with action=POS_CONFIG) */
export async function getPosConfig(): Promise<PosConfig> {
    try {
        const log = await prisma.auditLog.findFirst({
            where: { action: CONFIG_KEY },
            orderBy: { createdAt: "desc" },
        })
        if (!log?.newData) return { ...DEFAULT_CONFIG }
        const data = log.newData as Record<string, unknown>
        return {
            paymentMode: (data.paymentMode as PaymentMode) ?? DEFAULT_CONFIG.paymentMode,
            takeawayAlwaysPayFirst: data.takeawayAlwaysPayFirst !== false,
            allowTableAssignLater: data.allowTableAssignLater !== false,
        }
    } catch {
        return { ...DEFAULT_CONFIG }
    }
}

/** Update POS config (creates new AuditLog entry) */
export async function updatePosConfig(config: Partial<PosConfig>): Promise<{ success: boolean }> {
    try {
        const current = await getPosConfig()
        const updated = { ...current, ...config }
        await prisma.auditLog.create({
            data: {
                action: CONFIG_KEY,
                tableName: "config",
                recordId: "pos-config",
                newData: JSON.parse(JSON.stringify(updated)),
            },
        })
        return { success: true }
    } catch (err) {
        console.error("[PosConfig] update failed:", err)
        return { success: false }
    }
}

/** Quick helper: is current mode PAY_FIRST? */
export async function isPayFirstMode(): Promise<boolean> {
    const config = await getPosConfig()
    return config.paymentMode === "PAY_FIRST"
}

/** Get effective payment mode for a given order type */
export async function getEffectivePaymentMode(orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "GRAB"): Promise<PaymentMode> {
    if (orderType !== "DINE_IN") return "PAY_FIRST" // takeaway always pay first
    const config = await getPosConfig()
    return config.paymentMode
}
