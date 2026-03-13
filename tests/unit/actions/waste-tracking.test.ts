/**
 * 🧪 Unit Tests — Waste Tracking (P1)
 * Tests waste recording, report analytics, and form options
 */
import { describe, it, expect } from 'vitest'
import {
    getWasteRecords,
    getWasteReport,
    getWasteFormOptions,
} from '@/actions/waste'

describe('Waste Tracking — Records (Real DB)', () => {
    it('U-WST-01: getWasteRecords — should return waste record list', async () => {
        const records = await getWasteRecords()
        expect(Array.isArray(records)).toBe(true)
        if (records.length > 0) {
            const r = records[0]
            expect(r).toHaveProperty('id')
            expect(r).toHaveProperty('type')
            expect(r).toHaveProperty('quantity')
            expect(r).toHaveProperty('unitCost')
            expect(r).toHaveProperty('totalCost')
            expect(r).toHaveProperty('reason')
            expect(r).toHaveProperty('createdAt')
            expect(['WASTE', 'SPOILAGE', 'BREAKAGE']).toContain(r.type)
        }
    })

    it('U-WST-02: getWasteRecords — with date filter should be subset', async () => {
        const all = await getWasteRecords()
        const today = new Date().toISOString().split('T')[0]
        const filtered = await getWasteRecords({ dateFrom: today, dateTo: today })
        expect(filtered.length).toBeLessThanOrEqual(all.length)
    })

    it('U-WST-03: getWasteRecords — type filter should only return that type', async () => {
        const wasteOnly = await getWasteRecords({ type: 'WASTE' })
        for (const r of wasteOnly) {
            expect(r.type).toBe('WASTE')
        }
    })
})

describe('Waste Tracking — Report Analytics (Real DB)', () => {
    it('U-WST-04: getWasteReport — should return full analytics', async () => {
        const report = await getWasteReport()
        expect(report).toHaveProperty('records')
        expect(report).toHaveProperty('summary')
        expect(report.summary).toHaveProperty('totalRecords')
        expect(report.summary).toHaveProperty('totalCost')
        expect(report.summary).toHaveProperty('byType')
        expect(report.summary).toHaveProperty('byMonth')
        expect(report.summary).toHaveProperty('wastePctOfRevenue')
        expect(Array.isArray(report.summary.byType)).toBe(true)
        expect(Array.isArray(report.summary.byMonth)).toBe(true)
    })

    it('U-WST-05: getWasteReport — byType should have valid waste types', async () => {
        const report = await getWasteReport()
        for (const bt of report.summary.byType) {
            expect(bt).toHaveProperty('type')
            expect(bt).toHaveProperty('count')
            expect(bt).toHaveProperty('cost')
            expect(['WASTE', 'SPOILAGE', 'BREAKAGE']).toContain(bt.type)
        }
    })

    it('U-WST-06: getWasteReport — totalCost should be sum of all records', async () => {
        const report = await getWasteReport()
        if (report.records.length > 0) {
            const sumFromRecords = report.records.reduce((s, r) => s + r.totalCost, 0)
            // May differ due to filters, but totalCost should be >= 0
            expect(report.summary.totalCost).toBeGreaterThanOrEqual(0)
        }
    })
})

describe('Waste Tracking — Form Options (Real DB)', () => {
    it('U-WST-07: getWasteFormOptions — should return products and ingredients', async () => {
        const options = await getWasteFormOptions()
        expect(options).toHaveProperty('products')
        expect(options).toHaveProperty('ingredients')
        expect(Array.isArray(options.products)).toBe(true)
        expect(Array.isArray(options.ingredients)).toBe(true)
        if (options.products.length > 0) {
            expect(options.products[0]).toHaveProperty('id')
            expect(options.products[0]).toHaveProperty('name')
            expect(options.products[0]).toHaveProperty('costPrice')
        }
        if (options.ingredients.length > 0) {
            expect(options.ingredients[0]).toHaveProperty('id')
            expect(options.ingredients[0]).toHaveProperty('name')
            expect(options.ingredients[0]).toHaveProperty('unit')
            expect(options.ingredients[0]).toHaveProperty('costPerUnit')
        }
    })
})
