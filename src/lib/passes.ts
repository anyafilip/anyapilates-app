import { prisma } from '@/lib/prisma'

export async function debitPass(userId: string, classTypeId: string, bookingId?: string) {
  return prisma.$transaction(async (tx) => {
    // Find unexpired passes for this user and classType
    const activePasses = await tx.userPass.findMany({
      where: {
        userId,
        classTypeId,
        remainingCount: { gt: 0 },
        expiresAt: { gt: new Date() }
      },
      orderBy: { expiresAt: 'asc' }
    })

    if (activePasses.length === 0) {
      throw new Error('No active passes found for this class type.')
    }

    // Debit the closest to expire
    const passToDebit = activePasses[0]
    
    await tx.userPass.update({
      where: { id: passToDebit.id },
      data: { remainingCount: passToDebit.remainingCount - 1 }
    })

    return passToDebit.id
  })
}

export async function refundPass(bookingId: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { userPass: true }
    })

    if (!booking) throw new Error('Booking not found')
    if (!booking.userPassId) throw new Error('Booking was not paid with a pass')

    // Optional: if the pass is expired, do we still refund it? Usually yes, but it remains expired.
    await tx.userPass.update({
      where: { id: booking.userPassId },
      data: { remainingCount: { increment: 1 } }
    })
  })
}

export async function grantPassFromPayment({
  userId,
  paymentId,
  packageId,
  adminId,
}: {
  userId: string
  paymentId: string
  packageId: string
  adminId: string
}) {
  return prisma.$transaction(async (tx) => {
    const pkg = await tx.package.findUnique({ where: { id: packageId } })
    if (!pkg) throw new Error('Package not found')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + pkg.expiresInDays)

    await tx.userPass.create({
      data: {
        userId,
        classTypeId: pkg.classTypeId,
        originalCount: pkg.classCount,
        remainingCount: pkg.classCount,
        expiresAt,
        paymentId,
        adminId
      }
    })
  })
}
