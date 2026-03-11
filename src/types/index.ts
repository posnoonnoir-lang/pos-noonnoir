export type StaffRole = "OWNER" | "MANAGER" | "CASHIER" | "BARTENDER" | "KITCHEN" | "WAITER"

export type SessionStaff = {
    id: string
    fullName: string
    role: StaffRole
    avatarUrl?: string | null
}

export type NavItem = {
    label: string
    href: string
    icon: string
    roles?: StaffRole[]
}

// ============================================================
// TAX
// ============================================================

export type TaxRate = {
    id: string
    name: string
    code: string
    rate: number
    description: string | null
    isDefault: boolean
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export type TaxRateFormData = {
    name: string
    code: string
    rate: number
    description?: string
    isDefault?: boolean
    isActive?: boolean
}

// ============================================================
// PRODUCT & CATEGORY
// ============================================================

export type ProductType = "WINE_BOTTLE" | "WINE_GLASS" | "WINE_TASTING" | "FOOD" | "DRINK" | "OTHER"

export type Category = {
    id: string
    name: string
    nameVi: string | null
    icon: string | null
    sortOrder: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count?: { products: number }
}

export type Product = {
    id: string
    name: string
    nameVi: string | null
    sku: string | null
    categoryId: string
    type: ProductType
    taxRateId: string | null
    vintage: number | null
    appellation: string | null
    grapeVariety: string | null
    country: string | null
    region: string | null
    alcoholPct: number | null
    tastingNotes: string | null
    costPrice: number
    sellPrice: number
    glassPrice: number | null
    isByGlass: boolean
    glassesPerBottle: number
    tastingPortions: number
    servingTemp: string | null
    decantingTime: string | null
    glassType: string | null
    oxidationHours: number | null
    trackInventory: boolean
    lowStockAlert: number
    imageUrl: string | null
    description: string | null
    isActive: boolean
    sortOrder: number
    createdAt: Date
    updatedAt: Date
    category?: Category
    taxRate?: TaxRate | null
}

// Form input types
export type CategoryFormData = {
    name: string
    nameVi?: string
    icon?: string
    sortOrder?: number
    isActive?: boolean
}

export type ProductFormData = {
    name: string
    nameVi?: string
    sku?: string
    categoryId: string
    type: ProductType
    taxRateId?: string
    vintage?: number
    appellation?: string
    grapeVariety?: string
    country?: string
    region?: string
    alcoholPct?: number
    tastingNotes?: string
    costPrice: number
    sellPrice: number
    glassPrice?: number
    isByGlass?: boolean
    glassesPerBottle?: number
    tastingPortions?: number
    servingTemp?: string
    decantingTime?: string
    glassType?: string
    oxidationHours?: number
    trackInventory?: boolean
    lowStockAlert?: number
    imageUrl?: string
    description?: string
    isActive?: boolean
}

// ============================================================
// CUSTOMER
// ============================================================

export type Customer = {
    id: string
    fullName: string
    phone: string | null
    email: string | null
    tier: string
    totalSpent: number
    visitCount: number
    notes: string | null
    createdAt: Date
    updatedAt: Date
}

// ============================================================
// CUSTOMER TAB (Open Tab — uống trước trả sau)
// ============================================================

export type TabStatus = string

export type TabItem = {
    id: string
    tabId: string
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    subtotal: number
    tableId: string | null
    tableNumber: string | null
    addedBy: string
    addedByName: string
    addedAt: Date
}

export type CustomerTab = {
    id: string
    customerId: string
    customer: Customer
    openedBy: string
    openedByName: string
    tabLimit: number
    currentTotal: number
    status: TabStatus
    notes: string | null
    items: TabItem[]
    openedAt: Date
    closedAt: Date | null
}

// Server action response
export type ActionResult<T = unknown> = {
    success: boolean
    data?: T
    error?: { code: string; message: string }
}
