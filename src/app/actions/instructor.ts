'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5 MB

export async function markAttendance(bookingId: string, status: 'ATTENDED' | 'NO_SHOW' | 'BOOKED') {
  const session = await auth()
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id

  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // Fetch the booking to verify ownership for instructors (IDOR fix)
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { class: { select: { instructorId: true, id: true } } }
  })

  if (!booking) throw new Error('Booking not found')

  // Instructors can only mark attendance for their own classes
  if (role === 'INSTRUCTOR' && booking.class.instructorId !== userId) {
    throw new Error('Unauthorized: This class is not assigned to you')
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  })

  revalidatePath(`/en/instructor/class/${booking.class.id}`)
}

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
    // Server-side file validation
    if (!ALLOWED_IMAGE_MIMES.includes(imageFile.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
    }
    if (imageFile.size > MAX_UPLOAD_BYTES) {
      throw new Error('File is too large. Maximum size is 5 MB.')
    }

    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = imageFile.type || 'image/jpeg'
    const base64 = buffer.toString('base64')
    imageUrl = `data:${mimeType};base64,${base64}`
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: String(formData.get('name') ?? '').substring(0, 100),
      bio: formData.get('bio') ? String(formData.get('bio')).substring(0, 1000) : null,
      availabilityNotes: formData.get('availabilityNotes') ? String(formData.get('availabilityNotes')).substring(0, 500) : null,
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
      availabilityNotes: formData.get('availabilityNotes') ? String(formData.get('availabilityNotes')).substring(0, 500) : null,
    },
  })

  revalidatePath('/en/instructor/availability')
  revalidatePath('/en/admin/schedule')
}
