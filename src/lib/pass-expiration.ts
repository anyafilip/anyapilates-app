import { prisma } from '@/lib/prisma'
import { sendPassExpirationEmail } from '@/lib/email'
import { autoActivatePasses } from '@/lib/passes'

const TZ_OFFSET = 7 // Bangkok UTC+7

export async function checkAndSendPassExpirationReminders() {
  const now = new Date()
  
  // First auto-activate any pending passes that passed their activation deadline
  try {
    await autoActivatePasses()
  } catch (err) {
    console.error('Failed to auto-activate passes prior to expiration check:', err)
  }

  // 1 week (7 days) from now
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Find all active passes with remaining credits expiring within 7 days
  // that haven't received an expiration reminder yet
  const expiringPasses = await prisma.userPass.findMany({
    where: {
      remainingCount: { gt: 0 },
      expiryReminderSent: false,
      expiresAt: {
        gte: now,
        lte: sevenDaysFromNow,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      classType: {
        select: {
          name: true,
          nameTh: true,
        },
      },
      payment: {
        select: {
          package: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  let sentCount = 0
  const errors: Array<{ passId: string; error: string }> = []

  for (const pass of expiringPasses) {
    if (!pass.user?.email) continue

    // Convert to Bangkok UTC+7 date display
    const localDate = new Date(pass.expiresAt.getTime() + TZ_OFFSET * 60 * 60 * 1000)
    const expirationDateStrEn = localDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
    const expirationDateStrTh = localDate.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })

    const packageName = pass.payment?.package?.name || pass.classType?.name || 'Pilates'

    try {
      await sendPassExpirationEmail({
        email: pass.user.email,
        userName: pass.user.name,
        packageName,
        remainingCount: pass.remainingCount,
        expirationDateStrTh,
        expirationDateStrEn,
      })

      await prisma.userPass.update({
        where: { id: pass.id },
        data: { expiryReminderSent: true },
      })

      sentCount++
    } catch (err: any) {
      console.error(`Failed to send expiration email for pass ${pass.id} (${pass.user.email}):`, err)
      errors.push({ passId: pass.id, error: err.message || String(err) })
    }
  }

  return {
    totalChecked: expiringPasses.length,
    sentCount,
    errors,
  }
}
