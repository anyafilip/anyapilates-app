/**
 * credits.ts — The ONLY module allowed to mutate user credits.
 *
 * Every function:
 * 1. Reads the current balance inside the transaction (prevents race conditions)
 * 2. Writes a CreditLedger entry (audit trail)
 * 3. Updates user.credits (cached balance)
 * All in a single prisma.$transaction — guaranteed atomic.
 */

import { prisma } from '@/lib/prisma'

// ── Deduct credits when a class is booked ────────────────────────────────────
export async function debitCredits({
  userId,
  amount,
  reason,
  bookingId,
}: {
  userId: string
  amount: number
  reason: string
  bookingId?: string
}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } })
    if (!user) throw new Error('User not found')
    if (user.credits < amount) throw new Error('Insufficient credits')

    const balanceAfter = user.credits - amount

    await tx.creditLedger.create({
      data: {
        userId,
        type: 'BOOKING',
        delta: -amount,
        balanceAfter,
        reason,
        bookingId: bookingId ?? null,
      },
    })

    await tx.user.update({
      where: { id: userId },
      data: { credits: balanceAfter },
    })

    return balanceAfter
  })
}

// ── Refund credits when a booking is cancelled ───────────────────────────────
export async function refundCredits({
  userId,
  amount,
  reason,
  bookingId,
}: {
  userId: string
  amount: number
  reason: string
  bookingId: string
}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } })
    if (!user) throw new Error('User not found')

    const balanceAfter = user.credits + amount

    await tx.creditLedger.create({
      data: {
        userId,
        type: 'REFUND',
        delta: amount,
        balanceAfter,
        reason,
        bookingId,
      },
    })

    await tx.user.update({
      where: { id: userId },
      data: { credits: balanceAfter },
    })

    return balanceAfter
  })
}

// ── Credit user after admin confirms a payment ───────────────────────────────
export async function creditFromPayment({
  userId,
  amount,
  reason,
  paymentId,
  adminId,
}: {
  userId: string
  amount: number
  reason: string
  paymentId: string
  adminId: string
}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } })
    if (!user) throw new Error('User not found')

    const balanceAfter = user.credits + amount

    await tx.creditLedger.create({
      data: {
        userId,
        type: 'PURCHASE',
        delta: amount,
        balanceAfter,
        reason,
        paymentId,
        adminId,
      },
    })

    await tx.user.update({
      where: { id: userId },
      data: { credits: balanceAfter },
    })

    return balanceAfter
  })
}

// ── Admin manually adjusts a user's credits ──────────────────────────────────
export async function adminAdjustCredits({
  userId,
  delta,
  reason,
  adminId,
}: {
  userId: string
  delta: number
  reason: string
  adminId: string
}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } })
    if (!user) throw new Error('User not found')

    const balanceAfter = user.credits + delta
    if (balanceAfter < 0) throw new Error('Credit balance cannot go below zero')

    await tx.creditLedger.create({
      data: {
        userId,
        type: 'ADMIN_ADJUSTMENT',
        delta,
        balanceAfter,
        reason,
        adminId,
      },
    })

    await tx.user.update({
      where: { id: userId },
      data: { credits: balanceAfter },
    })

    return balanceAfter
  })
}
