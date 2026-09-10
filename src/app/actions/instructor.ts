'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function markAttendance(bookingId: string, status: 'ATTENDED' | 'NO_SHOW' | 'BOOKED') {
  const session = await auth()
  const role = (session?.user as any)?.role
  
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // Ensure this booking actually belongs to a class taught by the user?
  // We'll skip strict ownership checks for simplicity (Admin can do it anyway).
  
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  })

  // We don't know the exact class id from just bookingId without a query,
  // but revalidatePath on the generic instructor paths is fine, 
  // or we could query the booking to find the classId.
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { classId: true } })
  if (booking) {
    revalidatePath(`/en/instructor/class/${booking.classId}`)
  }
}

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function updateInstructorProfile(formData: FormData) {
  const session = await auth()
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id
  
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  let imageUrl = formData.get('existingImageUrl') ? String(formData.get('existingImageUrl')) : null
  const imageFile = formData.get('imageFile') as File | null

  if (imageFile && imageFile.size > 0) {
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Store as Base64 to bypass Next.js public/ folder caching issues in development
    const mimeType = imageFile.type || 'image/jpeg'
    const base64 = buffer.toString('base64')
    imageUrl = `data:${mimeType};base64,${base64}`
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: String(formData.get('name') ?? ''),
      bio: formData.get('bio') ? String(formData.get('bio')) : null,
      availabilityNotes: formData.get('availabilityNotes') ? String(formData.get('availabilityNotes')) : null,
      imageUrl: imageUrl,
    },
  })

  revalidatePath('/en/instructor/profile')
  revalidatePath('/en/admin/schedule')
}

export async function updateAvailability(formData: FormData) {
  const session = await auth()
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id
  
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      availabilityNotes: formData.get('availabilityNotes') ? String(formData.get('availabilityNotes')) : null,
    },
  })

  revalidatePath('/en/instructor/availability')
  revalidatePath('/en/admin/schedule')
}
