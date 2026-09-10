'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { adminAdjustCredits } from '@/lib/credits'

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role !== 'ADMIN') throw new Error('Unauthorized')
}

// ── ClassType CRUD ────────────────────────────────────────────────────────────

export async function createClassType(formData: FormData) {
  await requireAdmin()

  let imageUrl: string | null = null
  const imageFile = formData.get('imageFile') as File | null

  if (imageFile && imageFile.size > 0) {
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
      creditCost:  parseInt(String(formData.get('creditCost') || '1'), 10),
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
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = imageFile.type || 'image/jpeg'
    const base64 = buffer.toString('base64')
    imageUrl = `data:${mimeType};base64,${base64}`
  }

  const data: any = {
    name:        String(formData.get('name')),
    description: formData.get('description') ? String(formData.get('description')) : null,
    creditCost:  parseInt(String(formData.get('creditCost') || '1'), 10),
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
  await requireAdmin()
  // Cancel the class and refund all active bookings
  const bookings = await prisma.booking.findMany({
    where: { classId: id, status: 'BOOKED' },
  })

  await prisma.$transaction([
    prisma.class.update({ where: { id }, data: { status: 'CANCELLED' } }),
    // Refund credits to all booked clients
    ...bookings.map(b =>
      prisma.user.update({
        where: { id: b.clientId },
        data: { credits: { increment: 1 } },
      })
    ),
    // Mark all bookings as cancelled
    prisma.booking.updateMany({
      where: { classId: id, status: 'BOOKED' },
      data: { status: 'CANCELLED', creditRefunded: true, cancelledAt: new Date() },
    }),
  ])

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

export async function updateUserAccess(userId: string, role: string, delta: number, reason: string) {
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
  // Only adjust credits if a delta was specified
  if (delta !== 0) {
    await adminAdjustCredits({ userId, delta, reason: reason || 'Admin adjustment', adminId })
  }
  revalidatePath('/', 'layout')
}

export async function createPackage(formData: FormData) {
  await requireAdmin()
  const name = formData.get('name') as string
  const credits = parseInt(formData.get('credits') as string, 10)
  const price = parseFloat(formData.get('price') as string) * 100 // Convert THB to Satang

  await prisma.package.create({
    data: { name, credits, price: Math.round(price) }
  })
  revalidatePath('/', 'layout')
}

export async function updatePackage(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const credits = parseInt(formData.get('credits') as string, 10)
  const price = parseFloat(formData.get('price') as string) * 100 // Convert THB to Satang
  const isActive = formData.get('isActive') === 'on'

  await prisma.package.update({
    where: { id },
    data: { name, credits, price: Math.round(price), isActive }
  })
  revalidatePath('/', 'layout')
}

export async function deletePackage(id: string) {
  await requireAdmin()
  await prisma.package.delete({ where: { id } })
  revalidatePath('/', 'layout')
}
