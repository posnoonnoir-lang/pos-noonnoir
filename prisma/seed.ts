import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("🌱 Seeding POS Noonnoir database...")

    // ============================================================
    // 1. STORE SETTINGS
    // ============================================================
    await prisma.storeSettings.upsert({
        where: { id: "00000000-0000-0000-0000-000000000001" },
        update: {},
        create: {
            id: "00000000-0000-0000-0000-000000000001",
            storeName: "Noon & Noir Wine Alley",
            tagline: "drink slowly · laugh quietly · stay longer",
            address: "123 Nguyễn Huệ, Q.1, TP.HCM",
            phone: "028-1234-5678",
            email: "hello@noonnoir.vn",
            taxId: "0123456789",
            taxEnabled: true,
            taxInclusive: true,
            currency: "VND",
            defaultTabLimit: 2000000,
        },
    })
    console.log("  ✅ Store settings")

    // ============================================================
    // 2. TAX RATES
    // ============================================================
    const taxRates = await Promise.all([
        prisma.taxRate.upsert({ where: { code: "VAT10" }, update: {}, create: { name: "VAT 10%", code: "VAT10", rate: 10, description: "Thuế suất tiêu chuẩn", isDefault: true } }),
        prisma.taxRate.upsert({ where: { code: "VAT8" }, update: {}, create: { name: "VAT 8%", code: "VAT8", rate: 8, description: "Thuế suất ưu đãi" } }),
        prisma.taxRate.upsert({ where: { code: "VAT5" }, update: {}, create: { name: "VAT 5%", code: "VAT5", rate: 5, description: "Thuế suất thấp" } }),
        prisma.taxRate.upsert({ where: { code: "VAT0" }, update: {}, create: { name: "VAT 0%", code: "VAT0", rate: 0, description: "Không chịu thuế" } }),
        prisma.taxRate.upsert({ where: { code: "EXEMPT" }, update: {}, create: { name: "Miễn thuế", code: "EXEMPT", rate: 0, description: "Miễn thuế" } }),
    ])
    console.log("  ✅ Tax rates (5)")

    // ============================================================
    // 3. STAFF (upsert by phone to be idempotent)
    // ============================================================
    const staffData = [
        { fullName: "Chiến (Owner)", phone: "0901234567", email: "chien@noonnoir.vn", role: "OWNER" as const, baseSalary: 0, pinCode: "0000" },
        { fullName: "Minh (Manager)", phone: "0901234568", email: "minh@noonnoir.vn", role: "MANAGER" as const, baseSalary: 15000000, pinCode: "1234" },
        { fullName: "Lan (Cashier)", phone: "0901234569", role: "CASHIER" as const, baseSalary: 8000000, pinCode: "5678" },
        { fullName: "Hùng (Bartender)", phone: "0901234570", role: "BARTENDER" as const, baseSalary: 10000000, pinCode: "9012" },
        { fullName: "Tú (Kitchen)", phone: "0901234571", role: "KITCHEN" as const, baseSalary: 8000000, pinCode: "3456" },
        { fullName: "Vy (Waiter)", phone: "0901234572", role: "WAITER" as const, baseSalary: 7000000, pinCode: "7890" },
    ]
    const staff = []
    for (const s of staffData) {
        const existing = await prisma.staff.findFirst({ where: { phone: s.phone } })
        staff.push(existing ?? await prisma.staff.create({ data: s }))
    }
    console.log("  ✅ Staff (6)")

    // ============================================================
    // 4. CATEGORIES
    // ============================================================
    const catNames = ["Red Wine", "White Wine", "Rosé", "Sparkling", "Cocktails", "Beer", "Food", "Dessert", "Charcuterie"]
    const catVi = ["Rượu vang đỏ", "Rượu vang trắng", "Rượu vang hồng", "Rượu sủi tăm", "Cocktails", "Bia", "Đồ ăn", "Tráng miệng", "Thịt nguội & phô mai"]
    const catIcons = ["🍷", "🥂", "🌸", "🍾", "🍸", "🍺", "🍽️", "🍰", "🧀"]

    const categories = []
    for (let i = 0; i < catNames.length; i++) {
        const existing = await prisma.category.findFirst({ where: { name: catNames[i] } })
        if (existing) {
            categories.push(existing)
        } else {
            categories.push(await prisma.category.create({ data: { name: catNames[i], nameVi: catVi[i], icon: catIcons[i], sortOrder: i + 1 } }))
        }
    }
    console.log("  ✅ Categories (9)")

    const [redWine, whiteWine, rose, sparkling, cocktails, beer, food, dessert, charcuterie] = categories

    // ============================================================
    // 5. PRODUCTS (upsert by SKU)
    // ============================================================
    const productData = [
        { name: "Château Margaux 2018", sku: "WR-001", categoryId: redWine.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2018, appellation: "Margaux AOC", grapeVariety: "Cabernet Sauvignon, Merlot", country: "France", region: "Bordeaux", alcoholPct: 13.5, tastingNotes: "Elegant with notes of blackcurrant, violet, and cedar", costPrice: 3200000, sellPrice: 5900000, glassPrice: 890000, isByGlass: true, glassesPerBottle: 8, servingTemp: "16-18°C", decantingTime: "30 phút", glassType: "Bordeaux", oxidationHours: 48, lowStockAlert: 3 },
        { name: "Penfolds Bin 389", sku: "WR-002", categoryId: redWine.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2020, grapeVariety: "Cabernet Sauvignon, Shiraz", country: "Australia", region: "South Australia", alcoholPct: 14.5, costPrice: 1200000, sellPrice: 2400000, glassPrice: 380000, isByGlass: true, glassesPerBottle: 8, servingTemp: "16-18°C", glassType: "Bordeaux", oxidationHours: 48, lowStockAlert: 3 },
        { name: "Cabernet Sauvignon Reserve", sku: "WR-003", categoryId: redWine.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2021, grapeVariety: "Cabernet Sauvignon", country: "Chile", region: "Maipo Valley", alcoholPct: 14, costPrice: 380000, sellPrice: 720000, glassPrice: 120000, isByGlass: true, glassesPerBottle: 8, servingTemp: "16-18°C", glassType: "Bordeaux", oxidationHours: 48, lowStockAlert: 5 },
        { name: "Pinot Noir Willamette", sku: "WR-004", categoryId: redWine.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2022, grapeVariety: "Pinot Noir", country: "USA", region: "Oregon", alcoholPct: 13, costPrice: 450000, sellPrice: 960000, glassPrice: 150000, isByGlass: true, glassesPerBottle: 8, servingTemp: "14-16°C", glassType: "Burgundy", oxidationHours: 36, lowStockAlert: 3 },
        { name: "Malbec Reserva Mendoza", sku: "WR-005", categoryId: redWine.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2021, grapeVariety: "Malbec", country: "Argentina", region: "Mendoza", alcoholPct: 14.5, tastingNotes: "Bold with plum, blackberry, chocolate, and spice", costPrice: 350000, sellPrice: 680000, glassPrice: 110000, isByGlass: true, glassesPerBottle: 8, servingTemp: "16-18°C", glassType: "Bordeaux", oxidationHours: 24, lowStockAlert: 3 },
        { name: "Tempranillo Rioja Crianza", sku: "WR-006", categoryId: redWine.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2020, grapeVariety: "Tempranillo", country: "Spain", region: "Rioja", alcoholPct: 13.5, tastingNotes: "Cherry, leather, vanilla from oak aging", costPrice: 420000, sellPrice: 850000, glassPrice: 135000, isByGlass: true, glassesPerBottle: 8, servingTemp: "16-18°C", glassType: "Bordeaux", oxidationHours: 30, lowStockAlert: 3 },
        { name: "Syrah Côtes du Rhône", sku: "WR-007", categoryId: redWine.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2022, grapeVariety: "Syrah, Grenache", country: "France", region: "Rhône Valley", alcoholPct: 14, tastingNotes: "Dark fruit, pepper, smoky notes", costPrice: 300000, sellPrice: 620000, glassPrice: 100000, isByGlass: true, glassesPerBottle: 8, servingTemp: "16-18°C", glassType: "Bordeaux", oxidationHours: 36, lowStockAlert: 5 },
        { name: "Chardonnay Napa Valley", sku: "WW-001", categoryId: whiteWine.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2022, grapeVariety: "Chardonnay", country: "USA", region: "Napa Valley", alcoholPct: 13.5, costPrice: 320000, sellPrice: 680000, glassPrice: 110000, isByGlass: true, glassesPerBottle: 8, servingTemp: "10-12°C", glassType: "White Wine", oxidationHours: 36, lowStockAlert: 3 },
        { name: "Sauvignon Blanc Marlborough", sku: "WW-002", categoryId: whiteWine.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2023, grapeVariety: "Sauvignon Blanc", country: "New Zealand", region: "Marlborough", alcoholPct: 12.5, costPrice: 280000, sellPrice: 580000, glassPrice: 95000, isByGlass: true, glassesPerBottle: 8, servingTemp: "8-10°C", glassType: "White Wine", oxidationHours: 24, lowStockAlert: 3 },
        { name: "Riesling Mosel Kabinett", sku: "WW-003", categoryId: whiteWine.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2023, grapeVariety: "Riesling", country: "Germany", region: "Mosel", alcoholPct: 8.5, tastingNotes: "Green apple, lime, slate minerality, honey", costPrice: 380000, sellPrice: 750000, glassPrice: 120000, isByGlass: true, glassesPerBottle: 8, servingTemp: "6-8°C", glassType: "White Wine", oxidationHours: 24, lowStockAlert: 3 },
        { name: "Pinot Grigio Alto Adige", sku: "WW-004", categoryId: whiteWine.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2023, grapeVariety: "Pinot Grigio", country: "Italy", region: "Alto Adige", alcoholPct: 12, tastingNotes: "Crisp, pear, almond, citrus zest", costPrice: 250000, sellPrice: 490000, glassPrice: 80000, isByGlass: true, glassesPerBottle: 8, servingTemp: "8-10°C", glassType: "White Wine", oxidationHours: 24, lowStockAlert: 5 },
        { name: "Whispering Angel Rosé", sku: "RS-001", categoryId: rose.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2023, grapeVariety: "Grenache, Cinsault, Rolle", country: "France", region: "Provence", alcoholPct: 13, tastingNotes: "Pale pink, fresh strawberry, citrus, floral", costPrice: 450000, sellPrice: 890000, glassPrice: 140000, isByGlass: true, glassesPerBottle: 8, servingTemp: "8-10°C", glassType: "White Wine", oxidationHours: 24, lowStockAlert: 3 },
        { name: "Miraval Rosé Provence", sku: "RS-002", categoryId: rose.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2023, grapeVariety: "Cinsault, Grenache, Syrah", country: "France", region: "Provence", alcoholPct: 13, tastingNotes: "Elegant, wild strawberry, peach, mineral finish", costPrice: 520000, sellPrice: 980000, glassPrice: 155000, isByGlass: true, glassesPerBottle: 8, servingTemp: "8-10°C", glassType: "White Wine", oxidationHours: 24, lowStockAlert: 3 },
        { name: "Prosecco Valdobbiadene DOCG", sku: "SP-001", categoryId: sparkling.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 2023, grapeVariety: "Glera", country: "Italy", region: "Veneto", alcoholPct: 11, tastingNotes: "Fine bubbles, green apple, acacia, fresh finish", costPrice: 250000, sellPrice: 520000, glassPrice: 85000, isByGlass: true, glassesPerBottle: 8, servingTemp: "6-8°C", glassType: "Flute", oxidationHours: 12, lowStockAlert: 5 },
        { name: "Veuve Clicquot Brut", sku: "SP-002", categoryId: sparkling.id, type: "WINE_BOTTLE" as const, taxRateId: taxRates[0].id, vintage: 0, appellation: "Champagne AOC", grapeVariety: "Pinot Noir, Chardonnay, Pinot Meunier", country: "France", region: "Champagne", alcoholPct: 12, tastingNotes: "Brioche, yellow fruit, fine mousse, long finish", costPrice: 1800000, sellPrice: 3200000, glassPrice: 480000, isByGlass: true, glassesPerBottle: 8, servingTemp: "8-10°C", glassType: "Flute", oxidationHours: 6, lowStockAlert: 2 },
        { name: "Noir Old Fashioned", sku: "CK-001", categoryId: cocktails.id, type: "DRINK" as const, taxRateId: taxRates[0].id, costPrice: 45000, sellPrice: 180000 },
        { name: "Wine Spritz", sku: "CK-002", categoryId: cocktails.id, type: "DRINK" as const, taxRateId: taxRates[0].id, costPrice: 35000, sellPrice: 150000 },
        { name: "Cheese Board Selection", sku: "FD-001", categoryId: charcuterie.id, type: "FOOD" as const, taxRateId: taxRates[0].id, costPrice: 120000, sellPrice: 350000 },
        { name: "Bruschetta Trio", sku: "FD-002", categoryId: food.id, type: "FOOD" as const, taxRateId: taxRates[0].id, costPrice: 45000, sellPrice: 165000 },
        { name: "Wagyu Steak Tartare", sku: "FD-003", categoryId: food.id, type: "FOOD" as const, taxRateId: taxRates[0].id, costPrice: 180000, sellPrice: 420000 },
        { name: "Truffle Fries", sku: "FD-004", categoryId: food.id, type: "FOOD" as const, taxRateId: taxRates[0].id, costPrice: 35000, sellPrice: 120000 },
    ]

    const products = []
    for (const p of productData) {
        const existing = await prisma.product.findFirst({ where: { sku: p.sku } })
        if (existing) { products.push(existing) } else { products.push(await prisma.product.create({ data: { ...p, nameVi: p.name } })) }
    }
    console.log(`  ✅ Products (${products.length})`)

    // ============================================================
    // 6. TABLE ZONES & FLOOR TABLES
    // ============================================================
    const zoneData = [
        { name: "Indoor Tầng 1", sortOrder: 1 },
        { name: "Outdoor Sân vườn", sortOrder: 2 },
        { name: "Bar Counter", sortOrder: 3 },
        { name: "VIP Room", sortOrder: 4 },
    ]

    const zones = []
    for (const z of zoneData) {
        const existing = await prisma.tableZone.findFirst({ where: { name: z.name } })
        zones.push(existing ?? await prisma.tableZone.create({ data: z }))
    }
    const [indoor, outdoor, bar, vip] = zones

    const tableData = [
        { zoneId: indoor.id, tableNumber: "T01", seats: 4, posX: 0, posY: 0 },
        { zoneId: indoor.id, tableNumber: "T02", seats: 4, posX: 1, posY: 0 },
        { zoneId: indoor.id, tableNumber: "T03", seats: 2, posX: 2, posY: 0 },
        { zoneId: indoor.id, tableNumber: "T04", seats: 6, posX: 0, posY: 1 },
        { zoneId: indoor.id, tableNumber: "T05", seats: 4, posX: 1, posY: 1 },
        { zoneId: indoor.id, tableNumber: "T06", seats: 4, posX: 2, posY: 1 },
        { zoneId: outdoor.id, tableNumber: "T07", seats: 4, posX: 0, posY: 0 },
        { zoneId: outdoor.id, tableNumber: "T08", seats: 4, posX: 1, posY: 0 },
        { zoneId: outdoor.id, tableNumber: "T09", seats: 6, posX: 2, posY: 0 },
        { zoneId: bar.id, tableNumber: "B01", seats: 1, shape: "circle" as const, posX: 0, posY: 0 },
        { zoneId: bar.id, tableNumber: "B02", seats: 1, shape: "circle" as const, posX: 1, posY: 0 },
        { zoneId: vip.id, tableNumber: "VIP1", seats: 8, shape: "circle" as const, posX: 0, posY: 0 },
    ]
    for (const t of tableData) {
        const existing = await prisma.floorTable.findFirst({ where: { tableNumber: t.tableNumber } })
        if (!existing) await prisma.floorTable.create({ data: t })
    }
    console.log("  ✅ Zones (4) + Tables (12)")

    // ============================================================
    // 7. SUPPLIERS
    // ============================================================
    const supplierData = [
        { name: "Wine Importers Co.", contactName: "Nguyễn Văn A", phone: "0281234567", email: "contact@wineimporters.vn", address: "456 Lê Lợi, Q.1, TP.HCM" },
        { name: "Vino Distribution", contactName: "Trần Thị B", phone: "0287654321", email: "sales@vinodist.vn", address: "789 Trần Hưng Đạo, Q.5, TP.HCM" },
        { name: "Euro Wines Vietnam", contactName: "Jean Pierre", phone: "0289876543", email: "jp@eurowines.vn" },
    ]
    const suppliers = []
    for (const s of supplierData) {
        const existing = await prisma.supplier.findFirst({ where: { name: s.name } })
        suppliers.push(existing ?? await prisma.supplier.create({ data: s }))
    }
    console.log("  ✅ Suppliers (3)")

    // ============================================================
    // 8. CUSTOMERS
    // ============================================================
    const customerData = [
        { name: "Nguyễn Minh Tuấn", phone: "0912345678", email: "tuan@email.com", tier: "GOLD" as const, totalSpent: 15200000, loyaltyPts: 1520, notes: "Thích vang đỏ Bordeaux" },
        { name: "Trần Thị Mai", phone: "0923456789", email: "mai@email.com", tier: "SILVER" as const, totalSpent: 8500000, loyaltyPts: 850 },
        { name: "Lê Hoàng Nam", phone: "0934567890", tier: "REGULAR" as const, totalSpent: 2300000, loyaltyPts: 230 },
        { name: "Phạm Quốc Bảo", phone: "0945678901", email: "bao@company.vn", tier: "VIP" as const, totalSpent: 45000000, loyaltyPts: 4500, notes: "Corporate account - Công ty ABC" },
        { name: "Võ Ngọc Hà", phone: "0956789012", tier: "REGULAR" as const, totalSpent: 900000, loyaltyPts: 90 },
    ]
    for (const c of customerData) {
        const existing = await prisma.customer.findFirst({ where: { phone: c.phone } })
        if (!existing) await prisma.customer.create({ data: c })
    }
    console.log("  ✅ Customers (5)")

    // ============================================================
    // 9. INGREDIENTS
    // ============================================================
    const ingredientData = [
        { name: "Bơ Anchor", unit: "kg", currentStock: 5, minStock: 2, costPerUnit: 180000 },
        { name: "Phô mai Parmesan", unit: "kg", currentStock: 3, minStock: 1, costPerUnit: 450000 },
        { name: "Bánh mì ciabatta", unit: "ổ", currentStock: 20, minStock: 10, costPerUnit: 15000 },
        { name: "Cà chua cherry", unit: "kg", currentStock: 4, minStock: 2, costPerUnit: 85000 },
        { name: "Bò Wagyu A5", unit: "kg", currentStock: 2, minStock: 1, costPerUnit: 3500000 },
        { name: "Khoai tây", unit: "kg", currentStock: 10, minStock: 5, costPerUnit: 25000 },
        { name: "Dầu truffle", unit: "ml", currentStock: 500, minStock: 100, costPerUnit: 800 },
        { name: "Phô mai Gouda", unit: "kg", currentStock: 3.5, minStock: 2, costPerUnit: 320000 },
        { name: "Jamón Serrano", unit: "kg", currentStock: 2, minStock: 1, costPerUnit: 580000 },
        { name: "Mật ong hoa rừng", unit: "chai", currentStock: 3, minStock: 2, costPerUnit: 120000 },
    ]
    for (const ing of ingredientData) {
        const existing = await prisma.ingredient.findFirst({ where: { name: ing.name } })
        if (!existing) await prisma.ingredient.create({ data: ing })
    }
    console.log("  ✅ Ingredients (10)")

    // ============================================================
    // 10. WINE BOTTLES — diversified inventory
    // ============================================================
    const wineProducts = products.filter((p) => p.type === "WINE_BOTTLE")
    // Different stock levels per product for realistic scenario
    const stockConfig: Record<string, { total: number; opened: number; sold: number }> = {
        "WR-001": { total: 3, opened: 1, sold: 2 },   // Margaux: limited
        "WR-002": { total: 6, opened: 1, sold: 0 },   // Penfolds: good stock
        "WR-003": { total: 8, opened: 1, sold: 2 },   // Cab Reserve: plenty 
        "WR-004": { total: 2, opened: 0, sold: 3 },   // Pinot Noir: low
        "WR-005": { total: 5, opened: 1, sold: 1 },   // Malbec
        "WR-006": { total: 4, opened: 1, sold: 0 },   // Tempranillo
        "WR-007": { total: 7, opened: 1, sold: 3 },   // Syrah
        "WW-001": { total: 6, opened: 1, sold: 1 },   // Chardonnay
        "WW-002": { total: 5, opened: 1, sold: 0 },   // Sauv Blanc
        "WW-003": { total: 4, opened: 0, sold: 1 },   // Riesling
        "WW-004": { total: 8, opened: 1, sold: 2 },   // Pinot Grigio: popular
        "RS-001": { total: 3, opened: 1, sold: 1 },   // Whispering Angel
        "RS-002": { total: 2, opened: 0, sold: 1 },   // Miraval
        "SP-001": { total: 10, opened: 1, sold: 4 },  // Prosecco: best seller
        "SP-002": { total: 2, opened: 0, sold: 0 },   // Veuve Clicquot: premium
    }
    let bottleCount = 0
    for (const wp of wineProducts) {
        const existingCount = await prisma.wineBottle.count({ where: { productId: wp.id } })
        if (existingCount > 0) { bottleCount += existingCount; continue }
        const cfg = stockConfig[wp.sku ?? ""] ?? { total: 5, opened: 0, sold: 0 }
        const allBottles = cfg.total + cfg.sold
        for (let i = 0; i < allBottles; i++) {
            let status: "IN_STOCK" | "OPENED" | "SOLD" = "IN_STOCK"
            if (i < cfg.sold) status = "SOLD"
            else if (i === cfg.sold && cfg.opened > 0) status = "OPENED"

            await prisma.wineBottle.create({
                data: {
                    productId: wp.id,
                    batchCode: `BATCH-${wp.sku}-${String(i + 1).padStart(3, "0")}`,
                    ownershipType: "PURCHASED",
                    status,
                    costPrice: Number(wp.costPrice),
                    receivedAt: new Date(Date.now() - i * 5 * 86400000),
                    openedAt: status === "OPENED" ? new Date(Date.now() - 12 * 3600000) : null,
                    glassesRemaining: status === "OPENED" ? Math.floor(Math.random() * 5) + 2 : (status === "SOLD" ? 0 : wp.glassesPerBottle),
                },
            })
            bottleCount++
        }
    }
    console.log(`  ✅ Wine Bottles (${bottleCount})`)

    // ============================================================
    // 11. PROMOTIONS
    // ============================================================
    const promoData = [
        {
            name: "🌅 Happy Hour — Rượu vang by Glass", description: "Giảm 15% tất cả rượu by-glass từ 17h-19h, T2-T6",
            type: "HAPPY_HOUR" as const, discountPercent: 15, maxDiscount: 200000,
            applicableCategories: ["wine-by-glass"], startTime: "17:00", endTime: "19:00",
            activeDays: ["MON", "TUE", "WED", "THU", "FRI"] as any, startDate: new Date("2026-01-01"), priority: 10,
        },
        {
            name: "🥂 Ladies Night", description: "Giảm 20% Rosé & Champagne, thứ 4 & 5 từ 19h-22h",
            type: "PERCENT_OFF" as const, discountPercent: 20, minOrderAmount: 200000, maxDiscount: 500000,
            startTime: "19:00", endTime: "22:00",
            activeDays: ["WED", "THU"] as any, startDate: new Date("2026-02-01"), endDate: new Date("2026-06-30"), maxUsage: 500, priority: 8,
        },
        {
            name: "🎉 Weekend Special — Giảm ₫50K", description: "Giảm ₫50.000 cho đơn từ ₫300.000, T7 & CN",
            type: "FIXED_AMOUNT" as const, discountAmount: 50000, minOrderAmount: 300000, maxDiscount: 50000,
            activeDays: ["SAT", "SUN"] as any, startDate: new Date("2026-03-01"), priority: 3,
        },
        {
            name: "🌙 Late Night 10%", description: "Giảm 10% sau 22h mỗi ngày",
            type: "HAPPY_HOUR" as const, discountPercent: 10, maxDiscount: 300000,
            startTime: "22:00", endTime: "23:59",
            activeDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as any, startDate: new Date("2026-01-15"), priority: 2,
        },
    ]
    let promoCount = 0
    for (const p of promoData) {
        const existing = await prisma.promotion.findFirst({ where: { name: p.name } })
        if (!existing) { await prisma.promotion.create({ data: p }); promoCount++ }
    }
    console.log(`  ✅ Promotions (${promoCount} new)`)

    // ============================================================
    // 12. EQUIPMENT (CCDC)
    // ============================================================
    const equipmentData = [
        { name: "Ly Bordeaux Riedel", code: "CCDC-LY-001", category: "Ly & Cốc", quantity: 48, unitPrice: 350000, totalValue: 16800000, purchaseDate: new Date("2025-12-01"), poNumber: "PO-2025-015", usefulLifeMonths: 24, monthlyDepreciation: 700000, accumulatedDepreciation: 2100000, netBookValue: 14700000, location: "Quầy Bar", notes: "Ly uống rượu vang đỏ" },
        { name: "Decanter Crystal 1.5L", code: "CCDC-DC-001", category: "Dụng cụ Bar", quantity: 6, unitPrice: 1200000, totalValue: 7200000, purchaseDate: new Date("2025-12-01"), poNumber: "PO-2025-015", usefulLifeMonths: 36, monthlyDepreciation: 200000, accumulatedDepreciation: 600000, netBookValue: 6600000, location: "Quầy Bar", notes: "Bình decant rượu" },
        { name: "Máy rửa ly công nghiệp", code: "CCDC-MR-001", category: "Thiết bị", quantity: 1, unitPrice: 25000000, totalValue: 25000000, purchaseDate: new Date("2025-10-15"), poNumber: "PO-2025-008", usefulLifeMonths: 60, monthlyDepreciation: 416667, accumulatedDepreciation: 2083335, netBookValue: 22916665, location: "Bếp", notes: "Winterhalter UC-L" },
        { name: "Tủ rượu Liebherr 200 chai", code: "CCDC-TR-001", category: "Thiết bị", quantity: 1, unitPrice: 45000000, totalValue: 45000000, purchaseDate: new Date("2025-09-01"), poNumber: "PO-2025-005", usefulLifeMonths: 84, monthlyDepreciation: 535714, accumulatedDepreciation: 3214284, netBookValue: 41785716, location: "Hầm rượu", notes: "Tủ bảo quản nhiệt độ" },
        { name: "Khui rượu Laguiole", code: "CCDC-KR-001", category: "Dụng cụ Bar", quantity: 8, unitPrice: 450000, totalValue: 3600000, purchaseDate: new Date("2026-01-10"), poNumber: "PO-2026-001", usefulLifeMonths: 24, monthlyDepreciation: 150000, accumulatedDepreciation: 300000, netBookValue: 3300000, location: "Quầy Bar", notes: "Khui rượu chuyên nghiệp" },
    ]
    let eqCount = 0
    for (const eq of equipmentData) {
        const existing = await prisma.equipment.findFirst({ where: { code: eq.code } })
        if (!existing) { await prisma.equipment.create({ data: eq }); eqCount++ }
    }
    console.log(`  ✅ Equipment (${eqCount} new)`)

    console.log("\n🎉 Seed completed successfully!")
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
