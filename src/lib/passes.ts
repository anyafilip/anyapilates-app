import { prisma } from '@/lib/prisma'

export async function debitPass(userId: string, classTypeId: string, classDate?: Date) {
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
    
    // If it's the first time we use it, we activate it!
    const isFirstUse = passToDebit.remainingCount === passToDebit.originalCount
    let activatedAt = passToDebit.activatedAt
    let expiresAt = passToDebit.expiresAt

    if (isFirstUse && classDate) {
      activatedAt = classDate
      expiresAt = new Date(classDate)
      expiresAt.setDate(expiresAt.getDate() + passToDebit.validityDays)
    }

    await tx.userPass.update({
      where: { id: passToDebit.id },
      data: { 
        remainingCount: passToDebit.remainingCount - 1,
        activatedAt,
        expiresAt
      }
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
    if (!booking.userPassId || !booking.userPass) throw new Error('Booking was not paid with a pass')

    const pass = booking.userPass
    const newRemainingCount = pass.remainingCount + 1
    
    // If we're refunding the ONLY class that was booked, deactivate the pass
    let activatedAt = pass.activatedAt
    let expiresAt = pass.expiresAt

    if (newRemainingCount === pass.originalCount) {
      activatedAt = null
      
      // Calculate the original expiration date based on startWindowDays.
      // Wait, we don't have startWindowDays on UserPass. We only have createdAt!
      // But we can approximate or fetch from the package.
      const payment = await tx.payment.findUnique({
        where: { id: pass.paymentId! },
        include: { package: true }
      })
      if (payment && payment.package) {
        expiresAt = new Date(pass.createdAt)
        expiresAt.setDate(expiresAt.getDate() + payment.package.startWindowDays)
      }
    }

    await tx.userPass.update({
      where: { id: pass.id },
      data: { 
        remainingCount: newRemainingCount,
        activatedAt,
        expiresAt
      }
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
    expiresAt.setDate(expiresAt.getDate() + pkg.startWindowDays)

    await tx.userPass.create({
      data: {
        userId,
        classTypeId: pkg.classTypeId,
        originalCount: pkg.classCount,
        remainingCount: pkg.classCount,
        expiresAt,
        validityDays: pkg.expiresInDays,
        paymentId,
        adminId
      }
    })
  })
}
