'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

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
