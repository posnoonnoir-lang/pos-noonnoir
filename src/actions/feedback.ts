"use server"

import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// ============================================================
// FEEDBACK — V2 Feature 5 — Prisma version
// ============================================================

export type FeedbackRating = 1 | 2 | 3 | 4 | 5

export type FeedbackItemInput = {
    orderItemId: string; productName: string; rating: FeedbackRating; comment?: string
}

export type FeedbackSessionData = {
    id: string; orderId: string; orderNumber: string; sessionToken: string
    items: FeedbackItemInput[]; overallRating: FeedbackRating | null; overallComment: string | null
    visitRating: FeedbackRating | null; serviceRating: FeedbackRating | null; ambienceRating: FeedbackRating | null
    createdAt: string; isCompleted: boolean
}

export async function createFeedbackSession(
    orderId: string, orderNumber: string,
    orderItems: { id: string; productName: string }[]
): Promise<{ sessionToken: string; feedbackUrl: string }> {
    const token = `fb-${crypto.randomBytes(6).toString("hex")}`

    const session = await prisma.feedbackSession.create({
        data: {
            orderId, orderNo: orderNumber, token, expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
            items: {
                create: orderItems.map((i) => ({
                    productId: i.id, productName: i.productName,
                })),
            },
        },
    })

    return { sessionToken: session.token, feedbackUrl: `/feedback/${session.token}` }
}

export async function getFeedbackSession(token: string): Promise<FeedbackSessionData | null> {
    const session = await prisma.feedbackSession.findUnique({
        where: { token }, include: { items: true },
    })
    if (!session || !session.isActive || session.expiresAt < new Date()) return null

    const isCompleted = session.items.some((i) => i.rating !== null)
    return {
        id: session.id, orderId: session.orderId, orderNumber: session.orderNo,
        sessionToken: session.token,
        items: session.items.map((i) => ({
            orderItemId: i.productId, productName: i.productName,
            rating: (i.rating ?? 0) as FeedbackRating, comment: i.comment ?? undefined,
        })),
        overallRating: null, overallComment: null,
        visitRating: null, serviceRating: null, ambienceRating: null,
        createdAt: session.createdAt.toISOString(), isCompleted,
    }
}

export async function submitFeedback(
    token: string,
    data: {
        items: FeedbackItemInput[]; visitRating: FeedbackRating; serviceRating: FeedbackRating
        ambienceRating: FeedbackRating; overallRating: FeedbackRating; overallComment: string
    }
): Promise<{ success: boolean }> {
    const session = await prisma.feedbackSession.findUnique({ where: { token }, include: { items: true } })
    if (!session) return { success: false }

    for (const item of data.items) {
        const dbItem = session.items.find((i) => i.productId === item.orderItemId)
        if (dbItem) {
            await prisma.feedbackItem.update({
                where: { id: dbItem.id },
                data: { rating: item.rating, comment: item.comment ?? null, submittedAt: new Date() },
            })
        }
    }

    await prisma.feedbackSession.update({ where: { token }, data: { isActive: false } })
    return { success: true }
}

export async function getAllFeedback(): Promise<{
    sessions: {
        id: string; orderNumber: string; overallRating: number; serviceRating: number
        visitRating: number; ambienceRating: number; overallComment: string | null; createdAt: string
        items: { productName: string; rating: number; comment: string | null }[]
    }[]
    stats: { total: number; avgOverall: number; avgService: number; avgVisit: number; avgAmbience: number; distribution: Record<number, number> }
}> {
    const rows = await prisma.feedbackSession.findMany({
        where: { isActive: false },
        include: { items: { where: { rating: { not: null } } } },
        orderBy: { createdAt: "desc" },
        take: 50,
    })

    const sessions = rows.map((s) => {
        const ratings = s.items.filter((i) => i.rating !== null).map((i) => i.rating!)
        const avg = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10 : 0
        return {
            id: s.id, orderNumber: s.orderNo, overallRating: avg,
            serviceRating: avg, visitRating: avg, ambienceRating: avg,
            overallComment: s.items[0]?.comment ?? null, createdAt: s.createdAt.toISOString(),
            items: s.items.map((i) => ({ productName: i.productName, rating: i.rating ?? 0, comment: i.comment })),
        }
    })

    const total = sessions.length
    const avgOverall = total > 0 ? Math.round(sessions.reduce((s, x) => s + x.overallRating, 0) / total * 10) / 10 : 0
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    sessions.forEach((s) => { const r = Math.round(s.overallRating); if (r >= 1 && r <= 5) distribution[r]++ })

    return {
        sessions,
        stats: { total, avgOverall, avgService: avgOverall, avgVisit: avgOverall, avgAmbience: avgOverall, distribution },
    }
}
