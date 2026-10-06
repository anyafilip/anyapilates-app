import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.class.count()
  console.log('Total classes:', count)

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
  console.timeEnd('fetch 14 days')
  console.log('Classes found:', classes.length)
}

main().catch(console.error).finally(() => prisma.$disconnect())
