'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { debitCredits, refundCredits } from '@/lib/credits'

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

  const cost = cls.classType?.creditCost ?? 1

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true, role: true } })
  if (!user) return { success: false, message: 'User not found.' }

  if (user.role === 'ADMIN') {
    return { success: false, message: 'You cannot book as an admin.' }
  }

  if (user.credits < cost) {
    return { success: false, message: `You don't have enough credits. This class requires ${cost} credit${cost > 1 ? 's' : ''}.` }
  }

  // Check for duplicate booking
  const existing = await prisma.booking.findFirst({
    where: { clientId: userId, classId, status: 'BOOKED' },
  })
  if (existing) return { success: false, message: "You've already booked this class." }

  // Create the booking and atomically debit credits via the ledger
  const booking = await prisma.booking.create({
    data: { clientId: userId, classId },
  })

  await Promise.all([
    debitCredits({
      userId,
      amount: cost,
      reason: `Class booking: ${cls.name}`,
      bookingId: booking.id,
    }),
    prisma.class.update({
      where: { id: classId },
      data: { bookedCount: { increment: 1 } },
    }),
  ])

  revalidatePath('/')
  return { success: true, message: 'Class booked successfully!' }
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

  const cost = booking.class.classType?.creditCost ?? 1
  const isLateCancel = isWithinCutoff(booking.class.date)

  if (isLateCancel) {
    // Late cancellation: no refund
    await Promise.all([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED', cancelledAt: new Date(), creditRefunded: false },
      }),
      prisma.class.update({
        where: { id: booking.classId },
        data: { bookedCount: { decrement: 1 } },
      }),
    ])
    
    revalidatePath('/')
    revalidatePath('/en/account')
    return { success: true, message: 'Booking cancelled. Note: Credits are not refunded for late cancellations.' }
  } else {
    // Regular cancellation: full refund
    await Promise.all([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED', cancelledAt: new Date(), creditRefunded: true },
      }),
      refundCredits({
        userId,
        amount: cost,
        reason: `Cancellation: ${booking.class.name}`,
        bookingId,
      }),
      prisma.class.update({
        where: { id: booking.classId },
        data: { bookedCount: { decrement: 1 } },
      }),
    ])

    revalidatePath('/')
    revalidatePath('/en/account')
    return { success: true, message: 'Booking cancelled. Your credits have been refunded.' }
  }
}
