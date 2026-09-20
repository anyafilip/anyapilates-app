'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { debitPass, refundPass } from '@/lib/passes'

const BOOKING_CUTOFF_HOURS = 12

function isWithinCutoff(classDate: Date): boolean {
  const cutoff = new Date(Date.now() + BOOKING_CUTOFF_HOURS * 60 * 60 * 1000)
  return classDate <= cutoff
}

// ── Book a Class ──────────────────────────────────────────────────────────────

export type BookingResult = { success: boolean; message: string }

export async function bookClass(classId: string): Promise<BookingResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'You must be logged in to book a class.' }
  }
  const userId = session.user.id

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { classType: true },
  })
  if (!cls) return { success: false, message: 'Class not found.' }
  if (cls.status === 'CANCELLED') return { success: false, message: 'This class has been cancelled.' }
  if (isWithinCutoff(cls.date)) {
    return { success: false, message: 'Bookings close 12 hours before class starts.' }
  }
  if (cls.bookedCount >= cls.capacity) {
    return { success: false, message: 'This class is fully booked.' }
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!user) return { success: false, message: 'User not found.' }
  if (user.role === 'ADMIN') return { success: false, message: 'You cannot book as an admin.' }

  if (!cls.classTypeId) return { success: false, message: 'Invalid class configuration (no class type).' }

  // Check for duplicate booking
  const existing = await prisma.booking.findFirst({
    where: { clientId: userId, classId, status: 'BOOKED' },
  })
  if (existing) return { success: false, message: "You've already booked this class." }

  try {
    // Attempt to debit pass first to ensure they have one
    const userPassId = await debitPass(userId, cls.classTypeId)
    
    // Create the booking
    await prisma.$transaction([
      prisma.booking.create({
        data: { clientId: userId, classId, userPassId },
      }),
      prisma.class.update({
        where: { id: classId },
        data: { bookedCount: { increment: 1 } },
      }),
    ])

    revalidatePath('/')
    return { success: true, message: 'Class booked successfully!' }
  } catch (e: any) {
    return { success: false, message: e.message || 'Failed to book class. Make sure you have an active pass.' }
  }
}

// ── Cancel a Booking ──────────────────────────────────────────────────────────

export async function cancelBooking(bookingId: string): Promise<BookingResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'You must be logged in.' }
  }
  const userId = session.user.id

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { class: { include: { classType: true } } },
  })

  if (!booking) return { success: false, message: 'Booking not found.' }
  if (booking.clientId !== userId) return { success: false, message: 'Not your booking.' }
  if (booking.status !== 'BOOKED') return { success: false, message: 'This booking is already cancelled.' }

  const isLateCancel = isWithinCutoff(booking.class.date)

  if (isLateCancel) {
    // Late cancellation: no refund
    await Promise.all([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      }),
      prisma.class.update({
        where: { id: booking.classId },
        data: { bookedCount: { decrement: 1 } },
      }),
    ])
    
    revalidatePath('/')
    revalidatePath('/en/account')
    return { success: true, message: 'Booking cancelled. Note: Your pass was not refunded due to late cancellation.' }
  } else {
    // Regular cancellation: full refund
    await Promise.all([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      }),
      refundPass(bookingId),
      prisma.class.update({
        where: { id: booking.classId },
        data: { bookedCount: { decrement: 1 } },
      }),
    ])

    revalidatePath('/')
    revalidatePath('/en/account')
    return { success: true, message: 'Booking cancelled. Your pass has been refunded.' }
  }
}
