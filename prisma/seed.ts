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
    const settings = await prisma.storeSettings.upsert({
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
    // 3. STAFF
    // ============================================================
    const staff = await Promise.all([
        prisma.staff.create({ data: { fullName: "Chiến (Owner)", phone: "0901234567", email: "chien@noonnoir.vn", role: "OWNER", baseSalary: 0, pinCode: "0000" } }),
        prisma.staff.create({ data: { fullName: "Minh (Manager)", phone: "0901234568", email: "minh@noonnoir.vn", role: "MANAGER", baseSalary: 15000000, pinCode: "1234" } }),
        prisma.staff.create({ data: { fullName: "Lan (Cashier)", phone: "0901234569", role: "CASHIER", baseSalary: 8000000, pinCode: "5678" } }),
        prisma.staff.create({ data: { fullName: "Hùng (Bartender)", phone: "0901234570", role: "BARTENDER", baseSalary: 10000000, pinCode: "9012" } }),
        prisma.staff.create({ data: { fullName: "Tú (Kitchen)", phone: "0901234571", role: "KITCHEN", baseSalary: 8000000, pinCode: "3456" } }),
        prisma.staff.create({ data: { fullName: "Vy (Waiter)", phone: "0901234572", role: "WAITER", baseSalary: 7000000, pinCode: "7890" } }),
    ])
    console.log("  ✅ Staff (6)")

    // ============================================================
    // 4. CATEGORIES
    // ============================================================
    const categories = await Promise.all([
        prisma.category.create({ data: { name: "Red Wine", nameVi: "Rượu vang đỏ", icon: "🍷", sortOrder: 1 } }),
        prisma.category.create({ data: { name: "White Wine", nameVi: "Rượu vang trắng", icon: "🥂", sortOrder: 2 } }),
        prisma.category.create({ data: { name: "Rosé", nameVi: "Rượu vang hồng", icon: "🌸", sortOrder: 3 } }),
        prisma.category.create({ data: { name: "Sparkling", nameVi: "Rượu sủi tăm", icon: "🍾", sortOrder: 4 } }),
        prisma.category.create({ data: { name: "Cocktails", nameVi: "Cocktails", icon: "🍸", sortOrder: 5 } }),
        prisma.category.create({ data: { name: "Beer", nameVi: "Bia", icon: "🍺", sortOrder: 6 } }),
        prisma.category.create({ data: { name: "Food", nameVi: "Đồ ăn", icon: "🍽️", sortOrder: 7 } }),
        prisma.category.create({ data: { name: "Dessert", nameVi: "Tráng miệng", icon: "🍰", sortOrder: 8 } }),
        prisma.category.create({ data: { name: "Charcuterie", nameVi: "Thịt nguội & phô mai", icon: "🧀", sortOrder: 9 } }),
    ])
    console.log("  ✅ Categories (9)")

    const [redWine, whiteWine, rose, sparkling, cocktails, beer, food, dessert, charcuterie] = categories

    // ============================================================
    // 5. PRODUCTS
    // ============================================================
    const products = await Promise.all([
        // Red Wines
        prisma.product.create({
            data: {
                name: "Château Margaux 2018", nameVi: "Château Margaux 2018", sku: "WR-001",
                categoryId: redWine.id, type: "WINE_BOTTLE", taxRateId: taxRates[0].id,
                vintage: 2018, appellation: "Margaux AOC", grapeVariety: "Cabernet Sauvignon, Merlot",
                country: "France", region: "Bordeaux", alcoholPct: 13.5,
                tastingNotes: "Elegant with notes of blackcurrant, violet, and cedar",
                costPrice: 3200000, sellPrice: 5900000, glassPrice: 890000,
                isByGlass: true, glassesPerBottle: 8, servingTemp: "16-18°C",
                decantingTime: "30 phút", glassType: "Bordeaux",
            },
        }),
        prisma.product.create({
            data: {
                name: "Penfolds Bin 389", nameVi: "Penfolds Bin 389", sku: "WR-002",
                categoryId: redWine.id, type: "WINE_BOTTLE", taxRateId: taxRates[0].id,
                vintage: 2020, appellation: "South Australia", grapeVariety: "Cabernet Sauvignon, Shiraz",
                country: "Australia", region: "South Australia", alcoholPct: 14.5,
                tastingNotes: "Rich and complex with dark fruit and spice",
                costPrice: 1200000, sellPrice: 2400000, glassPrice: 380000,
                isByGlass: true, glassesPerBottle: 8, servingTemp: "16-18°C",
                glassType: "Bordeaux",
            },
        }),
        prisma.product.create({
            data: {
                name: "Cabernet Sauvignon Reserve", nameVi: "Cabernet Sauvignon Reserve", sku: "WR-003",
                categoryId: redWine.id, type: "WINE_BOTTLE", taxRateId: taxRates[0].id,
                vintage: 2021, grapeVariety: "Cabernet Sauvignon",
                country: "Chile", region: "Maipo Valley", alcoholPct: 14,
                costPrice: 380000, sellPrice: 720000, glassPrice: 120000,
                isByGlass: true, glassesPerBottle: 8, servingTemp: "16-18°C",
                glassType: "Bordeaux",
            },
        }),
        prisma.product.create({
            data: {
                name: "Pinot Noir Willamette", nameVi: "Pinot Noir Willamette", sku: "WR-004",
                categoryId: redWine.id, type: "WINE_BOTTLE", taxRateId: taxRates[0].id,
                vintage: 2022, grapeVariety: "Pinot Noir",
                country: "USA", region: "Oregon", alcoholPct: 13,
                tastingNotes: "Silky with cherry, raspberry and earthy notes",
                costPrice: 450000, sellPrice: 960000, glassPrice: 150000,
                isByGlass: true, glassesPerBottle: 8, servingTemp: "14-16°C",
                glassType: "Burgundy",
            },
        }),
        // White Wines
        prisma.product.create({
            data: {
                name: "Chardonnay Napa Valley", nameVi: "Chardonnay Napa Valley", sku: "WW-001",
                categoryId: whiteWine.id, type: "WINE_BOTTLE", taxRateId: taxRates[0].id,
                vintage: 2022, grapeVariety: "Chardonnay",
                country: "USA", region: "Napa Valley", alcoholPct: 13.5,
                costPrice: 320000, sellPrice: 680000, glassPrice: 110000,
                isByGlass: true, glassesPerBottle: 8, servingTemp: "10-12°C",
                glassType: "White Wine",
            },
        }),
        prisma.product.create({
            data: {
                name: "Sauvignon Blanc Marlborough", nameVi: "Sauvignon Blanc Marlborough", sku: "WW-002",
                categoryId: whiteWine.id, type: "WINE_BOTTLE", taxRateId: taxRates[0].id,
                vintage: 2023, grapeVariety: "Sauvignon Blanc",
                country: "New Zealand", region: "Marlborough", alcoholPct: 12.5,
                costPrice: 280000, sellPrice: 580000, glassPrice: 95000,
                isByGlass: true, glassesPerBottle: 8, servingTemp: "8-10°C",
                glassType: "White Wine",
            },
        }),
        // Cocktails
        prisma.product.create({
            data: {
                name: "Noir Old Fashioned", nameVi: "Noir Old Fashioned", sku: "CK-001",
                categoryId: cocktails.id, type: "DRINK", taxRateId: taxRates[0].id,
                costPrice: 45000, sellPrice: 180000,
            },
        }),
        prisma.product.create({
            data: {
                name: "Wine Spritz", nameVi: "Wine Spritz", sku: "CK-002",
                categoryId: cocktails.id, type: "DRINK", taxRateId: taxRates[0].id,
                costPrice: 35000, sellPrice: 150000,
            },
        }),
        // Food
        prisma.product.create({
            data: {
                name: "Cheese Board Selection", nameVi: "Đĩa phô mai tuyển chọn", sku: "FD-001",
                categoryId: charcuterie.id, type: "FOOD", taxRateId: taxRates[0].id,
                costPrice: 120000, sellPrice: 350000,
            },
        }),
        prisma.product.create({
            data: {
                name: "Bruschetta Trio", nameVi: "Bruschetta 3 vị", sku: "FD-002",
                categoryId: food.id, type: "FOOD", taxRateId: taxRates[0].id,
                costPrice: 45000, sellPrice: 165000,
            },
        }),
        prisma.product.create({
            data: {
                name: "Wagyu Steak Tartare", nameVi: "Tartare bò Wagyu", sku: "FD-003",
                categoryId: food.id, type: "FOOD", taxRateId: taxRates[0].id,
                costPrice: 180000, sellPrice: 420000,
            },
        }),
        prisma.product.create({
            data: {
                name: "Truffle Fries", nameVi: "Khoai tây nấm truffle", sku: "FD-004",
                categoryId: food.id, type: "FOOD", taxRateId: taxRates[0].id,
                costPrice: 35000, sellPrice: 120000,
            },
        }),
    ])
    console.log("  ✅ Products (12)")

    // ============================================================
    // 6. TABLE ZONES & FLOOR TABLES
    // ============================================================
    const zones = await Promise.all([
        prisma.tableZone.create({ data: { name: "Indoor Tầng 1", sortOrder: 1 } }),
        prisma.tableZone.create({ data: { name: "Outdoor Sân vườn", sortOrder: 2 } }),
        prisma.tableZone.create({ data: { name: "Bar Counter", sortOrder: 3 } }),
        prisma.tableZone.create({ data: { name: "VIP Room", sortOrder: 4 } }),
    ])

    const [indoor, outdoor, bar, vip] = zones

    await Promise.all([
        // Indoor
        prisma.floorTable.create({ data: { zoneId: indoor.id, tableNumber: "T01", seats: 4, posX: 0, posY: 0 } }),
        prisma.floorTable.create({ data: { zoneId: indoor.id, tableNumber: "T02", seats: 4, posX: 1, posY: 0 } }),
        prisma.floorTable.create({ data: { zoneId: indoor.id, tableNumber: "T03", seats: 2, posX: 2, posY: 0 } }),
        prisma.floorTable.create({ data: { zoneId: indoor.id, tableNumber: "T04", seats: 6, posX: 0, posY: 1 } }),
        prisma.floorTable.create({ data: { zoneId: indoor.id, tableNumber: "T05", seats: 4, posX: 1, posY: 1 } }),
        prisma.floorTable.create({ data: { zoneId: indoor.id, tableNumber: "T06", seats: 4, posX: 2, posY: 1 } }),
        // Outdoor
        prisma.floorTable.create({ data: { zoneId: outdoor.id, tableNumber: "T07", seats: 4, posX: 0, posY: 0 } }),
        prisma.floorTable.create({ data: { zoneId: outdoor.id, tableNumber: "T08", seats: 4, posX: 1, posY: 0 } }),
        prisma.floorTable.create({ data: { zoneId: outdoor.id, tableNumber: "T09", seats: 6, posX: 2, posY: 0 } }),
        // Bar
        prisma.floorTable.create({ data: { zoneId: bar.id, tableNumber: "B01", seats: 1, shape: "circle", posX: 0, posY: 0 } }),
        prisma.floorTable.create({ data: { zoneId: bar.id, tableNumber: "B02", seats: 1, shape: "circle", posX: 1, posY: 0 } }),
        // VIP
        prisma.floorTable.create({ data: { zoneId: vip.id, tableNumber: "VIP1", seats: 8, shape: "circle", posX: 0, posY: 0 } }),
    ])
    console.log("  ✅ Zones (4) + Tables (12)")

    // ============================================================
    // 7. SUPPLIERS
    // ============================================================
    const suppliers = await Promise.all([
        prisma.supplier.create({ data: { name: "Wine Importers Co.", contactName: "Nguyễn Văn A", phone: "0281234567", email: "contact@wineimporters.vn", address: "456 Lê Lợi, Q.1, TP.HCM" } }),
        prisma.supplier.create({ data: { name: "Vino Distribution", contactName: "Trần Thị B", phone: "0287654321", email: "sales@vinodist.vn", address: "789 Trần Hưng Đạo, Q.5, TP.HCM" } }),
        prisma.supplier.create({ data: { name: "Euro Wines Vietnam", contactName: "Jean Pierre", phone: "0289876543", email: "jp@eurowines.vn" } }),
    ])
    console.log("  ✅ Suppliers (3)")

    // ============================================================
    // 8. CUSTOMERS
    // ============================================================
    await Promise.all([
        prisma.customer.create({ data: { name: "Nguyễn Minh Tuấn", phone: "0912345678", email: "tuan@email.com", tier: "GOLD", totalSpent: 15200000, loyaltyPts: 1520, notes: "Thích vang đỏ Bordeaux" } }),
        prisma.customer.create({ data: { name: "Trần Thị Mai", phone: "0923456789", email: "mai@email.com", tier: "SILVER", totalSpent: 8500000, loyaltyPts: 850 } }),
        prisma.customer.create({ data: { name: "Lê Hoàng Nam", phone: "0934567890", tier: "REGULAR", totalSpent: 2300000, loyaltyPts: 230 } }),
        prisma.customer.create({ data: { name: "Phạm Quốc Bảo", phone: "0945678901", email: "bao@company.vn", tier: "VIP", totalSpent: 45000000, loyaltyPts: 4500, notes: "Corporate account - Công ty ABC" } }),
        prisma.customer.create({ data: { name: "Võ Ngọc Hà", phone: "0956789012", tier: "REGULAR", totalSpent: 900000, loyaltyPts: 90 } }),
    ])
    console.log("  ✅ Customers (5)")

    // ============================================================
    // 9. INGREDIENTS
    // ============================================================
    await Promise.all([
        prisma.ingredient.create({ data: { name: "Bơ Anchor", unit: "kg", currentStock: 5, minStock: 2, costPerUnit: 180000 } }),
        prisma.ingredient.create({ data: { name: "Phô mai Parmesan", unit: "kg", currentStock: 3, minStock: 1, costPerUnit: 450000 } }),
        prisma.ingredient.create({ data: { name: "Bánh mì ciabatta", unit: "ổ", currentStock: 20, minStock: 10, costPerUnit: 15000 } }),
        prisma.ingredient.create({ data: { name: "Cà chua cherry", unit: "kg", currentStock: 4, minStock: 2, costPerUnit: 85000 } }),
        prisma.ingredient.create({ data: { name: "Bò Wagyu A5", unit: "kg", currentStock: 2, minStock: 1, costPerUnit: 3500000 } }),
        prisma.ingredient.create({ data: { name: "Khoai tây", unit: "kg", currentStock: 10, minStock: 5, costPerUnit: 25000 } }),
        prisma.ingredient.create({ data: { name: "Dầu truffle", unit: "ml", currentStock: 500, minStock: 100, costPerUnit: 800 } }),
    ])
    console.log("  ✅ Ingredients (7)")

    console.log("\n🎉 Seed completed successfully!")
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
