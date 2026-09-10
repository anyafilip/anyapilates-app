'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { creditFromPayment } from '@/lib/credits'
import { revalidatePath } from 'next/cache'

// Generate a short unique reference code e.g. "AYP-0042"
async function generateRefCode(): Promise<string> {
  const count = await prisma.payment.count()
  const n = (count + 1).toString().padStart(4, '0')
  return `AYP-${n}`
}

export async function requestPackagePurchase(packageId: string) {
  const session = await auth()
  const user = session?.user as any

  if (!user?.id) {
    throw new Error('You must be logged in to purchase credits')
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId, isActive: true } })
  if (!pkg) throw new Error('Package not found')

  const refCode = await generateRefCode()

  const payment = await prisma.payment.create({
    data: {
      clientId: user.id,
      packageId: pkg.id,
      method: 'QR',
      status: 'PENDING',
      amount: pkg.price,
      refCode,
    },
  })

  redirect(`/en/buy-credits/pending?paymentId=${payment.id}`)
}

// ── Submit payment slip (user uploads image) ─────────────────────────────────
export async function submitPaymentSlip(paymentId: string, slipBase64: string) {
  const session = await auth()
  const user = session?.user as any
  if (!user?.id) throw new Error('Unauthorized')

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new Error('Payment not found')
  if (payment.clientId !== user.id) throw new Error('Unauthorized')
  if (payment.status !== 'PENDING') throw new Error('Payment already processed')

  await prisma.payment.update({
    where: { id: paymentId },
    data: { slipUrl: slipBase64 },
  })

  revalidatePath(`/en/buy-credits/pending`)
}

// ── Admin: Confirm a payment ──────────────────────────────────────────────────
export async function confirmPayment(paymentId: string) {
  const session = await auth()
  const adminId = (session?.user as any)?.id
  const role = (session?.user as any)?.role
  if (role !== 'ADMIN') throw new Error('Unauthorized')

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { package: true },
  })
  if (!payment) throw new Error('Payment not found')
  if (payment.status !== 'PENDING') throw new Error('Payment is not pending')

  // Mark payment as PAID
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'PAID', confirmedAt: new Date(), confirmedBy: adminId },
  })

  // Atomically credit the user via the ledger
  await creditFromPayment({
    userId: payment.clientId,
    amount: payment.package.credits,
    reason: `Package purchase: ${payment.package.name} (${payment.refCode})`,
    paymentId: payment.id,
    adminId,
  })

  revalidatePath('/en/admin/payments')
  revalidatePath('/', 'layout')
}

// ── Admin: Reject a payment ───────────────────────────────────────────────────
export async function rejectPayment(paymentId: string, notes: string) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role !== 'ADMIN') throw new Error('Unauthorized')

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new Error('Payment not found')
  if (payment.status !== 'PENDING') throw new Error('Payment is not pending')

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'FAILED', notes: notes || 'Rejected by admin' },
  })

  revalidatePath('/en/admin/payments')
}
