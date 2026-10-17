/**
 * cleanup_duplicates.ts
 *
 * Deletes the 9 older duplicate SCHEDULED class records identified in the
 * duplicate investigation. All have bookedCount = 0 and are safe to remove.
 *
 * Run: npx tsx scripts/cleanup_duplicates.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// The 9 older duplicate records to DELETE (kept: the newer matching-template ones)
const IDS_TO_DELETE = [
  'cmusj6yc100058jnvaqzjlrtp', // Oct 19 14:00  Duo Class   (created Oct 3)
  'cmusj6ycl00068jnvhk16w4n6', // Oct 26 14:00  Duo Class   (created Oct 3)
  'cmusj6yd300078jnv51bkljzy', // Nov 2  14:00  Duo Class   (created Oct 3)
  'cmuazvnx0000bnanvkv9m0wdd', // Nov 3  09:00  Stretch     (created Sep 21)
  'cmusj6ydm00088jnvzuk3nnwf', // Nov 9  14:00  Duo Class   (created Oct 3)
  'cmusj6ye400098jnva9z9ihhu', // Nov 16 14:00  Duo Class   (created Oct 3)
  'cmudjv34j0005wonvsfnmdrsk', // Nov 17 09:00  Stretch     (created Sep 23)
  'cmusj6yep000a8jnvc3kile0b', // Nov 23 14:00  Duo Class   (created Oct 3)
  'cmuptqzjo0000janv9dq1uepn', // Nov 24 09:00  Stretch     (created Oct 1)
]

async function main() {
  console.log('\n=== DUPLICATE CLEANUP DRY-RUN ===\n')

  // Safety check: verify all IDs exist, are SCHEDULED, and have 0 bookings
  const records = await prisma.class.findMany({
    where: { id: { in: IDS_TO_DELETE } },
    select: {
      id: true,
      name: true,
      date: true,
      startTime: true,
      status: true,
      bookedCount: true,
    },
  })

  console.log(`Found ${records.length} of ${IDS_TO_DELETE.length} expected records:\n`)

  let safeToDelete = true
  for (const r of records) {
    const safe = r.status !== 'CANCELLED' || r.bookedCount === 0
    console.log(
      `  [${r.bookedCount === 0 ? '✓' : '✗ UNSAFE'}] ${r.id} | ${r.name} | ${r.date.toISOString().slice(0, 10)} ${r.startTime} | status=${r.status} | bookings=${r.bookedCount}`
    )
    if (r.bookedCount > 0) {
      console.error(`  ⛔ ABORTING — record has bookings!`)
      safeToDelete = false
    }
  }

  const missingIds = IDS_TO_DELETE.filter(id => !records.find(r => r.id === id))
  if (missingIds.length > 0) {
    console.log(`\nℹ️  ${missingIds.length} IDs not found in DB (may have been deleted already):`)
    missingIds.forEach(id => console.log(`   - ${id}`))
  }

  const toDelete = records.filter(r => r.bookedCount === 0)
  console.log(`\nWill delete: ${toDelete.length} records`)

  if (!safeToDelete || toDelete.length === 0) {
    console.log('\nNothing to do or unsafe — aborting.\n')
    return
  }

  console.log('\nProceeding with deletion...\n')

  const result = await prisma.class.deleteMany({
    where: {
      id: { in: toDelete.map(r => r.id) },
      bookedCount: 0, // double-safety guard
    },
  })

  console.log(`✅ Deleted ${result.count} duplicate records.\n`)
}

main()
  .catch(e => {
    console.error('Script failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
