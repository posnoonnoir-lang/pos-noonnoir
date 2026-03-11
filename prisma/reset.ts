import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function reset() {
    console.log("🗑️  Cleaning database...")

    // Delete in reverse dependency order
    await prisma.depreciationEntry.deleteMany()
    await prisma.equipment.deleteMany()
    await prisma.promotion.deleteMany()
    await prisma.out86.deleteMany()
    await prisma.reservation.deleteMany()
    await prisma.feedbackItem.deleteMany()
    await prisma.feedbackSession.deleteMany()
    await prisma.shiftTarget.deleteMany()
    await prisma.forecastSuggestion.deleteMany()
    await prisma.forecastConfig.deleteMany()
    await prisma.tabItem.deleteMany()
    await prisma.customerTab.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.consignmentSettlement.deleteMany()
    await prisma.consignmentItem.deleteMany()
    await prisma.wineBottle.deleteMany()
    await prisma.consignment.deleteMany()
    await prisma.wineGlassConfig.deleteMany()
    await prisma.stockMovement.deleteMany()
    await prisma.productRecipe.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.floorTable.deleteMany()
    await prisma.tableZone.deleteMany()
    await prisma.fundTransaction.deleteMany()
    await prisma.shiftRecord.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.attendance.deleteMany()
    await prisma.payroll.deleteMany()
    await prisma.staff.deleteMany()
    await prisma.debtRecord.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.supplier.deleteMany()
    await prisma.ingredient.deleteMany()
    await prisma.taxRate.deleteMany()
    await prisma.storeSettings.deleteMany()

    console.log("✅ Database cleaned!")
}

reset()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
