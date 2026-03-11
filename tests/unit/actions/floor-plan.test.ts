/**
 * 🧪 Unit Tests — Tables: Floor Plan Editor, Zone Layout, Table Positions
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
    getTables,
    getZones,
    updateZoneLayout,
    updateTablePositions,
    updateTable,
} from '@/actions/tables'
import { prisma } from '@/lib/prisma'

afterAll(async () => {
    await prisma.$disconnect()
})

describe('Floor Plan — Zone Layout', () => {
    it('U-FP-01: updateZoneLayout saves walls/doors JSON', async () => {
        const zones = await getZones()
        if (zones.length === 0) return

        const zone = zones[0]
        const testLayout = {
            walls: [
                { id: 'w1', type: 'wall' as const, x1: 0, y1: 0, x2: 200, y2: 0 },
                { id: 'd1', type: 'door' as const, x1: 100, y1: 200, x2: 160, y2: 200 },
                { id: 'l1', type: 'label' as const, x1: 50, y1: 50, x2: 150, y2: 80, label: 'Bar' },
            ],
        }

        const res = await updateZoneLayout(zone.id, testLayout)
        expect(res.success).toBe(true)

        // Verify stored
        const updated = await prisma.tableZone.findUnique({ where: { id: zone.id } })
        expect(updated!.layoutData).toBeDefined()
        const data = updated!.layoutData as { walls: unknown[] }
        expect(data.walls.length).toBe(3)

        // Cleanup — set back to null
        await prisma.tableZone.update({ where: { id: zone.id }, data: { layoutData: null as unknown as undefined } })
    })
})

describe('Floor Plan — Table Positions', () => {
    it('U-FP-02: updateTablePositions batch updates positions', async () => {
        const tables = await getTables()
        if (tables.length < 2) return

        const t1 = tables[0]
        const t2 = tables[1]
        const origPos1 = { x: t1.posX, y: t1.posY }
        const origPos2 = { x: t2.posX, y: t2.posY }

        const res = await updateTablePositions([
            { id: t1.id, posX: 100, posY: 200 },
            { id: t2.id, posX: 300, posY: 400, width: 120, height: 80, rotation: 45 },
        ])
        expect(res.success).toBe(true)

        // Verify
        const updated1 = await prisma.floorTable.findUnique({ where: { id: t1.id } })
        expect(updated1!.posX).toBe(100)
        expect(updated1!.posY).toBe(200)

        const updated2 = await prisma.floorTable.findUnique({ where: { id: t2.id } })
        expect(updated2!.posX).toBe(300)
        expect(updated2!.posY).toBe(400)
        expect(updated2!.width).toBe(120)
        expect(updated2!.height).toBe(80)
        expect(updated2!.rotation).toBe(45)

        // Restore original
        await updateTablePositions([
            { id: t1.id, posX: origPos1.x, posY: origPos1.y },
            { id: t2.id, posX: origPos2.x, posY: origPos2.y, width: 80, height: 80, rotation: 0 },
        ])
    })

    it('U-FP-03: updateTable supports shape + width/height', async () => {
        const tables = await getTables()
        if (tables.length === 0) return

        const t = tables[0]
        const origShape = t.shape

        const res = await updateTable(t.id, { shape: 'circle' })
        expect(res.success).toBe(true)

        const updated = await prisma.floorTable.findUnique({ where: { id: t.id } })
        expect(updated!.shape).toBe('circle')

        // Restore
        await updateTable(t.id, { shape: origShape })
    })
})

describe('Floor Plan — Table Dimensions', () => {
    it('U-FP-04: New tables have default width/height/rotation', async () => {
        const tables = await getTables()
        for (const t of tables) {
            expect(t).toHaveProperty('width')
            expect(t).toHaveProperty('height')
            expect(t).toHaveProperty('rotation')
            expect(t.width).toBeGreaterThan(0)
            expect(t.height).toBeGreaterThan(0)
            expect(t.rotation).toBeGreaterThanOrEqual(0)
            expect(t.rotation).toBeLessThan(360)
        }
    })

    it('U-FP-05: Zone layoutData is nullable', async () => {
        const zones = await getZones()
        for (const z of zones) {
            // layoutData can be null or object
            expect(z.layoutData === null || typeof z.layoutData === 'object').toBe(true)
        }
    })
})
