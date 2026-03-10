"use server"

// ============================================================
// WINE BOTTLE & GLASS TRACKING
// US-1.1: Bán ly rượu vang — auto bottle deduction, FIFO
// US-2.1: Quản lý kho rượu — individual bottle status
// ============================================================

type BottleStatus = "IN_STOCK" | "OPENED" | "SOLD" | "RETURNED" | "DAMAGED"
type BottleSource = "PURCHASED" | "CONSIGNED"

export type WineBottle = {
    id: string
    productId: string
    productName: string
    batchCode: string
    status: BottleStatus
    source: BottleSource
    supplierId: string | null
    supplierName: string | null
    costPrice: number
    glassesPoured: number
    glassesTotal: number
    openedAt: Date | null
    openedBy: string | null
    soldAt: Date | null
    notes: string | null
    receivedAt: Date
    expiresAt: Date | null
}

export type GlassStatus = {
    productId: string
    productName: string
    currentBottle: WineBottle | null
    glassesPoured: number
    glassesTotal: number
    glassesRemaining: number
    bottlesInStock: number
    bottlesOpened: number
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ============================================================
// MOCK WINE BOTTLES (in-memory state)
// ============================================================

const WINE_BOTTLES: WineBottle[] = [
    // Cabernet Sauvignon bottles (for glass selling — prod-4)
    {
        id: "bottle-1",
        productId: "prod-4",
        productName: "Cabernet Sauvignon Glass",
        batchCode: "CS-2024-001",
        status: "OPENED",
        source: "PURCHASED",
        supplierId: null,
        supplierName: null,
        costPrice: 400000,
        glassesPoured: 3,
        glassesTotal: 8,
        openedAt: new Date("2026-03-10T14:00:00"),
        openedBy: "Chien (Owner)",
        soldAt: null,
        notes: "Chai đầu tiên — đã mở lúc 14:00",
        receivedAt: new Date("2026-03-08"),
        expiresAt: null,
    },
    {
        id: "bottle-2",
        productId: "prod-4",
        productName: "Cabernet Sauvignon Glass",
        batchCode: "CS-2024-002",
        status: "IN_STOCK",
        source: "PURCHASED",
        supplierId: null,
        supplierName: null,
        costPrice: 400000,
        glassesPoured: 0,
        glassesTotal: 8,
        openedAt: null,
        openedBy: null,
        soldAt: null,
        notes: null,
        receivedAt: new Date("2026-03-08"),
        expiresAt: null,
    },
    {
        id: "bottle-3",
        productId: "prod-4",
        productName: "Cabernet Sauvignon Glass",
        batchCode: "CS-2024-003",
        status: "IN_STOCK",
        source: "CONSIGNED",
        supplierId: "sup-1",
        supplierName: "Wine Importers Co.",
        costPrice: 380000,
        glassesPoured: 0,
        glassesTotal: 8,
        openedAt: null,
        openedBy: null,
        soldAt: null,
        notes: "Ký gửi — NCC Wine Importers",
        receivedAt: new Date("2026-03-09"),
        expiresAt: null,
    },

    // Pinot Noir bottles (for glass selling — prod-5)
    {
        id: "bottle-4",
        productId: "prod-5",
        productName: "Pinot Noir Glass",
        batchCode: "PN-2024-001",
        status: "OPENED",
        source: "PURCHASED",
        supplierId: null,
        supplierName: null,
        costPrice: 480000,
        glassesPoured: 6,
        glassesTotal: 8,
        openedAt: new Date("2026-03-10T12:30:00"),
        openedBy: "Chien (Owner)",
        soldAt: null,
        notes: "Gần hết — chỉ còn 2 ly",
        receivedAt: new Date("2026-03-07"),
        expiresAt: null,
    },
    {
        id: "bottle-5",
        productId: "prod-5",
        productName: "Pinot Noir Glass",
        batchCode: "PN-2024-002",
        status: "IN_STOCK",
        source: "PURCHASED",
        supplierId: null,
        supplierName: null,
        costPrice: 480000,
        glassesPoured: 0,
        glassesTotal: 8,
        openedAt: null,
        openedBy: null,
        soldAt: null,
        notes: null,
        receivedAt: new Date("2026-03-09"),
        expiresAt: null,
    },

    // Chardonnay Glass (prod-6)
    {
        id: "bottle-6",
        productId: "prod-6",
        productName: "Chardonnay Glass",
        batchCode: "CH-2024-001",
        status: "OPENED",
        source: "PURCHASED",
        supplierId: null,
        supplierName: null,
        costPrice: 350000,
        glassesPoured: 1,
        glassesTotal: 8,
        openedAt: new Date("2026-03-10T15:00:00"),
        openedBy: "Chien (Owner)",
        soldAt: null,
        notes: null,
        receivedAt: new Date("2026-03-07"),
        expiresAt: null,
    },
    {
        id: "bottle-7",
        productId: "prod-6",
        productName: "Chardonnay Glass",
        batchCode: "CH-2024-002",
        status: "IN_STOCK",
        source: "CONSIGNED",
        supplierId: "sup-2",
        supplierName: "Vino Distribution",
        costPrice: 320000,
        glassesPoured: 0,
        glassesTotal: 8,
        openedAt: null,
        openedBy: null,
        soldAt: null,
        notes: "Ký gửi — Vino Distribution",
        receivedAt: new Date("2026-03-10"),
        expiresAt: null,
    },

    // Château Margaux bottles (sell by bottle — prod-1)
    {
        id: "bottle-8",
        productId: "prod-1",
        productName: "Château Margaux 2018",
        batchCode: "CM-2018-001",
        status: "IN_STOCK",
        source: "PURCHASED",
        supplierId: null,
        supplierName: null,
        costPrice: 3500000,
        glassesPoured: 0,
        glassesTotal: 0,
        openedAt: null,
        openedBy: null,
        soldAt: null,
        notes: null,
        receivedAt: new Date("2026-03-05"),
        expiresAt: null,
    },
    {
        id: "bottle-9",
        productId: "prod-1",
        productName: "Château Margaux 2018",
        batchCode: "CM-2018-002",
        status: "IN_STOCK",
        source: "PURCHASED",
        supplierId: null,
        supplierName: null,
        costPrice: 3500000,
        glassesPoured: 0,
        glassesTotal: 0,
        openedAt: null,
        openedBy: null,
        soldAt: null,
        notes: null,
        receivedAt: new Date("2026-03-06"),
        expiresAt: null,
    },

    // Opus One
    {
        id: "bottle-10",
        productId: "prod-2",
        productName: "Opus One 2019",
        batchCode: "OO-2019-001",
        status: "IN_STOCK",
        source: "PURCHASED",
        supplierId: null,
        supplierName: null,
        costPrice: 6000000,
        glassesPoured: 0,
        glassesTotal: 0,
        openedAt: null,
        openedBy: null,
        soldAt: null,
        notes: null,
        receivedAt: new Date("2026-03-04"),
        expiresAt: null,
    },
]

// ============================================================
// GLASS STATUS — Get current glass info for POS display
// ============================================================

export async function getGlassStatus(productId: string): Promise<GlassStatus | null> {
    await delay(50)

    const bottles = WINE_BOTTLES.filter((b) => b.productId === productId)
    if (bottles.length === 0) return null

    const currentBottle = bottles.find((b) => b.status === "OPENED") ?? null
    const inStock = bottles.filter((b) => b.status === "IN_STOCK").length
    const opened = bottles.filter((b) => b.status === "OPENED").length

    return {
        productId,
        productName: currentBottle?.productName ?? bottles[0].productName,
        currentBottle,
        glassesPoured: currentBottle?.glassesPoured ?? 0,
        glassesTotal: currentBottle?.glassesTotal ?? 0,
        glassesRemaining: currentBottle
            ? currentBottle.glassesTotal - currentBottle.glassesPoured
            : 0,
        bottlesInStock: inStock,
        bottlesOpened: opened,
    }
}

export async function getAllGlassStatuses(): Promise<Record<string, GlassStatus>> {
    await delay(100)

    const productIds = [...new Set(WINE_BOTTLES.map((b) => b.productId))]
    const statuses: Record<string, GlassStatus> = {}

    for (const pid of productIds) {
        const status = await getGlassStatus(pid)
        if (status) statuses[pid] = status
    }

    return statuses
}

// ============================================================
// SELL WINE GLASS — Core logic (US-1.1)
// ============================================================

export async function sellWineGlass(params: {
    productId: string
    quantity: number
    staffName: string
}): Promise<{
    success: boolean
    glassesSold: number
    bottlesConsumed: string[]
    newBottleOpened: WineBottle | null
    currentStatus: GlassStatus | null
    error?: string
}> {
    await delay(150)

    let remaining = params.quantity
    const bottlesConsumed: string[] = []
    let newBottleOpened: WineBottle | null = null

    while (remaining > 0) {
        // Find current opened bottle (FIFO by openedAt)
        let currentBottle = WINE_BOTTLES
            .filter((b) => b.productId === params.productId && b.status === "OPENED")
            .sort((a, b) => (a.openedAt?.getTime() ?? 0) - (b.openedAt?.getTime() ?? 0))[0]

        // No opened bottle → open next IN_STOCK (FIFO by receivedAt)
        if (!currentBottle) {
            const nextBottle = WINE_BOTTLES
                .filter((b) => b.productId === params.productId && b.status === "IN_STOCK")
                .sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime())[0]

            if (!nextBottle) {
                return {
                    success: false,
                    glassesSold: params.quantity - remaining,
                    bottlesConsumed,
                    newBottleOpened: null,
                    currentStatus: await getGlassStatus(params.productId),
                    error: `Hết chai! Đã bán ${params.quantity - remaining}/${params.quantity} ly`,
                }
            }

            // Open the bottle
            nextBottle.status = "OPENED"
            nextBottle.openedAt = new Date()
            nextBottle.openedBy = params.staffName
            currentBottle = nextBottle
            newBottleOpened = nextBottle
        }

        // Pour glasses from current bottle
        const canPour = currentBottle.glassesTotal - currentBottle.glassesPoured
        const toPour = Math.min(remaining, canPour)

        currentBottle.glassesPoured += toPour
        remaining -= toPour

        // If bottle is finished → mark as SOLD
        if (currentBottle.glassesPoured >= currentBottle.glassesTotal) {
            currentBottle.status = "SOLD"
            currentBottle.soldAt = new Date()
            bottlesConsumed.push(currentBottle.batchCode)
        }
    }

    return {
        success: true,
        glassesSold: params.quantity,
        bottlesConsumed,
        newBottleOpened,
        currentStatus: await getGlassStatus(params.productId),
    }
}

// ============================================================
// SELL WINE BOTTLE — Mark as SOLD when selling whole bottle
// ============================================================

export async function sellWineBottle(params: {
    productId: string
    quantity: number
}): Promise<{
    success: boolean
    bottlesSold: string[]
    error?: string
}> {
    await delay(100)

    const available = WINE_BOTTLES
        .filter((b) => b.productId === params.productId && b.status === "IN_STOCK")
        .sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime())

    if (available.length < params.quantity) {
        return {
            success: false,
            bottlesSold: [],
            error: `Chỉ còn ${available.length} chai (cần ${params.quantity})`,
        }
    }

    const sold: string[] = []
    for (let i = 0; i < params.quantity; i++) {
        available[i].status = "SOLD"
        available[i].soldAt = new Date()
        sold.push(available[i].batchCode)
    }

    return { success: true, bottlesSold: sold }
}

// ============================================================
// BOTTLE MANAGEMENT
// ============================================================

export async function getBottlesByProduct(productId: string): Promise<WineBottle[]> {
    await delay(80)
    return WINE_BOTTLES
        .filter((b) => b.productId === productId)
        .sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime())
}

export async function getAllBottles(): Promise<WineBottle[]> {
    await delay(100)
    return [...WINE_BOTTLES].sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime())
}

export async function getBottleStats(): Promise<{
    total: number
    inStock: number
    opened: number
    sold: number
    damaged: number
    consigned: number
    purchased: number
}> {
    await delay(50)
    return {
        total: WINE_BOTTLES.length,
        inStock: WINE_BOTTLES.filter((b) => b.status === "IN_STOCK").length,
        opened: WINE_BOTTLES.filter((b) => b.status === "OPENED").length,
        sold: WINE_BOTTLES.filter((b) => b.status === "SOLD").length,
        damaged: WINE_BOTTLES.filter((b) => b.status === "DAMAGED").length,
        consigned: WINE_BOTTLES.filter((b) => b.source === "CONSIGNED").length,
        purchased: WINE_BOTTLES.filter((b) => b.source === "PURCHASED").length,
    }
}

export async function markBottleDamaged(bottleId: string, reason: string): Promise<{ success: boolean }> {
    await delay(100)
    const bottle = WINE_BOTTLES.find((b) => b.id === bottleId)
    if (!bottle) return { success: false }
    bottle.status = "DAMAGED"
    bottle.notes = reason
    return { success: true }
}
