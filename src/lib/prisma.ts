import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const connectionString = process.env.DATABASE_URL!

const pool = new pg.Pool({
    connectionString,
    max: 10,                       // Supabase supports up to 15 on free tier
    idleTimeoutMillis: 30000,      // keep connections alive longer to avoid cold starts
    connectionTimeoutMillis: 10000,
})

const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
    prismaWarmed: boolean | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
else globalForPrisma.prisma = prisma // cache in production too (Vercel)

// Warm up connection pool on first import — avoids 500ms-1s cold start penalty
if (!globalForPrisma.prismaWarmed) {
    globalForPrisma.prismaWarmed = true
    pool.connect().then(client => {
        client.release()
        console.log("[Prisma] Connection pool warmed up")
    }).catch(err => {
        console.warn("[Prisma] Warm-up failed:", err.message)
    })
}
