/**
 * 🧪 Unit Tests — Feedback System (P2)
 * Tests feedback session CRUD and dashboard aggregation
 */
import { describe, it, expect } from 'vitest'
import {
    getFeedbackSession,
    getAllFeedback,
} from '@/actions/feedback'

describe('Feedback — Sessions (Real DB)', () => {
    it('U-FB-01: getFeedbackSession — invalid token should return null', async () => {
        const session = await getFeedbackSession('invalid-token-xxx')
        expect(session).toBeNull()
    })

    it('U-FB-02: getAllFeedback — should return sessions and stats', async () => {
        const feedback = await getAllFeedback()
        expect(feedback).toHaveProperty('sessions')
        expect(feedback).toHaveProperty('stats')
        expect(Array.isArray(feedback.sessions)).toBe(true)
        expect(feedback.stats).toHaveProperty('total')
        expect(feedback.stats).toHaveProperty('avgOverall')
        expect(feedback.stats).toHaveProperty('avgService')
        expect(feedback.stats).toHaveProperty('avgVisit')
        expect(feedback.stats).toHaveProperty('avgAmbience')
        expect(feedback.stats).toHaveProperty('distribution')
    })

    it('U-FB-03: getAllFeedback — stats.distribution should have keys 1-5', async () => {
        const feedback = await getAllFeedback()
        const dist = feedback.stats.distribution
        expect(dist).toHaveProperty('1')
        expect(dist).toHaveProperty('2')
        expect(dist).toHaveProperty('3')
        expect(dist).toHaveProperty('4')
        expect(dist).toHaveProperty('5')
    })

    it('U-FB-04: getAllFeedback — sessions should have required fields', async () => {
        const feedback = await getAllFeedback()
        for (const s of feedback.sessions) {
            expect(s).toHaveProperty('id')
            expect(s).toHaveProperty('orderNumber')
            expect(s).toHaveProperty('overallRating')
            expect(s).toHaveProperty('items')
            expect(Array.isArray(s.items)).toBe(true)
        }
    })
})
