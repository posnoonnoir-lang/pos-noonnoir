import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const p = new PrismaClient()
p.$connect()
    .then(() => { console.log("✅ Connected to DB!"); return p.$disconnect() })
    .catch((e: Error) => { console.error("❌ Error:", e.message); return p.$disconnect() })
