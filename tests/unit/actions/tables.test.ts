/**
 * 🧪 Unit Tests — Tables & Zones (P2)
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
    getZones,
    getTables,
    getTableStats,
    createZone,
    createTable,
    updateTableStatus,
    deleteZone,
} from '@/actions/tables'
import { prisma } from '@/lib/prisma'

const createdZoneIds: string[] = []
const createdTableIds: string[] = []

describe('Tables & Zones (Real DB)', () => {
    afterAll(async () => {
        for (const id of createdTableIds) {
            try { await prisma.floorTable.delete({ where: { id } }) } catch { /* */ }
        }
        for (const id of createdZoneIds) {
            try { await prisma.tableZone.delete({ where: { id } }) } catch { /* */ }
        }
        await prisma.$disconnect()
    })

    it('U-TBL-01: getZones — should return zone list', async () => {
        const zones = await getZones()
        expect(Array.isArray(zones)).toBe(true)
        expect(zones.length).toBeGreaterThan(0)
        expect(zones[0]).toHaveProperty('name')
    })

    it('U-TBL-02: createZone — should create new zone', async () => {
        const result = await createZone({ name: 'Test Zone Unit' })
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        createdZoneIds.push(result.data!.id)
    })

    it('U-TBL-03: getTables — should return table list', async () => {
        const tables = await getTables()
        expect(Array.isArray(tables)).toBe(true)
        if (tables.length > 0) {
            expect(tables[0]).toHaveProperty('tableNumber')
            expect(tables[0]).toHaveProperty('seats')
            expect(tables[0]).toHaveProperty('zone')
        }
    })

    it('U-TBL-04: createTable — should create table in zone', async () => {
        if (createdZoneIds.length === 0) return
        const result = await createTable({
            zoneId: createdZoneIds[0],
            tableNumber: 'T-TEST-99',
            seats: 4,
        })
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        createdTableIds.push(result.data!.id)
    })

    it('U-TBL-05: updateTableStatus — should change status', async () => {
        if (createdTableIds.length === 0) return
        const result = await updateTableStatus(createdTableIds[0], 'RESERVED')
        expect(result.success).toBe(true)

        const table = await prisma.floorTable.findUnique({ where: { id: createdTableIds[0] } })
        expect(table?.status).toBe('RESERVED')

        // Reset
        await updateTableStatus(createdTableIds[0], 'AVAILABLE')
    })

    it('U-TBL-06: getTableStats — should return occupancy stats', async () => {
        const stats = await getTableStats()
        expect(stats).toHaveProperty('total')
        expect(stats).toHaveProperty('available')
        expect(stats).toHaveProperty('occupied')
        expect(stats).toHaveProperty('reserved')
        expect(stats.total).toBeGreaterThan(0)
    })

    it('U-TBL-07: deleteZone — should fail if zone has tables', async () => {
        if (createdZoneIds.length === 0) return
        const result = await deleteZone(createdZoneIds[0])
        // Should fail because we just created a table in this zone
        expect(result.success).toBe(false)
    })
})
