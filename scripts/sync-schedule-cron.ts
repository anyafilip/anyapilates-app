/**
 * Nightly cron script to top-up future recurring classes up to 8 weeks.
 * Run directly via node/tsx without requiring a logged-in web session.
 *
 * Usage:
 *   npx tsx scripts/sync-schedule-cron.ts
 */

import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { runScheduleSync } from '../src/lib/schedule-generator'

async function main() {
  console.log(`[${new Date().toISOString()}] Starting nightly schedule sync (8 weeks ahead)...`)
  const count = await runScheduleSync(8)
  console.log(`[${new Date().toISOString()}] Schedule sync complete. Created/reactivated ${count} sessions.`)
  process.exit(0)
}

main().catch(err => {
  console.error(`[${new Date().toISOString()}] Schedule sync error:`, err)
  process.exit(1)
})
