import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendClassReminderEmail } from '@/lib/email'

export async function GET(req: Request) {
  // Simple auth for cron: typically you'd check an Authorization header 
  // matching a cron secret like process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const now = new Date()
    
    // Look for classes starting between 24 and 25 hours from now
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    // Find all valid bookings for classes starting tomorrow where reminder hasn't been sent
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: 'BOOKED',
        reminderSent: false,
        class: {
          status: 'SCHEDULED',
          date: {
            gte: twentyFourHoursFromNow,
            lt: twentyFiveHoursFromNow
          }
        }
      },
      include: {
        client: true,
        class: true
      }
    })

    let sentCount = 0

    // Send emails
    for (const booking of upcomingBookings) {
      if (!booking.client.email) continue

      // Format the date/time nicely in UTC+7 (Bangkok)
      // Since booking.class.date is UTC, we can just use the startTime field
      // combined with a formatted date
      const localDate = new Date(booking.class.date.getTime() + 7 * 60 * 60 * 1000)
      const dateStr = localDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      })

      try {
        await sendClassReminderEmail(
          booking.client.email,
          booking.client.name,
          booking.class.name,
          dateStr,
          booking.class.startTime
        )
        
        // Mark as sent
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true }
        })
        sentCount++
      } catch (err) {
        console.error(`Failed to send reminder for booking ${booking.id}:`, err)
      }
    }

    return NextResponse.json({ success: true, sentCount })
  } catch (error: any) {
    console.error('Error processing reminders:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
