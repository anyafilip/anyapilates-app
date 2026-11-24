/**
 * Daily cron script to send expiration reminder emails for passes expiring within 1 week.
 *
 * Usage:
 *   npx tsx scripts/check-pass-expiration-cron.ts
 */

import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { checkAndSendPassExpirationReminders } from '../src/lib/pass-expiration'

async function main() {
  console.log(`[${new Date().toISOString()}] Starting pass expiration check (1 week warning)...`)
  const result = await checkAndSendPassExpirationReminders()
  console.log(`[${new Date().toISOString()}] Expiration check complete. Found ${result.totalChecked} expiring pass(es), sent ${result.sentCount} email(s).`)
  if (result.errors.length > 0) {
    console.error(`[${new Date().toISOString()}] Errors encountered:`, result.errors)
  }
  process.exit(0)
}

main().catch(err => {
  console.error(`[${new Date().toISOString()}] Expiration cron error:`, err)
  process.exit(1)
})
