import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { cancelBooking } from '@/app/actions/booking'

import MemberNavbar from '@/components/MemberNavbar'
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
      userPasses: {
        where: { remainingCount: { gt: 0 } },
        include: { classType: true },
        orderBy: { expiresAt: 'asc' }
      },
      bookings: {
        where: { class: { date: { gt: new Date() } }, status: 'BOOKED' },
        include: { class: { include: { classType: true } } },
        orderBy: [{ class: { date: 'asc' } }, { class: { startTime: 'asc' } }],
        take: 3,
      },
    },
  })

  if (!user) return null

  const now = Date.now()
  const upcoming = user.bookings

  return (
    <div className="flex-1 w-full flex flex-col h-screen overflow-hidden bg-[var(--surface)]">
      <MemberNavbar />

      <main className="flex-1 overflow-y-auto w-full">
        <div className="container mx-auto px-6 py-10 max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <p className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)] mb-2">Member Portal</p>
            <h1 className="text-4xl font-serif font-normal text-[var(--foreground)]">
              Hello, {user.name.split(' ')[0]}
            </h1>
          </div>

          {/* Classes */}
          <div className="py-8 border-y border-[var(--border)] mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif text-[var(--foreground)]">My Classes</h2>
              <Link href="/en/#packages" className="btn-ghost text-[11px] px-6 py-3">
                Buy Classes
              </Link>
            </div>
            
            {user.userPasses.length === 0 ? (
              <p className="text-[var(--foreground-muted)] font-light italic">No active classes available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.userPasses.map(pass => (
                  <div key={pass.id} className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-serif text-lg text-[var(--foreground)]">{pass.classType.name}</span>
                      <span className="text-2xl font-light text-[var(--foreground)]">{pass.remainingCount} <span className="text-xs uppercase tracking-widest text-[var(--foreground-muted)]">Left</span></span>
                    </div>
                    <div className="w-full bg-black/5 h-1 rounded-full mb-3 overflow-hidden">
                      <div className="bg-[var(--foreground)] h-full" style={{ width: `${(pass.remainingCount / pass.originalCount) * 100}%` }}></div>
                    </div>
                    <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">
                      Expires {bangkokDate(pass.expiresAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Bookings */}
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-normal text-[var(--foreground)]">Upcoming Classes</h2>
              <Link href="/en/account/upcoming" className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                View All →
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-[var(--border)] rounded-lg">
                <p className="text-[var(--foreground-muted)] font-light mb-4">No upcoming classes booked.</p>
                <Link href="/en/#schedule" className="text-[var(--accent)] text-sm underline underline-offset-4">
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

          {/* Quick Links */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/en/account/history" className="bg-white/30 hover:bg-white/60 transition-colors border border-white/60 rounded-2xl p-6 text-center">
              <p className="font-serif text-lg text-[var(--foreground)] mb-1">Class History</p>
              <p className="text-xs text-[var(--foreground-muted)]">View past attendances & cancellations</p>
            </Link>
            <Link href="/en/account/purchases" className="bg-white/30 hover:bg-white/60 transition-colors border border-white/60 rounded-2xl p-6 text-center">
              <p className="font-serif text-lg text-[var(--foreground)] mb-1">Purchase History</p>
              <p className="text-xs text-[var(--foreground-muted)]">View receipts and payment status</p>
            </Link>
          </section>

        </div>
      </main>
    </div>
  )
}
