/**
 * Seed script — creates the admin user, official class types, and package pricing from flyer.
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
  console.log('🌱 Seeding Anya Pilates database from Price List flyer...\n')

  // ── 1. Admin user ───────────────────────────────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    ?? 'admin@anyapilates.com'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@Anya2026!'

  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.upsert({
    where:  { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      email:    adminEmail,
      name:     'Anya Admin',
      password: hashedPassword,
      role:     'ADMIN',
    },
  })

  console.log(`✅ Admin user ready: ${adminEmail}\n`)

  // ── 2. Official Class Types (from flyer) ───────────────────────────────────
  // Group Class (up to 3 persons, 50 min)
  // Duo Class (2 persons, 50 min)
  // Private Class (1-on-1, 50 min)
  const classTypesDefs = [
    {
      name: 'Group Class',
      description: 'Small group of up to 3 — Reformer-based Pilates designed for mindful alignment and personalized coaching (50 min).',
    },
    {
      name: 'Duo Class',
      description: 'Semi-private session for 2 persons — workout alongside a partner with tailored guidance on Reformers (50 min).',
    },
    {
      name: 'Private Class',
      description: 'One-on-one Reformer Pilates tailored exclusively to your personal fitness goals and body mechanics (50 min).',
    },
  ]

  const classTypeMap: Record<string, string> = {}

  for (const ct of classTypesDefs) {
    let record = await prisma.classType.findFirst({ where: { name: ct.name } })
    if (!record) {
      // Check if old placeholder name exists to rename
      if (ct.name === 'Group Class') {
        const oldGroup = await prisma.classType.findFirst({ where: { name: 'Group Reformer' } })
        if (oldGroup) {
          record = await prisma.classType.update({ where: { id: oldGroup.id }, data: ct })
          console.log(`🔄 Updated existing 'Group Reformer' -> 'Group Class'`)
        }
      } else if (ct.name === 'Private Class') {
        const oldPrivate = await prisma.classType.findFirst({ where: { name: 'Private Session' } })
        if (oldPrivate) {
          record = await prisma.classType.update({ where: { id: oldPrivate.id }, data: ct })
          console.log(`🔄 Updated existing 'Private Session' -> 'Private Class'`)
        }
      }
    }

    if (!record) {
      record = await prisma.classType.create({ data: ct })
      console.log(`✅ Class type created: ${ct.name}`)
    } else {
      console.log(`⏭  Class type ready: ${record.name}`)
    }

    classTypeMap[ct.name] = record.id
  }

  // ── 3. Packages from Price List flyer ──────────────────────────────────────
  // Note: 50 Group Session is EXCLUDED per client instructions ("Ignore only the 50 group session")
  const packagesList = [
    // ── INTRODUCTORY PACKAGES (Valid for 15 Days) ──
    {
      name: 'Group Intro (2 Classes)',
      classTypeName: 'Group Class',
      classCount: 2,
      price: 790 * 100, // 790 THB
      expiresInDays: 15,
    },
    {
      name: 'Duo Intro (2 Classes)',
      classTypeName: 'Duo Class',
      classCount: 2,
      price: 990 * 100, // 990 THB
      expiresInDays: 15,
    },
    {
      name: 'Private Intro (2 Classes)',
      classTypeName: 'Private Class',
      classCount: 2,
      price: 1290 * 100, // 1,290 THB
      expiresInDays: 15,
    },

    // ── SINGLE CLASS (Drop-In Rate from flyer CLASS header) ──
    {
      name: 'Group (Single Class)',
      classTypeName: 'Group Class',
      classCount: 1,
      price: 550 * 100, // 550 THB
      expiresInDays: 30,
    },
    {
      name: 'Duo (Single Class)',
      classTypeName: 'Duo Class',
      classCount: 1,
      price: 650 * 100, // 650 THB
      expiresInDays: 30,
    },
    {
      name: 'Private (Single Class)',
      classTypeName: 'Private Class',
      classCount: 1,
      price: 800 * 100, // 800 THB
      expiresInDays: 30,
    },

    // ── GROUP PACKAGES ──
    {
      name: 'Group (4 Classes)',
      classTypeName: 'Group Class',
      classCount: 4,
      price: 2000 * 100, // 2,000 THB (500 THB/class)
      expiresInDays: 30,
    },
    {
      name: 'Group (8 Classes)',
      classTypeName: 'Group Class',
      classCount: 8,
      price: 3800 * 100, // 3,800 THB (475 THB/class)
      expiresInDays: 45,
    },
    {
      name: 'Group (12 Classes)',
      classTypeName: 'Group Class',
      classCount: 12,
      price: 5400 * 100, // 5,400 THB (450 THB/class)
      expiresInDays: 60,
    },
    {
      name: 'Group (50 Classes)',
      classTypeName: 'Group Class',
      classCount: 50,
      price: 20000 * 100, // 20,000 THB (400 THB/class)
      expiresInDays: 365, // 1 Year
    },

    // ── DUO PACKAGES ──
    {
      name: 'Duo (4 Classes)',
      classTypeName: 'Duo Class',
      classCount: 4,
      price: 2400 * 100, // 2,400 THB (600 THB/class)
      expiresInDays: 30,
    },
    {
      name: 'Duo (8 Classes)',
      classTypeName: 'Duo Class',
      classCount: 8,
      price: 4600 * 100, // 4,600 THB (575 THB/class)
      expiresInDays: 45,
    },
    {
      name: 'Duo (12 Classes)',
      classTypeName: 'Duo Class',
      classCount: 12,
      price: 6600 * 100, // 6,600 THB (550 THB/class)
      expiresInDays: 60,
    },

    // ── PRIVATE PACKAGES ──
    {
      name: 'Private (4 Classes)',
      classTypeName: 'Private Class',
      classCount: 4,
      price: 3000 * 100, // 3,000 THB (750 THB/class)
      expiresInDays: 30,
    },
    {
      name: 'Private (8 Classes)',
      classTypeName: 'Private Class',
      classCount: 8,
      price: 5600 * 100, // 5,600 THB (700 THB/class)
      expiresInDays: 45,
    },
    {
      name: 'Private (12 Classes)',
      classTypeName: 'Private Class',
      classCount: 12,
      price: 7800 * 100, // 7,800 THB (650 THB/class)
      expiresInDays: 60,
    },
  ]

  console.log('\n📦 Seeding Packages...')
  for (const pkg of packagesList) {
    const classTypeId = classTypeMap[pkg.classTypeName]
    if (!classTypeId) {
      console.warn(`⚠️ Missing ClassType for ${pkg.classTypeName}`)
      continue
    }

    const exists = await prisma.package.findFirst({
      where: { name: pkg.name, classTypeId },
    })

    if (!exists) {
      await prisma.package.create({
        data: {
          name: pkg.name,
          classTypeId,
          classCount: pkg.classCount,
          price: pkg.price,
          expiresInDays: pkg.expiresInDays,
          isActive: true,
        },
      })
      console.log(`✅ Package created: ${pkg.name} (฿${pkg.price / 100}, ${pkg.expiresInDays}d)`)
    } else {
      await prisma.package.update({
        where: { id: exists.id },
        data: {
          classCount: pkg.classCount,
          price: pkg.price,
          expiresInDays: pkg.expiresInDays,
          isActive: true,
        }
      })
      console.log(`🔄 Package updated: ${pkg.name}`)
    }
  }

  console.log('\n🎉 Database successfully seeded with official flyer pricing!')
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(async () => { await pool.end(); process.exit(0) })
