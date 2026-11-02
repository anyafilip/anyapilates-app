import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  pool?: Pool
}

let connectionString = process.env.DATABASE_URL || ""

// Ensure Supabase connection uses port 6543 (transaction pooler) if connecting via pooler.supabase.com
if (connectionString.includes("pooler.supabase.com:5432")) {
  connectionString = connectionString.replace(":5432", ":6543")
  if (!connectionString.includes("pgbouncer=true")) {
    connectionString += (connectionString.includes("?") ? "&" : "?") + "pgbouncer=true"
  }
}

// Reuse the pool across Next.js Turbopack / HMR module evaluations to prevent connection exhaustion
export const pool =
  globalForPrisma.pool ||
  new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  })

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}
