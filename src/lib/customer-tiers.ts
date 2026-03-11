// Customer tier calculation utility (non-server-action)

export type CustomerTier = "REGULAR" | "SILVER" | "GOLD" | "PLATINUM" | "VIP"

export const TIER_THRESHOLDS: Record<string, { min: number; label: string }> = {
    REGULAR: { min: 0, label: "Regular" },
    SILVER: { min: 10000000, label: "Silver" },
    GOLD: { min: 30000000, label: "Gold" },
    PLATINUM: { min: 80000000, label: "Platinum" },
    VIP: { min: 150000000, label: "VIP" },
}

export function calculateTier(totalSpent: number): CustomerTier {
    if (totalSpent >= 150000000) return "VIP"
    if (totalSpent >= 80000000) return "PLATINUM"
    if (totalSpent >= 30000000) return "GOLD"
    if (totalSpent >= 10000000) return "SILVER"
    return "REGULAR"
}
