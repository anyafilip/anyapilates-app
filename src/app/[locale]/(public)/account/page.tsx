import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { cancelBooking } from '@/app/actions/booking'

import PublicNavbar from '@/components/PublicNavbar'
import CancelBookingButton from './CancelBookingButton'

const TZ_OFFSET = 7

function bangkokDate(utcDate: Date) {
  return new Date(utcDate.getTime() + TZ_OFFSET * 60 * 60 * 1000)
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

const CUTOFF_MS = 12 * 60 * 60 * 1000

export default async function AccountPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      credits: true,
      bookings: {
        include: { class: { include: { classType: true } } },
        orderBy: { bookedAt: 'desc' },
      },
    },
  })

  if (!user) return null

  const now = Date.now()
  const upcoming = user.bookings.filter(b => b.status === 'BOOKED' && b.class.date.getTime() > now)
  const past     = user.bookings.filter(b => b.status !== 'BOOKED' || b.class.date.getTime() <= now)

  return (
    <div className="flex-1 w-full flex flex-col relative">
      <PublicNavbar isLoggedIn={true} user={user} credits={user.credits} />

      <main className="flex-1 container mx-auto px-6 pt-32 pb-16 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)] mb-2">Member Portal</p>
          <h1 className="text-4xl font-serif font-normal text-[var(--foreground)]">
            Hello, {user.name.split(' ')[0]}
          </h1>
        </div>

        {/* Credits */}
        <div className="flex items-center gap-6 py-8 border-y border-[var(--border)] mb-12">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)] mb-1">Available Credits</p>
            <p className="text-5xl font-light text-[var(--foreground)]">
              {user.credits}
              <span className="text-lg text-[var(--foreground-muted)] ml-2">class{user.credits !== 1 ? 'es' : ''}</span>
            </p>
          </div>
          <div className="ml-auto">
            <Link href="/en/#packages" className="btn-ghost text-[11px] px-6 py-3">
              Buy Credits
            </Link>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <section className="mb-14">
          <h2 className="text-2xl font-serif font-normal text-[var(--foreground)] mb-6">Upcoming Classes</h2>

          {upcoming.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[var(--border)] rounded-lg">
              <p className="text-[var(--foreground-muted)] font-light mb-4">No upcoming classes booked.</p>
              <Link href="/#schedule" className="text-[var(--accent)] text-sm underline underline-offset-4">
                Browse schedule →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
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
        </section>

        {/* Past Bookings */}
        {past.length > 0 && (
          <section>
            <h2 className="text-2xl font-serif font-normal text-[var(--foreground)] mb-6">History</h2>
            <div className="divide-y divide-[var(--border)]">
              {past.slice(0, 10).map(booking => (
                <div key={booking.id} className="py-4 flex items-center justify-between gap-4 opacity-60">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{booking.class.name}</p>
                    <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                      {bangkokDate(booking.class.date)} · {booking.class.startTime}
                    </p>
                  </div>
                  <span className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)]">
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
