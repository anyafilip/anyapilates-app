import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.time('fetch classes')
  const count = await prisma.class.count()
  console.log('Total classes in DB:', count)
  console.timeEnd('fetch classes')

  console.time('fetch 14 days')
  const now = new Date()
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const classes = await prisma.class.findMany({
    where: {
      status: 'SCHEDULED',
      date: { gte: now, lte: twoWeeksFromNow },
    },
    include: {
      classType: true,
      instructor: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
  })
  console.log('Classes next 14 days:', classes.length)
  console.timeEnd('fetch 14 days')
  
  console.time('fetch ALL FUTURE classes')
  const allFuture = await prisma.class.findMany({
    where: {
      status: 'SCHEDULED',
      date: { gte: now },
    },
    include: {
      classType: true,
      instructor: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
  })
  console.log('All future classes:', allFuture.length)
  console.timeEnd('fetch ALL FUTURE classes')
}

main().catch(console.error).finally(() => prisma.$disconnect())
