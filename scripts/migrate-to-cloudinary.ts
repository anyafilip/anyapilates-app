import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

import { v2 as cloudinary } from 'cloudinary'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
let apiKey = process.env.CLOUDINARY_API_KEY
let apiSecret = process.env.CLOUDINARY_API_SECRET

if (process.env.CLOUDINARY_URL) {
  try {
    const uri = new URL(process.env.CLOUDINARY_URL)
    cloudName = uri.hostname
    apiKey = uri.username
    apiSecret = uri.password
  } catch (e: any) {
    console.error('Failed to parse CLOUDINARY_URL:', e.message)
  }
}

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Missing Cloudinary credentials in .env!')
  process.exit(1)
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
})

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 Starting safe Cloudinary migration...')
  console.log(`📡 Cloud Name: ${cloudName}`)

  // 1. Verify Cloudinary connectivity
  try {
    const ping = await cloudinary.api.ping()
    console.log('✅ Cloudinary connection verified successfully:', ping)
  } catch (err: any) {
    console.error('❌ Cloudinary connection failed:', err.message)
    process.exit(1)
  }

  // 2. Fetch all images to migrate
  console.log('\n📥 Fetching all images from database...')
  const classTypes = await prisma.classType.findMany({
    where: { imageUrl: { not: null } },
    select: { id: true, name: true, imageUrl: true },
  })
  const users = await prisma.user.findMany({
    where: { imageUrl: { not: null } },
    select: { id: true, name: true, role: true, imageUrl: true },
  })
  const payments = await prisma.payment.findMany({
    where: { slipUrl: { not: null } },
    select: { id: true, refCode: true, clientId: true, status: true, slipUrl: true },
  })

  console.log(`Found:
  - ${classTypes.length} Class Types with images
  - ${users.length} Users/Instructors with images
  - ${payments.length} Payments with slips`)

  // 3. CREATE FULL BACKUP FILE BEFORE MODIFYING ANYTHING
  const backupDir = path.join(process.cwd(), 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(backupDir, `images-backup-${timestamp}.json`)

  const backupData = {
    createdAt: new Date().toISOString(),
    totalClassTypes: classTypes.length,
    totalUsers: users.length,
    totalPayments: payments.length,
    classTypes,
    users,
    payments,
  }

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8')
  console.log(`\n🛡️  FAIL-SAFE BACKUP CREATED AT: ${backupPath}`)
  console.log(`   (File size: ${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB)`)

  // 4. Migrate Class Types
  console.log('\n--- Migrating Class Types ---')
  for (const ct of classTypes) {
    if (!ct.imageUrl || ct.imageUrl.startsWith('http')) {
      console.log(`⏩ ClassType "${ct.name}" (${ct.id}) already on URL, skipping.`)
      continue
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(ct.imageUrl, {
        folder: 'pilates/classes',
        public_id: `class_${ct.id}`,
        format: 'webp',
        quality: 'auto:good',
      })

      if (!uploadRes.secure_url) {
        throw new Error('No secure_url returned by Cloudinary')
      }

      await prisma.classType.update({
        where: { id: ct.id },
        data: { imageUrl: uploadRes.secure_url },
      })
      console.log(`✅ ClassType "${ct.name}" migrated -> ${uploadRes.secure_url}`)
    } catch (e: any) {
      console.error(`❌ Failed to migrate ClassType "${ct.name}":`, e.message)
    }
  }

  // 5. Migrate Users / Instructors
  console.log('\n--- Migrating Users/Instructors ---')
  for (const u of users) {
    if (!u.imageUrl || u.imageUrl.startsWith('http')) {
      console.log(`⏩ User "${u.name}" (${u.id}) already on URL, skipping.`)
      continue
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(u.imageUrl, {
        folder: 'pilates/users',
        public_id: `user_${u.id}`,
        format: 'webp',
        quality: 'auto:good',
      })

      if (!uploadRes.secure_url) {
        throw new Error('No secure_url returned by Cloudinary')
      }

      await prisma.user.update({
        where: { id: u.id },
        data: { imageUrl: uploadRes.secure_url },
      })
      console.log(`✅ User "${u.name}" migrated -> ${uploadRes.secure_url}`)
    } catch (e: any) {
      console.error(`❌ Failed to migrate User "${u.name}":`, e.message)
    }
  }

  // 6. Migrate Payment Slips
  console.log('\n--- Migrating Payment Slips ---')
  let slipsMigrated = 0
  let slipsFailed = 0

  for (const p of payments) {
    if (!p.slipUrl || p.slipUrl.startsWith('http')) {
      console.log(`⏩ Slip [${p.refCode}] already on URL, skipping.`)
      continue
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(p.slipUrl, {
        folder: 'pilates/slips',
        public_id: `slip_${p.refCode || p.id}`,
        format: 'webp',
        quality: 'auto:good',
      })

      if (!uploadRes.secure_url) {
        throw new Error('No secure_url returned by Cloudinary')
      }

      await prisma.payment.update({
        where: { id: p.id },
        data: { slipUrl: uploadRes.secure_url },
      })
      slipsMigrated++
      console.log(`✅ Slip [${p.refCode || p.id}] migrated (${slipsMigrated}/${payments.length}) -> ${uploadRes.secure_url}`)
    } catch (e: any) {
      slipsFailed++
      console.error(`❌ Failed to migrate Slip [${p.refCode || p.id}]:`, e.message)
    }
  }

  console.log('\n========================================')
  console.log('🎉 Migration Finished!')
  console.log(`Slips Migrated: ${slipsMigrated}, Failed: ${slipsFailed}`)
  console.log(`Backup kept safe at: ${backupPath}`)
  console.log('========================================\n')
}

main()
  .catch((e) => {
    console.error('Fatal error in migration:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
