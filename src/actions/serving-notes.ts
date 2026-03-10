"use server"

// ============================================================
// WINE SERVING NOTES (US-2.5)
// Tasting notes, serving temp, pairing, decanting recommendations
// ============================================================

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type WineServingNote = {
    id: string
    productId: string
    productName: string
    vintage: string | null
    region: string
    grape: string
    servingTemp: string
    decantTime: string | null
    glassType: string
    tastingNotes: {
        nose: string[]
        palate: string[]
        finish: string
    }
    pairings: string[]
    staffNotes: string | null
    addedBy: string
    updatedAt: Date
}

// ============================================================
// MOCK SERVING NOTES
// ============================================================

const SERVING_NOTES: WineServingNote[] = [
    {
        id: "sn-1",
        productId: "prod-1",
        productName: "Château Margaux 2018",
        vintage: "2018",
        region: "Bordeaux, France",
        grape: "Cabernet Sauvignon, Merlot, Petit Verdot",
        servingTemp: "16-18°C",
        decantTime: "2-3 giờ trước khi phục vụ",
        glassType: "Bordeaux Glass (ly lớn)",
        tastingNotes: {
            nose: ["Blackcurrant", "Violet", "Cedarwood", "Dark chocolate"],
            palate: ["Tannin mịn", "Full-body", "Blackberry", "Tobacco", "Vanilla"],
            finish: "Dài, thanh lịch, nhẹ hương gỗ sồi",
        },
        pairings: ["Bò Wagyu nướng", "Phô mai Comté", "Lamb rack", "Duck confit"],
        staffNotes: "💡 Luôn decant trước. Khách VIP thường gọi chai này — phục vụ cùng Cheese Board.",
        addedBy: "Chien",
        updatedAt: new Date("2026-03-10"),
    },
    {
        id: "sn-2",
        productId: "prod-2",
        productName: "Opus One 2019",
        vintage: "2019",
        region: "Napa Valley, USA",
        grape: "Cabernet Sauvignon, Merlot, Cabernet Franc",
        servingTemp: "17-19°C",
        decantTime: "1-2 giờ",
        glassType: "Bordeaux Glass",
        tastingNotes: {
            nose: ["Cassis", "Black cherry", "Dark plum", "Espresso", "Cedar"],
            palate: ["Velvety tannins", "Full-body", "Blackberry", "Mocha", "Graphite"],
            finish: "Rất dài, phức tạp, hương trái cây đen kéo dài",
        },
        pairings: ["Prime rib", "Bò bít tết", "Phô mai Gruyère", "Truffle dishes"],
        staffNotes: "🏆 Rượu flagship. High-margin. Đề xuất cho khách muốn trải nghiệm premium.",
        addedBy: "Chien",
        updatedAt: new Date("2026-03-08"),
    },
    {
        id: "sn-3",
        productId: "prod-3",
        productName: "Cloudy Bay Sauvignon Blanc 2022",
        vintage: "2022",
        region: "Marlborough, New Zealand",
        grape: "Sauvignon Blanc",
        servingTemp: "8-10°C",
        decantTime: null,
        glassType: "White Wine Glass (ly nhỏ)",
        tastingNotes: {
            nose: ["Chanh", "Bưởi", "Cỏ tươi", "Passion fruit"],
            palate: ["Crisp acidity", "Light-body", "Citrus", "Gooseberry", "Mineral"],
            finish: "Sạch sẽ, tươi mát, vị chanh kéo dài",
        },
        pairings: ["Hàu tươi", "Salad Caesar", "Sushi", "Cá hồi nướng", "Gỏi cuốn"],
        staffNotes: "🧊 Phục vụ lạnh! Rất dễ uống, phù hợp khách mới làm quen với rượu.",
        addedBy: "Linh",
        updatedAt: new Date("2026-03-09"),
    },
    {
        id: "sn-4",
        productId: "prod-cab-glass",
        productName: "Cabernet Sauvignon (by Glass)",
        vintage: null,
        region: "Multi-region blend",
        grape: "Cabernet Sauvignon",
        servingTemp: "16-18°C",
        decantTime: null,
        glassType: "Red Wine Glass",
        tastingNotes: {
            nose: ["Blackcurrant", "Bell pepper", "Plum"],
            palate: ["Medium-full body", "Cherry", "Tannin vừa", "Spice"],
            finish: "Trung bình, ấm, hương quả đen",
        },
        pairings: ["Bruschetta", "Cold Cut Board", "Pasta", "Burger"],
        staffNotes: "🍷 House pour. Giới thiệu cho khách chưa quen rượu đỏ. Happy Hour -15%!",
        addedBy: "Hao",
        updatedAt: new Date("2026-03-07"),
    },
    {
        id: "sn-5",
        productId: "prod-champagne",
        productName: "Champagne Dom Pérignon",
        vintage: "2012",
        region: "Champagne, France",
        grape: "Chardonnay, Pinot Noir",
        servingTemp: "8-10°C",
        decantTime: null,
        glassType: "Champagne Flute",
        tastingNotes: {
            nose: ["Toast", "White flowers", "Citrus", "Almond", "Brioche"],
            palate: ["Fine bubbles", "Creamy", "Apple", "Lemon zest", "Honey"],
            finish: "Thanh lịch, bọt nhẹ, vị khoáng kéo dài",
        },
        pairings: ["Caviar", "Hàu Pháp", "Lobster", "Foie gras"],
        staffNotes: "👑 Ultra-premium. Chỉ phục vụ trong ly sạch, lạnh trước. Khách Platinum thường order.",
        addedBy: "Chien",
        updatedAt: new Date("2026-03-10"),
    },
]

// ============================================================
// ACTIONS
// ============================================================

export async function getAllServingNotes(): Promise<WineServingNote[]> {
    await delay(80)
    return [...SERVING_NOTES].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export async function getServingNoteByProduct(productId: string): Promise<WineServingNote | null> {
    await delay(50)
    return SERVING_NOTES.find((n) => n.productId === productId) ?? null
}

export async function searchServingNotes(query: string): Promise<WineServingNote[]> {
    await delay(80)
    if (!query) return [...SERVING_NOTES]
    const q = query.toLowerCase()
    return SERVING_NOTES.filter((n) =>
        n.productName.toLowerCase().includes(q) ||
        n.grape.toLowerCase().includes(q) ||
        n.region.toLowerCase().includes(q) ||
        n.pairings.some((p) => p.toLowerCase().includes(q))
    )
}

export async function updateServingNote(id: string, updates: {
    staffNotes?: string
    pairings?: string[]
}): Promise<{ success: boolean }> {
    await delay(100)
    const note = SERVING_NOTES.find((n) => n.id === id)
    if (!note) return { success: false }
    if (updates.staffNotes !== undefined) note.staffNotes = updates.staffNotes
    if (updates.pairings) note.pairings = updates.pairings
    note.updatedAt = new Date()
    return { success: true }
}
