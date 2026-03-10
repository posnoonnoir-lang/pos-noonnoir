"use server"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type Supplier = {
    id: string
    name: string
    contactPerson: string
    phone: string
    email: string
    address: string
    taxCode: string
    category: "WINE" | "FOOD" | "SPIRITS" | "EQUIPMENT" | "OTHER"
    totalOrders: number
    totalSpent: number
    status: "ACTIVE" | "INACTIVE"
}

export type POStatus = "DRAFT" | "SENT" | "PARTIAL" | "RECEIVED" | "CANCELLED"

export type PurchaseOrderItem = {
    id: string
    productName: string
    sku: string
    quantity: number
    receivedQty: number
    unitPrice: number
    totalPrice: number
    unit: string
    category: "GOODS" | "NPL" | "CCDC"
}

export type PurchaseOrder = {
    id: string
    poNumber: string
    supplierId: string
    supplierName: string
    status: POStatus
    items: PurchaseOrderItem[]
    subtotal: number
    tax: number
    totalAmount: number
    notes: string
    createdBy: string
    createdAt: string
    expectedDate: string
    receivedDate: string | null
}

export type GoodsReceipt = {
    id: string
    poId: string
    poNumber: string
    supplierName: string
    receivedItems: { itemId: string; productName: string; receivedQty: number; unitPrice: number }[]
    totalAmount: number
    receivedBy: string
    receivedAt: string
    notes: string
}

export type FIFOBatch = {
    id: string
    productName: string
    sku: string
    poNumber: string
    batchDate: string
    initialQty: number
    remainingQty: number
    unitCost: number
    supplierName: string
}

const MOCK_SUPPLIERS: Supplier[] = [
    { id: "sup-1", name: "Vang Đại Việt", contactPerson: "Nguyễn Minh", phone: "0901234567", email: "minh@vangdaiviet.vn", address: "15 Nguyễn Huệ, Q.1, TP.HCM", taxCode: "0312345678", category: "WINE", totalOrders: 24, totalSpent: 485_000_000, status: "ACTIVE" },
    { id: "sup-2", name: "Phú Hưng Foods", contactPerson: "Trần Hoa", phone: "0987654321", email: "hoa@phuhung.vn", address: "88 Lê Lợi, Q.3, TP.HCM", taxCode: "0398765432", category: "FOOD", totalOrders: 18, totalSpent: 42_000_000, status: "ACTIVE" },
    { id: "sup-3", name: "Euro Spirits VN", contactPerson: "Lê Đức", phone: "0912345678", email: "duc@eurospirits.vn", address: "45 Trần Hưng Đạo, Q.5, TP.HCM", taxCode: "0345678901", category: "SPIRITS", totalOrders: 12, totalSpent: 128_000_000, status: "ACTIVE" },
    { id: "sup-4", name: "Thiết Bị Nhà Hàng SG", contactPerson: "Phạm An", phone: "0933456789", email: "an@tbnh.vn", address: "12 Cách Mạng T8, Q.10, TP.HCM", taxCode: "0356789012", category: "EQUIPMENT", totalOrders: 5, totalSpent: 67_500_000, status: "ACTIVE" },
]

const MOCK_POS: PurchaseOrder[] = [
    {
        id: "po-1", poNumber: "PO-2026-001", supplierId: "sup-1", supplierName: "Vang Đại Việt", status: "RECEIVED",
        items: [
            { id: "poi-1", productName: "Château Margaux 2018", sku: "WB-CM-2018", quantity: 12, receivedQty: 12, unitPrice: 4_200_000, totalPrice: 50_400_000, unit: "chai", category: "GOODS" },
            { id: "poi-2", productName: "Opus One 2019", sku: "WB-OO-2019", quantity: 6, receivedQty: 6, unitPrice: 7_800_000, totalPrice: 46_800_000, unit: "chai", category: "GOODS" },
        ],
        subtotal: 97_200_000, tax: 9_720_000, totalAmount: 106_920_000, notes: "Lô hàng tháng 3",
        createdBy: "Nhien", createdAt: "2026-03-01T09:00:00", expectedDate: "2026-03-05", receivedDate: "2026-03-05",
    },
    {
        id: "po-2", poNumber: "PO-2026-002", supplierId: "sup-2", supplierName: "Phú Hưng Foods", status: "RECEIVED",
        items: [
            { id: "poi-3", productName: "Cheese Board Mix", sku: "FD-CB-01", quantity: 10, receivedQty: 10, unitPrice: 180_000, totalPrice: 1_800_000, unit: "kg", category: "NPL" },
            { id: "poi-4", productName: "Truffle Oil", sku: "FD-TO-01", quantity: 6, receivedQty: 6, unitPrice: 320_000, totalPrice: 1_920_000, unit: "chai", category: "NPL" },
            { id: "poi-5", productName: "Fries (Frozen)", sku: "FD-FR-01", quantity: 20, receivedQty: 20, unitPrice: 45_000, totalPrice: 900_000, unit: "kg", category: "NPL" },
        ],
        subtotal: 4_620_000, tax: 462_000, totalAmount: 5_082_000, notes: "Nguyên liệu F&B tuần 2",
        createdBy: "Nhien", createdAt: "2026-03-07T10:00:00", expectedDate: "2026-03-09", receivedDate: "2026-03-09",
    },
    {
        id: "po-3", poNumber: "PO-2026-003", supplierId: "sup-3", supplierName: "Euro Spirits VN", status: "SENT",
        items: [
            { id: "poi-6", productName: "Aperol", sku: "SP-APR-01", quantity: 12, receivedQty: 0, unitPrice: 450_000, totalPrice: 5_400_000, unit: "chai", category: "GOODS" },
            { id: "poi-7", productName: "Campari", sku: "SP-CMP-01", quantity: 8, receivedQty: 0, unitPrice: 520_000, totalPrice: 4_160_000, unit: "chai", category: "GOODS" },
        ],
        subtotal: 9_560_000, tax: 956_000, totalAmount: 10_516_000, notes: "Bổ sung spirits",
        createdBy: "Nhien", createdAt: "2026-03-10T08:00:00", expectedDate: "2026-03-14", receivedDate: null,
    },
    {
        id: "po-4", poNumber: "PO-2026-004", supplierId: "sup-4", supplierName: "Thiết Bị Nhà Hàng SG", status: "DRAFT",
        items: [
            { id: "poi-8", productName: "Ly Bordeaux Riedel", sku: "EQ-LY-BD", quantity: 24, receivedQty: 0, unitPrice: 350_000, totalPrice: 8_400_000, unit: "cái", category: "CCDC" },
            { id: "poi-9", productName: "Decanter Crystal 1.5L", sku: "EQ-DC-15", quantity: 4, receivedQty: 0, unitPrice: 1_200_000, totalPrice: 4_800_000, unit: "cái", category: "CCDC" },
        ],
        subtotal: 13_200_000, tax: 1_320_000, totalAmount: 14_520_000, notes: "Bổ sung dụng cụ bar",
        createdBy: "Nhien", createdAt: "2026-03-10T11:00:00", expectedDate: "2026-03-18", receivedDate: null,
    },
]

const MOCK_RECEIPTS: GoodsReceipt[] = [
    {
        id: "gr-1", poId: "po-1", poNumber: "PO-2026-001", supplierName: "Vang Đại Việt",
        receivedItems: [
            { itemId: "poi-1", productName: "Château Margaux 2018", receivedQty: 12, unitPrice: 4_200_000 },
            { itemId: "poi-2", productName: "Opus One 2019", receivedQty: 6, unitPrice: 7_800_000 },
        ],
        totalAmount: 97_200_000, receivedBy: "Duc", receivedAt: "2026-03-05T14:00:00", notes: "Đủ hàng, kiểm tra OK",
    },
    {
        id: "gr-2", poId: "po-2", poNumber: "PO-2026-002", supplierName: "Phú Hưng Foods",
        receivedItems: [
            { itemId: "poi-3", productName: "Cheese Board Mix", receivedQty: 10, unitPrice: 180_000 },
            { itemId: "poi-4", productName: "Truffle Oil", receivedQty: 6, unitPrice: 320_000 },
            { itemId: "poi-5", productName: "Fries (Frozen)", receivedQty: 20, unitPrice: 45_000 },
        ],
        totalAmount: 4_620_000, receivedBy: "Hoa", receivedAt: "2026-03-09T09:30:00", notes: "Đủ hàng, HSD đúng",
    },
]

const MOCK_FIFO: FIFOBatch[] = [
    { id: "fb-1", productName: "Château Margaux 2018", sku: "WB-CM-2018", poNumber: "PO-2026-001", batchDate: "2026-03-05", initialQty: 12, remainingQty: 8, unitCost: 4_200_000, supplierName: "Vang Đại Việt" },
    { id: "fb-2", productName: "Opus One 2019", sku: "WB-OO-2019", poNumber: "PO-2026-001", batchDate: "2026-03-05", initialQty: 6, remainingQty: 4, unitCost: 7_800_000, supplierName: "Vang Đại Việt" },
    { id: "fb-3", productName: "Cheese Board Mix", sku: "FD-CB-01", poNumber: "PO-2026-002", batchDate: "2026-03-09", initialQty: 10, remainingQty: 5, unitCost: 180_000, supplierName: "Phú Hưng Foods" },
    { id: "fb-4", productName: "Aperol", sku: "SP-APR-01", poNumber: "PO-2025-018", batchDate: "2026-02-01", initialQty: 6, remainingQty: 2, unitCost: 420_000, supplierName: "Euro Spirits VN" },
    { id: "fb-5", productName: "Campari", sku: "SP-CMP-01", poNumber: "PO-2025-019", batchDate: "2026-02-10", initialQty: 8, remainingQty: 5, unitCost: 500_000, supplierName: "Euro Spirits VN" },
    { id: "fb-6", productName: "Pinot Noir (House)", sku: "WG-PN-01", poNumber: "PO-2025-020", batchDate: "2026-02-15", initialQty: 6, remainingQty: 3, unitCost: 280_000, supplierName: "Vang Đại Việt" },
    { id: "fb-7", productName: "Prosecco (Spritz)", sku: "SK-PRO-01", poNumber: "PO-2025-021", batchDate: "2026-02-20", initialQty: 12, remainingQty: 6, unitCost: 350_000, supplierName: "Vang Đại Việt" },
    { id: "fb-8", productName: "Truffle Oil", sku: "FD-TO-01", poNumber: "PO-2026-002", batchDate: "2026-03-09", initialQty: 6, remainingQty: 1, unitCost: 320_000, supplierName: "Phú Hưng Foods" },
    { id: "fb-9", productName: "Fries (Frozen)", sku: "FD-FR-01", poNumber: "PO-2026-002", batchDate: "2026-03-09", initialQty: 20, remainingQty: 8, unitCost: 45_000, supplierName: "Phú Hưng Foods" },
]

// --- Suppliers ---
export async function getSuppliers(): Promise<Supplier[]> {
    await delay(100)
    return [...MOCK_SUPPLIERS]
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
    await delay(80)
    return MOCK_SUPPLIERS.find((s) => s.id === id) ?? null
}

export async function createSupplier(data: Omit<Supplier, "id" | "totalOrders" | "totalSpent" | "status">): Promise<Supplier> {
    await delay(150)
    const supplier: Supplier = { ...data, id: `sup-${Date.now()}`, totalOrders: 0, totalSpent: 0, status: "ACTIVE" }
    MOCK_SUPPLIERS.push(supplier)
    return supplier
}

// --- Purchase Orders ---
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
    await delay(120)
    return [...MOCK_POS].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
    await delay(80)
    return MOCK_POS.find((po) => po.id === id) ?? null
}

export async function createPurchaseOrder(
    data: {
        supplierId: string
        supplierName: string
        items: Omit<PurchaseOrderItem, "id" | "receivedQty">[]
        notes: string
        expectedDate: string
        createdBy: string
    }
): Promise<PurchaseOrder> {
    await delay(200)
    const poNum = `PO-2026-${String(MOCK_POS.length + 1).padStart(3, "0")}`
    const items: PurchaseOrderItem[] = data.items.map((item, i) => ({
        ...item, id: `poi-${Date.now()}-${i}`, receivedQty: 0,
    }))
    const subtotal = items.reduce((s, i) => s + i.totalPrice, 0)
    const po: PurchaseOrder = {
        id: `po-${Date.now()}`, poNumber: poNum, supplierId: data.supplierId, supplierName: data.supplierName,
        status: "DRAFT", items, subtotal, tax: Math.round(subtotal * 0.1), totalAmount: Math.round(subtotal * 1.1),
        notes: data.notes, createdBy: data.createdBy, createdAt: new Date().toISOString(),
        expectedDate: data.expectedDate, receivedDate: null,
    }
    MOCK_POS.push(po)
    return po
}

export async function updatePOStatus(poId: string, status: POStatus): Promise<{ success: boolean }> {
    await delay(100)
    const po = MOCK_POS.find((p) => p.id === poId)
    if (!po) return { success: false }
    po.status = status
    return { success: true }
}

export async function receivePurchaseOrder(
    poId: string,
    receivedItems: { itemId: string; receivedQty: number }[],
    receivedBy: string,
    notes: string
): Promise<{ success: boolean }> {
    await delay(200)
    const po = MOCK_POS.find((p) => p.id === poId)
    if (!po) return { success: false }

    let allReceived = true
    for (const ri of receivedItems) {
        const item = po.items.find((i) => i.id === ri.itemId)
        if (item) {
            item.receivedQty += ri.receivedQty
            if (item.receivedQty < item.quantity) allReceived = false

            // Create FIFO batch
            MOCK_FIFO.push({
                id: `fb-${Date.now()}-${ri.itemId}`,
                productName: item.productName, sku: item.sku,
                poNumber: po.poNumber, batchDate: new Date().toISOString().split("T")[0],
                initialQty: ri.receivedQty, remainingQty: ri.receivedQty,
                unitCost: item.unitPrice, supplierName: po.supplierName,
            })
        }
    }

    po.status = allReceived ? "RECEIVED" : "PARTIAL"
    po.receivedDate = allReceived ? new Date().toISOString() : null

    const receipt: GoodsReceipt = {
        id: `gr-${Date.now()}`, poId, poNumber: po.poNumber, supplierName: po.supplierName,
        receivedItems: receivedItems.map((ri) => {
            const item = po.items.find((i) => i.id === ri.itemId)!
            return { itemId: ri.itemId, productName: item.productName, receivedQty: ri.receivedQty, unitPrice: item.unitPrice }
        }),
        totalAmount: receivedItems.reduce((s, ri) => {
            const item = po.items.find((i) => i.id === ri.itemId)!
            return s + ri.receivedQty * item.unitPrice
        }, 0),
        receivedBy, receivedAt: new Date().toISOString(), notes,
    }
    MOCK_RECEIPTS.push(receipt)

    return { success: true }
}

// --- Goods Receipts ---
export async function getGoodsReceipts(): Promise<GoodsReceipt[]> {
    await delay(100)
    return [...MOCK_RECEIPTS].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
}

// --- FIFO Batches (for COGS) ---
export async function getFIFOBatches(): Promise<FIFOBatch[]> {
    await delay(100)
    return [...MOCK_FIFO].filter((b) => b.remainingQty > 0).sort((a, b) => new Date(a.batchDate).getTime() - new Date(b.batchDate).getTime())
}

export async function getAllFIFOBatches(): Promise<FIFOBatch[]> {
    await delay(100)
    return [...MOCK_FIFO].sort((a, b) => new Date(a.batchDate).getTime() - new Date(b.batchDate).getTime())
}

// --- Procurement Stats ---
export async function getProcurementStats() {
    await delay(100)
    const totalPOs = MOCK_POS.length
    const pendingPOs = MOCK_POS.filter((p) => p.status === "SENT" || p.status === "PARTIAL").length
    const draftPOs = MOCK_POS.filter((p) => p.status === "DRAFT").length
    const totalSpent = MOCK_POS.filter((p) => p.status === "RECEIVED").reduce((s, p) => s + p.totalAmount, 0)
    const totalSuppliers = MOCK_SUPPLIERS.filter((s) => s.status === "ACTIVE").length

    return { totalPOs, pendingPOs, draftPOs, totalSpent, totalSuppliers }
}
