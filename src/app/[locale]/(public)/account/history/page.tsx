import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import MemberNavbar from '@/components/MemberNavbar'
import { redirect } from 'next/navigation'

const TZ_OFFSET = 7

function bangkokDate(utcDate: Date) {
  return new Date(utcDate.getTime() + TZ_OFFSET * 60 * 60 * 1000)
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default async function HistoryPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  if (!userId) {
    redirect('/en/login')
  }

  // Get past classes (either date is past, or status is not BOOKED)
  const pastBookings = await prisma.booking.findMany({
    where: { 
      clientId: userId,
      OR: [
        { status: { not: 'BOOKED' } },
        { class: { date: { lte: new Date() } } }
      ]
    },
    include: { class: { include: { classType: true } } },
    orderBy: [
      { class: { date: 'desc' } },
      { class: { startTime: 'desc' } }
    ],
  })

  return (
    <div className="flex-1 w-full flex flex-col h-screen overflow-hidden bg-[var(--surface)]">
      <MemberNavbar />

      <main className="flex-1 overflow-y-auto w-full">
        <div className="container mx-auto px-6 py-10 max-w-4xl">
          <div className="mb-12">
            <p className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)] mb-2">Member Portal</p>
            <h1 className="text-4xl font-serif font-normal text-[var(--foreground)]">
              Class History
            </h1>
          </div>

          {pastBookings.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[var(--border)] rounded-lg">
              <p className="text-[var(--foreground-muted)] font-light mb-4">No past classes found.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-sm">
              {pastBookings.map(booking => (
                <div key={booking.id} className="py-5 flex items-center justify-between gap-4 opacity-70 hover:opacity-100 transition-opacity">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{booking.class.name}</p>
                    <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                      {bangkokDate(booking.class.date)} · {booking.class.startTime}–{booking.class.endTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] tracking-widest uppercase ${
                      booking.status === 'CANCELLED' ? 'text-[var(--foreground-muted)]' :
                      booking.status === 'ATTENDED' ? 'text-green-700' :
                      booking.status === 'NO_SHOW' ? 'text-red-700' :
                      'text-[var(--foreground)]'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
