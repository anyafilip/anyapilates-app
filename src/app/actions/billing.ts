'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { grantPassFromPayment } from '@/lib/passes'
import { revalidatePath } from 'next/cache'

// Generate a short unique reference code e.g. "AYP-0042"
async function generateRefCode(): Promise<string> {
  const count = await prisma.payment.count()
  const n = (count + 1).toString().padStart(4, '0')
  return `AYP-${n}`
}

export async function requestPackagePurchase(packageId: string, method: 'QR' | 'COUNTER') {
  const session = await auth()
  const user = session?.user as any

  if (!user?.id) {
    throw new Error('You must be logged in to purchase packages')
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (dbUser?.role === 'ADMIN') {
    throw new Error('Admins cannot purchase packages.')
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId, isActive: true } })
  if (!pkg) throw new Error('Package not found')

  // Intro package restriction: 1 per account
  if (pkg.name.toLowerCase().includes('intro')) {
    const existingIntro = await prisma.payment.findFirst({
      where: {
        clientId: user.id,
        package: { name: { contains: 'intro', mode: 'insensitive' } },
        status: { not: 'FAILED' }
      }
    })
    if (existingIntro) {
      throw new Error('You can only purchase an introductory package once per account.')
    }
  }

  const refCode = await generateRefCode()

  const payment = await prisma.payment.create({
    data: {
      clientId: user.id,
      packageId: pkg.id,
      method: method,
      status: 'PENDING',
      amount: pkg.price,
      refCode,
    },
  })

  redirect(`/en/buy-credits/pending?paymentId=${payment.id}`)
}

// ── Submit payment slip (user uploads image) ─────────────────────────────────

// Max base64 string length for a ~3 MB image (base64 inflates by ~33%)
const MAX_SLIP_LENGTH = 4_000_000

export async function submitPaymentSlip(paymentId: string, slipBase64: string) {
  const session = await auth()
  const user = session?.user as any
  if (!user?.id) throw new Error('Unauthorized')

  // Server-side upload validation
  if (!slipBase64 || typeof slipBase64 !== 'string') throw new Error('Invalid upload')
  if (slipBase64.length > MAX_SLIP_LENGTH) throw new Error('File too large. Maximum size is 3 MB.')
  if (!slipBase64.startsWith('data:image/')) throw new Error('Only image files are allowed.')

  // Validate MIME type is in allowlist
  const mimeMatch = slipBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/)
  const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!mimeMatch || !ALLOWED_MIMES.includes(mimeMatch[1])) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.')
  }

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

  // Atomically create the user pass
  await grantPassFromPayment({
    userId: payment.clientId,
    paymentId: payment.id,
    packageId: payment.packageId,
    adminId,
  })

  // Send receipt email
  const client = await prisma.user.findUnique({ where: { id: payment.clientId } })
  if (client?.email) {
    const { sendReceiptEmail } = await import('@/lib/email')
    sendReceiptEmail(client.email, client.name, payment.package.name, payment.amount).catch(console.error)
  }

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
    data: { status: 'FAILED', notes: (notes || 'Rejected by admin').substring(0, 500) },
  })

  revalidatePath('/en/admin/payments')
}
