// Tab serialization helper (non-server-action)

export function serializeTab(tab: Record<string, unknown>) {
    const t = tab as {
        id: string; customerId: string; customer: { name: string; phone: string | null; email: string | null; tier: string; totalSpent: { toString: () => string }; loyaltyPts: number; notes: string | null; createdAt: Date; updatedAt: Date; id: string }
        openedBy: string; openedByStaff?: { fullName: string }; tabLimit: { toString: () => string }; currentTotal: { toString: () => string }
        status: string; notes: string | null; openedAt: Date; closedAt: Date | null
        items: Array<{ id: string; tabId: string; productId: string; product: { name: string }; quantity: number; unitPrice: { toString: () => string }; subtotal: { toString: () => string }; tableId: string | null; table: { tableNumber: string } | null; addedBy: string; staff: { fullName: string }; addedAt: Date }>
    }

    return {
        id: t.id,
        customerId: t.customerId,
        customer: {
            id: t.customer.id,
            fullName: t.customer.name,
            phone: t.customer.phone,
            email: t.customer.email,
            tier: t.customer.tier,
            totalSpent: Number(t.customer.totalSpent),
            visitCount: t.customer.loyaltyPts,
            notes: t.customer.notes,
            createdAt: t.customer.createdAt,
            updatedAt: t.customer.updatedAt,
        },
        openedBy: t.openedBy,
        openedByName: t.openedByStaff?.fullName ?? "",
        tabLimit: Number(t.tabLimit),
        currentTotal: Number(t.currentTotal),
        status: t.status,
        notes: t.notes,
        items: t.items.map((item) => ({
            id: item.id,
            tabId: item.tabId,
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
            tableId: item.tableId,
            tableNumber: item.table?.tableNumber ?? null,
            addedBy: item.addedBy,
            addedByName: item.staff.fullName,
            addedAt: item.addedAt,
        })),
        openedAt: t.openedAt,
        closedAt: t.closedAt,
    }
}
