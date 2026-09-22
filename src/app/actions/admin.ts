'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function requireAdmin() {
  const session = await auth()
  const user = session?.user as any
  if (user?.role !== 'ADMIN') throw new Error('Unauthorized')
  return user.id
}

// ── Shared image validation ───────────────────────────────────────────────────

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5 MB

function validateFileUpload(file: File): void {
  if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
    throw new Error(`Invalid file type "${file.type}". Only JPEG, PNG, and WebP are allowed.`)
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File is too large. Maximum size is 5 MB.')
  }
}

const MAX_BASE64_LENGTH = 7_000_000 // ~5 MB binary after base64 encoding

function validateBase64Image(value: string | undefined): string | undefined {
  if (!value || value === '') return undefined
  if (value.length > MAX_BASE64_LENGTH) throw new Error('Image is too large. Maximum size is 5 MB.')
  if (!value.startsWith('data:image/')) throw new Error('Invalid image format.')
  const mimeMatch = value.match(/^data:(image\/[a-zA-Z+]+);base64,/)
  if (!mimeMatch || !ALLOWED_IMAGE_MIMES.includes(mimeMatch[1])) {
    throw new Error('Image must be a JPEG, PNG, or WebP file.')
  }
  return value
}

// ── ClassType CRUD ────────────────────────────────────────────────────────────

export async function createClassType(formData: FormData) {
  await requireAdmin()

  let imageUrl: string | null = null
  const imageFile = formData.get('imageFile') as File | null

  if (imageFile && imageFile.size > 0) {
    validateFileUpload(imageFile)
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = imageFile.type || 'image/jpeg'
    const base64 = buffer.toString('base64')
    imageUrl = `data:${mimeType};base64,${base64}`
  }

  await prisma.classType.create({
    data: {
      name:        String(formData.get('name')),
      description: formData.get('description') ? String(formData.get('description')) : null,
      imageUrl:    imageUrl,
    },
  })
  revalidatePath('/en/admin/classes')
}

export async function updateClassType(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id'))

  let imageUrl: string | undefined = undefined
  const imageFile = formData.get('imageFile') as File | null

  if (imageFile && imageFile.size > 0) {
    validateFileUpload(imageFile)
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = imageFile.type || 'image/jpeg'
    const base64 = buffer.toString('base64')
    imageUrl = `data:${mimeType};base64,${base64}`
  }

  const data: any = {
    name:        String(formData.get('name')),
    description: formData.get('description') ? String(formData.get('description')) : null,
    isActive:    formData.get('isActive') !== 'false',
  }
  if (imageUrl !== undefined) {
    data.imageUrl = imageUrl
  }

  await prisma.classType.update({
    where: { id },
    data,
  })
  revalidatePath('/en/admin/classes')
}

export async function deleteClassType(id: string) {
  await requireAdmin()
  await prisma.classType.delete({ where: { id } })
  revalidatePath('/en/admin/classes')
}

// ── Class Session CRUD ────────────────────────────────────────────────────────

export async function createSession(formData: FormData) {
  await requireAdmin()

  const dateStr      = String(formData.get('date'))      // "YYYY-MM-DD"
  const startTime    = String(formData.get('startTime')) // "HH:MM"
  const endTime      = String(formData.get('endTime'))
  const classTypeId  = formData.get('classTypeId') ? String(formData.get('classTypeId')) : null
  const instructorId = formData.get('instructorId') ? String(formData.get('instructorId')) : null

  // Build UTC date from Bangkok local date + startTime
  const [year, month, day]  = dateStr.split('-').map(Number)
  const [hour, minute]      = startTime.split(':').map(Number)
  // Bangkok is UTC+7, so subtract 7 hours for UTC storage
  const dateUtc = new Date(Date.UTC(year, month - 1, day, hour - 7, minute))

  const classTypeName = classTypeId
    ? (await prisma.classType.findUnique({ where: { id: classTypeId } }))?.name ?? 'Class'
    : String(formData.get('name') ?? 'Class')

  await prisma.class.create({
    data: {
      name:        classTypeName,
      classTypeId,
      instructorId,
      date:        dateUtc,
      startTime,
      endTime,
      duration:    Number(formData.get('duration') ?? 60),
      capacity:    Number(formData.get('capacity') ?? 6),
      description: formData.get('description') ? String(formData.get('description')) : null,
    },
  })
  revalidatePath('/en/admin/schedule')
  revalidatePath('/')
}

export async function updateSession(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id'))
  const startTime    = String(formData.get('startTime'))
  const instructorId = formData.get('instructorId') ? String(formData.get('instructorId')) : null

  await prisma.class.update({
    where: { id },
    data: {
      name:        String(formData.get('name')),
      startTime,
      endTime:     String(formData.get('endTime')),
      capacity:    Number(formData.get('capacity')),
      duration:    Number(formData.get('duration')),
      instructorId,
      description: formData.get('description') ? String(formData.get('description')) : null,
    },
  })
  revalidatePath('/en/admin/schedule')
  revalidatePath('/')
}

export async function cancelSession(id: string) {
  const adminId = await requireAdmin()
  
  const cls = await prisma.class.findUnique({
    where: { id },
    include: { classType: true, bookings: { where: { status: 'BOOKED' } } }
  })
  
  if (!cls) throw new Error('Class not found')
  if (cls.status === 'CANCELLED') return
  
  // We should also refund passes for all bookings
  const bookings = await prisma.booking.findMany({
    where: { classId: id, status: 'BOOKED' },
    include: { userPass: true, client: true }
  })

  // Mark class and bookings as cancelled
  await prisma.class.update({
    where: { id: id },
    data: { status: 'CANCELLED' }
  })

  await prisma.booking.updateMany({
    where: { classId: id, status: 'BOOKED' },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  })

  const { sendClassCancellationEmail } = await import('@/lib/email')

  for (const b of bookings) {
    if (b.userPassId) {
      await prisma.userPass.update({
        where: { id: b.userPassId },
        data: { remainingCount: { increment: 1 } }
      })
    }
    // Send email
    if (b.client.email) {
      const localDate = new Date(cls.date.getTime() + 7 * 60 * 60 * 1000)
      const dateStr = localDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      })
      sendClassCancellationEmail(
        b.client.email,
        b.client.name,
        cls.name,
        dateStr,
        cls.startTime
      ).catch(console.error)
    }
  }

  revalidatePath('/en/admin/schedule')
  revalidatePath('/')
}

// ── User Management ───────────────────────────────────────────────────────────

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin()
  if (!['CLIENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) {
    throw new Error('Invalid role')
  }
  await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
  })
  revalidatePath('/en/admin/users')
}

export async function updateUserAccess(userId: string, role: string) {
  const session = await auth()
  const adminId = (session?.user as any)?.id
  await requireAdmin()
  if (!['CLIENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) {
    throw new Error('Invalid role')
  }
  // Always update role directly
  await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
  })
  
  revalidatePath('/en/admin/users')
}

// ── Package Schema ─────────────────────────────────────────────────────────────
const PackageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  classCount: z.coerce.number().int().min(1, 'Must be at least 1 class').max(500),
  expiresInDays: z.coerce.number().int().min(1).max(3650).default(180),
  classTypeId: z.string().min(1, 'Class type is required'),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(10_000_000),
})

export async function createPackage(formData: FormData) {
  await requireAdmin()

  const parsed = PackageSchema.safeParse({
    name: formData.get('name'),
    classCount: formData.get('classCount'),
    expiresInDays: formData.get('expiresInDays') || 180,
    classTypeId: formData.get('classTypeId'),
    price: formData.get('price'),
  })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { name, classCount, expiresInDays, classTypeId, price } = parsed.data
  await prisma.package.create({
    data: { name, classCount, expiresInDays, classTypeId, price: Math.round(price * 100) }
  })
  revalidatePath('/en/admin/packages')
}

export async function updatePackage(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id') as string
  if (!id) throw new Error('Package ID is required')

  const parsed = PackageSchema.safeParse({
    name: formData.get('name'),
    classCount: formData.get('classCount'),
    expiresInDays: formData.get('expiresInDays') || 180,
    classTypeId: formData.get('classTypeId'),
    price: formData.get('price'),
  })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const { name, classCount, expiresInDays, classTypeId, price } = parsed.data
  const isActive = formData.get('isActive') === 'on'

  await prisma.package.update({
    where: { id },
    data: { name, classCount, expiresInDays, classTypeId, price: Math.round(price * 100), isActive }
  })
  revalidatePath('/en/admin/packages')
}

export async function deletePackage(id: string) {
  await requireAdmin()
  await prisma.package.delete({ where: { id } })
  revalidatePath('/en/admin/packages')
}

// ── Studio Settings ──────────────────────────────────────────────────────────
export async function saveStudioSettings(data: {
  qrCodeUrl?: string
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  hoursWeekday?: string
  hoursSaturday?: string
  hoursSunday?: string
  instagramUrl?: string
  facebookUrl?: string
  lineUrl?: string
  whatsappUrl?: string
  aboutImage1?: string
  aboutImage2?: string
  aboutImage3?: string
  heroImage?: string
}) {
  await requireAdmin()

  // Validate all base64 image fields
  const validated = {
    ...data,
    qrCodeUrl:   validateBase64Image(data.qrCodeUrl),
    aboutImage1: validateBase64Image(data.aboutImage1),
    aboutImage2: validateBase64Image(data.aboutImage2),
    aboutImage3: validateBase64Image(data.aboutImage3),
    heroImage:   validateBase64Image(data.heroImage),
    // Sanitize text fields
    contactEmail:   data.contactEmail?.substring(0, 200),
    contactPhone:   data.contactPhone?.substring(0, 50),
    contactAddress: data.contactAddress?.substring(0, 500),
    hoursWeekday:   data.hoursWeekday?.substring(0, 100),
    hoursSaturday:  data.hoursSaturday?.substring(0, 100),
    hoursSunday:    data.hoursSunday?.substring(0, 100),
    instagramUrl:   data.instagramUrl?.substring(0, 300),
    facebookUrl:    data.facebookUrl?.substring(0, 300),
    lineUrl:        data.lineUrl?.substring(0, 300),
    whatsappUrl:    data.whatsappUrl?.substring(0, 300),
  }

  await prisma.studioSettings.upsert({
    where: { id: 'default' },
    update: validated,
    create: { id: 'default', ...validated },
  })
}
