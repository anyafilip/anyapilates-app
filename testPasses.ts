import { prisma } from './src/lib/prisma'

async function main() {
  const passes = await prisma.userPass.findMany()
  console.log(passes.map(p => ({
    id: p.id,
    orig: p.originalCount,
    rem: p.remainingCount,
    created: p.createdAt,
    expires: p.expiresAt,
    activated: p.activatedAt,
    validity: p.validityDays
  })))
}
main()
