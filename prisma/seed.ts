/**
 * Seed script — creates the admin user and default class types.
 * Run once with: npx tsx prisma/seed.ts
 */
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'

dotenv.config()

// Use the direct connection URL for seeding
const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
})
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Seeding database...\n')

  // ── Admin user ─────────────────────────────────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    ?? 'admin@anyapilates.com'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@Anya2026!'

  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.upsert({
    where:  { email: adminEmail },
    update: { role: 'ADMIN' },   // If already exists, just promote to admin
    create: {
      email:    adminEmail,
      name:     'Anya Admin',
      password: hashedPassword,
      role:     'ADMIN',
      credits:  0,
    },
  })

  console.log(`✅ Admin user ready:`)
  console.log(`   Email:    ${adminEmail}`)
  console.log(`   Password: ${adminPassword}`)
  console.log(`   Role:     ${admin.role}\n`)

  // ── Default class types ────────────────────────────────────────────────────
  const defaultTypes = [
    { name: 'Group Reformer',  description: 'Small group of up to 6 — Reformer-based Pilates.' },
    { name: 'Private Session', description: 'One-on-one Reformer Pilates tailored to you.'     },
  ]

  for (const ct of defaultTypes) {
    const exists = await prisma.classType.findFirst({ where: { name: ct.name } })
    if (!exists) {
      await prisma.classType.create({ data: ct })
      console.log(`✅ Class type created: ${ct.name}`)
    } else {
      console.log(`⏭  Class type already exists: ${ct.name}`)
    }
  }

  console.log('\n🎉 Seeding complete.')
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(async () => { await pool.end(); process.exit(0) })
