import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const connectionString = process.env.DATABASE_URL!

const pool = new pg.Pool({
    connectionString,
    max: 3,                        // keep low — PgBouncer handles real pooling
    idleTimeoutMillis: 10000,      // release idle connections quickly
    connectionTimeoutMillis: 10000,
})

const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
