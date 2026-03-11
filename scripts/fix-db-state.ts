import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '..', '.env') })

import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('=== Checking DB state after tests ===\n')

    // 1. Non-available tables
    const tables = await prisma.floorTable.findMany({
        where: { status: { not: 'AVAILABLE' } },
        include: { zone: true },
    })
    console.log(`📋 Non-available tables: ${tables.length}`)
    for (const t of tables) {
        console.log(`  ${t.tableNumber} → ${t.status} (${t.zone.name})`)
    }

    // 2. Open shift
    const shift = await prisma.shiftRecord.findFirst({
        where: { closedAt: null },
        include: { staff: true },
    })
    console.log(`\n🔄 Open shift: ${shift ? `YES — ${shift.staff.fullName}` : 'NONE ❌'}`)

    // 3. Fix: Reset occupied/cleaning tables to AVAILABLE
    if (tables.length > 0) {
        const testTables = tables.filter(t => ['OCCUPIED', 'CLEANING'].includes(t.status))
        if (testTables.length > 0) {
            console.log(`\n🔧 Resetting ${testTables.length} tables to AVAILABLE...`)
            await prisma.floorTable.updateMany({
                where: { status: { in: ['OCCUPIED', 'CLEANING'] } },
                data: { status: 'AVAILABLE' },
            })
            console.log('✅ Tables reset!')
        }
    }

    // 4. Open a shift if none exists
    if (!shift) {
        const owner = await prisma.staff.findFirst({ where: { role: 'OWNER', isActive: true } })
        if (owner) {
            console.log('\n🔧 Opening a new shift for ' + owner.fullName + '...')
            await prisma.shiftRecord.create({
                data: { staffId: owner.id, openingCash: 500000 },
            })
            console.log('✅ Shift opened!')
        }
    }

    await pool.end()
    console.log('\n✅ Done! POS should work now.')
}
main().catch(console.error)
