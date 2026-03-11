/**
 * 🛡️ Playwright Global Teardown
 * Restores DB state after E2E tests complete.
 * Same logic as fix-db-state.ts but runs automatically.
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import pg from 'pg'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

config({ path: resolve(__dirname, '..', '.env') })

async function globalTeardown() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    console.log('\n🛡️  [PW Teardown] Restoring DB state...')

    // 1. Reset any test-occupied tables
    const fixed = await prisma.floorTable.updateMany({
        where: { status: { in: ['OCCUPIED', 'CLEANING'] } },
        data: { status: 'AVAILABLE' },
    })
    if (fixed.count > 0) console.log(`   📋 Reset ${fixed.count} table(s)`)

    // 2. Ensure shift is open
    const shift = await prisma.shiftRecord.findFirst({ where: { closedAt: null } })
    if (!shift) {
        const owner = await prisma.staff.findFirst({ where: { role: 'OWNER', isActive: true } })
        if (owner) {
            await prisma.shiftRecord.create({ data: { staffId: owner.id, openingCash: 500000 } })
            console.log('   🔄 Opened shift for ' + owner.fullName)
        }
    }

    // 3. Cleanup test data
    const testCustomers = await prisma.customer.findMany({ where: { name: { startsWith: 'Test' } } })
    for (const c of testCustomers) {
        try { await prisma.customer.delete({ where: { id: c.id } }) } catch { /* */ }
    }
    if (testCustomers.length > 0) console.log(`   🧹 Cleaned ${testCustomers.length} test customer(s)`)

    await pool.end()
    console.log('   ✅ DB state restored!\n')
}

export default globalTeardown
