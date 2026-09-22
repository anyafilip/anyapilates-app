import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/routing'
import MemberNavbar from '@/components/MemberNavbar'
import { redirect } from 'next/navigation'
import CancelBookingButton from '../CancelBookingButton'

const TZ_OFFSET = 7

function bangkokDate(utcDate: Date) {
  return new Date(utcDate.getTime() + TZ_OFFSET * 60 * 60 * 1000)
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

const CUTOFF_MS = 12 * 60 * 60 * 1000

export default async function UpcomingPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  if (!userId) {
    redirect('/en/login')
  }

  const upcoming = await prisma.booking.findMany({
    where: { 
      clientId: userId,
      status: 'BOOKED',
      class: { date: { gt: new Date() } }
    },
    include: { class: { include: { classType: true } } },
    orderBy: [
      { class: { date: 'asc' } },
      { class: { startTime: 'asc' } }
    ],
  })

  const now = Date.now()

  return (
    <div className="flex-1 w-full flex flex-col h-[100dvh] overflow-hidden bg-[var(--surface)]">
      <MemberNavbar />

      <main className="flex-1 overflow-y-auto w-full">
        <div className="container mx-auto px-6 py-10 max-w-4xl">
          <div className="mb-12">
            <p className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)] mb-2">Member Portal</p>
            <h1 className="text-4xl font-serif font-normal text-[var(--foreground)]">
              Upcoming Classes
            </h1>
          </div>

          {upcoming.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[var(--border)] rounded-lg">
              <p className="text-[var(--foreground-muted)] font-light mb-4">No upcoming classes booked.</p>
              <Link href="/#schedule" className="text-[var(--accent)] text-sm underline underline-offset-4">
                Browse schedule →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-sm">
              {upcoming.map(booking => {
                const isLateCancel = booking.class.date.getTime() - now <= CUTOFF_MS
                return (
                  <div key={booking.id} className="py-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{booking.class.name}</p>
                      <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                        {bangkokDate(booking.class.date)} · {booking.class.startTime}–{booking.class.endTime}
                      </p>
                    </div>
                    <CancelBookingButton bookingId={booking.id} isLateCancel={isLateCancel} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
