"use server"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"

export type InventoryItem = {
    id: string
    productId: string
    productName: string
    category: string
    sku: string
    currentStock: number
    minStock: number
    maxStock: number
    unit: string
    costPrice: number
    lastRestocked: string
    status: InventoryStatus
    expiryDate: string | null
}

export type StockMovement = {
    id: string
    itemId: string
    productName: string
    type: "IN" | "OUT" | "ADJUSTMENT" | "WASTE"
    quantity: number
    previousStock: number
    newStock: number
    reason: string
    staffName: string
    createdAt: string
}

const MOCK_INVENTORY: InventoryItem[] = [
    {
        id: "inv-1", productId: "p-1", productName: "Château Margaux 2018", category: "Wine by Bottle",
        sku: "WB-CM-2018", currentStock: 8, minStock: 3, maxStock: 24, unit: "chai",
        costPrice: 4_200_000, lastRestocked: "2026-03-08", status: "IN_STOCK", expiryDate: null,
    },
    {
        id: "inv-2", productId: "p-2", productName: "Opus One 2019", category: "Wine by Bottle",
        sku: "WB-OO-2019", currentStock: 4, minStock: 2, maxStock: 12, unit: "chai",
        costPrice: 7_800_000, lastRestocked: "2026-03-05", status: "IN_STOCK", expiryDate: null,
    },
    {
        id: "inv-3", productId: "p-3", productName: "Aperol", category: "Spirits",
        sku: "SP-APR-01", currentStock: 2, minStock: 3, maxStock: 12, unit: "chai",
        costPrice: 450_000, lastRestocked: "2026-03-01", status: "LOW_STOCK", expiryDate: null,
    },
    {
        id: "inv-4", productId: "p-4", productName: "Cheese Board Mix", category: "Food Ingredients",
        sku: "FD-CB-01", currentStock: 5, minStock: 2, maxStock: 15, unit: "kg",
        costPrice: 180_000, lastRestocked: "2026-03-09", status: "IN_STOCK", expiryDate: "2026-03-17",
    },
    {
        id: "inv-5", productId: "p-5", productName: "Truffle Oil", category: "Food Ingredients",
        sku: "FD-TO-01", currentStock: 1, minStock: 2, maxStock: 6, unit: "chai",
        costPrice: 320_000, lastRestocked: "2026-02-28", status: "LOW_STOCK", expiryDate: "2026-04-15",
    },
    {
        id: "inv-6", productId: "p-6", productName: "Pinot Noir (House)", category: "Wine by Glass",
        sku: "WG-PN-01", currentStock: 3, minStock: 2, maxStock: 10, unit: "chai",
        costPrice: 280_000, lastRestocked: "2026-03-07", status: "IN_STOCK", expiryDate: null,
    },
    {
        id: "inv-7", productId: "p-7", productName: "Tiramisu Mix", category: "Dessert Ingredients",
        sku: "DS-TM-01", currentStock: 0, minStock: 3, maxStock: 10, unit: "kg",
        costPrice: 150_000, lastRestocked: "2026-02-25", status: "OUT_OF_STOCK", expiryDate: "2026-03-25",
    },
    {
        id: "inv-8", productId: "p-8", productName: "Campari", category: "Spirits",
        sku: "SP-CMP-01", currentStock: 5, minStock: 2, maxStock: 8, unit: "chai",
        costPrice: 520_000, lastRestocked: "2026-03-06", status: "IN_STOCK", expiryDate: null,
    },
    {
        id: "inv-9", productId: "p-9", productName: "Fries (Frozen)", category: "Food Ingredients",
        sku: "FD-FR-01", currentStock: 8, minStock: 5, maxStock: 20, unit: "kg",
        costPrice: 45_000, lastRestocked: "2026-03-10", status: "IN_STOCK", expiryDate: "2026-06-10",
    },
    {
        id: "inv-10", productId: "p-10", productName: "Prosecco (Spritz)", category: "Sparkling",
        sku: "SK-PRO-01", currentStock: 6, minStock: 4, maxStock: 18, unit: "chai",
        costPrice: 350_000, lastRestocked: "2026-03-04", status: "IN_STOCK", expiryDate: null,
    },
]

const MOCK_MOVEMENTS: StockMovement[] = [
    { id: "mv-1", itemId: "inv-1", productName: "Château Margaux 2018", type: "OUT", quantity: 2, previousStock: 10, newStock: 8, reason: "Bán hàng", staffName: "Chien", createdAt: "2026-03-10T13:30:00" },
    { id: "mv-2", itemId: "inv-3", productName: "Aperol", type: "OUT", quantity: 1, previousStock: 3, newStock: 2, reason: "Bán hàng", staffName: "Linh", createdAt: "2026-03-10T12:15:00" },
    { id: "mv-3", itemId: "inv-9", productName: "Fries (Frozen)", type: "IN", quantity: 8, previousStock: 0, newStock: 8, reason: "Nhập kho", staffName: "Duc", createdAt: "2026-03-10T09:00:00" },
    { id: "mv-4", itemId: "inv-7", productName: "Tiramisu Mix", type: "WASTE", quantity: 2, previousStock: 2, newStock: 0, reason: "Hết hạn", staffName: "Duc", createdAt: "2026-03-09T17:00:00" },
    { id: "mv-5", itemId: "inv-4", productName: "Cheese Board Mix", type: "IN", quantity: 5, previousStock: 0, newStock: 5, reason: "Nhập kho", staffName: "Hoa", createdAt: "2026-03-09T08:30:00" },
]

export async function getInventory(): Promise<InventoryItem[]> {
    await delay(150)
    return [...MOCK_INVENTORY]
}

export async function getInventoryStats() {
    await delay(100)
    return {
        totalItems: MOCK_INVENTORY.length,
        inStock: MOCK_INVENTORY.filter((i) => i.status === "IN_STOCK").length,
        lowStock: MOCK_INVENTORY.filter((i) => i.status === "LOW_STOCK").length,
        outOfStock: MOCK_INVENTORY.filter((i) => i.status === "OUT_OF_STOCK").length,
        totalValue: MOCK_INVENTORY.reduce((s, i) => s + i.costPrice * i.currentStock, 0),
        expiringSoon: MOCK_INVENTORY.filter((i) => {
            if (!i.expiryDate) return false
            const days = (new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            return days > 0 && days <= 14
        }).length,
    }
}

export async function getStockMovements(): Promise<StockMovement[]> {
    await delay(100)
    return [...MOCK_MOVEMENTS]
}

export async function adjustStock(
    itemId: string,
    type: "IN" | "OUT" | "ADJUSTMENT" | "WASTE",
    quantity: number,
    reason: string,
    staffName: string
): Promise<{ success: boolean; error?: string }> {
    await delay(200)
    const item = MOCK_INVENTORY.find((i) => i.id === itemId)
    if (!item) return { success: false, error: "Không tìm thấy sản phẩm" }

    const previousStock = item.currentStock
    if (type === "IN") {
        item.currentStock += quantity
    } else {
        if (item.currentStock < quantity) {
            return { success: false, error: "Không đủ tồn kho" }
        }
        item.currentStock -= quantity
    }

    if (item.currentStock === 0) item.status = "OUT_OF_STOCK"
    else if (item.currentStock <= item.minStock) item.status = "LOW_STOCK"
    else item.status = "IN_STOCK"

    if (type === "IN") item.lastRestocked = new Date().toISOString().split("T")[0]

    MOCK_MOVEMENTS.unshift({
        id: `mv-${Date.now()}`,
        itemId,
        productName: item.productName,
        type,
        quantity,
        previousStock,
        newStock: item.currentStock,
        reason,
        staffName,
        createdAt: new Date().toISOString(),
    })

    return { success: true }
}
