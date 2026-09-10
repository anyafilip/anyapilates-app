'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export async function purchasePackage(packageId: string) {
  const session = await auth()
  const user = session?.user as any

  if (!user?.id) {
    throw new Error('You must be logged in to purchase credits')
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } })
  if (!pkg) {
    throw new Error('Package not found')
  }

  // Simulate successful payment processing (e.g. Stripe checkout completion)
  // Create the payment record
  await prisma.payment.create({
    data: {
      clientId: user.id,
      packageId: pkg.id,
      method: 'QR', // default simulated method
      status: 'PAID',
      amount: pkg.price,
      confirmedAt: new Date()
    }
  })

  // Increment the user's credits
  await prisma.user.update({
    where: { id: user.id },
    data: {
      credits: {
        increment: pkg.credits
      }
    }
  })

  redirect('/en/account?purchase=success')
}
