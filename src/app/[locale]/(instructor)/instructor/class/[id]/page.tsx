import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { markAttendance } from '@/app/actions/instructor'
import { Link } from '@/i18n/routing'
import { notFound } from 'next/navigation'

const TZ_OFFSET = 7

export default async function ClassRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      bookings: {
        include: { client: { select: { name: true, email: true } } },
        orderBy: { bookedAt: 'asc' }
      }
    }
  })

  if (!cls) return notFound()

  const localDate = new Date(cls.date.getTime() + TZ_OFFSET * 60 * 60 * 1000)
  const dateStr = localDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })

  // Active bookings (not cancelled)
  const activeBookings = cls.bookings.filter(b => b.status !== 'CANCELLED')
  const cancelledBookings = cls.bookings.filter(b => b.status === 'CANCELLED')

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Premium Header */}
      <div className="mb-12 border-b border-[var(--border)] pb-8">
        <Link href="/instructor" className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors inline-block mb-6 border-b border-transparent hover:border-[var(--accent)] pb-1">
          ← Back to Schedule
        </Link>
        <h1 className="text-4xl md:text-5xl font-serif font-light text-[var(--foreground)] mb-6">{cls.name}</h1>
        
        <div className="flex flex-wrap items-center gap-6 text-[10px] md:text-xs tracking-widest uppercase text-[var(--foreground-muted)]">
          <div className="flex items-center gap-3">
            <span className="text-[var(--foreground)] font-medium">{dateStr}</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-[var(--border)]"></div>
          <div className="flex items-center gap-3">
            <span className="text-[var(--foreground)] font-medium">{cls.startTime} – {cls.endTime}</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-[var(--border)]"></div>
          <div className="flex items-center gap-3">
            <span className="text-[var(--foreground)] font-medium">{activeBookings.length} / {cls.capacity}</span>
            <span>Booked</span>
          </div>
        </div>
      </div>

      <div className="bg-white/60 rounded-2xl overflow-hidden border border-white shadow-sm backdrop-blur-md mb-8">
        <div className="px-6 py-5 border-b border-[var(--border)] bg-white/40">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--foreground)]">Class Roster</h2>
        </div>
        
        {activeBookings.length === 0 ? (
          <div className="text-center py-20 px-6">
            <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">No clients have booked yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {activeBookings.map(b => (
              <div key={b.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-white/80 transition-all duration-300">
                <div className="mb-4 md:mb-0">
                  <p className="text-lg font-medium text-[var(--foreground)]">{b.client.name}</p>
                  <p className="text-sm font-light text-[var(--foreground-muted)]">{b.client.email}</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                  <span className={`text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full border ${
                    b.status === 'ATTENDED' ? 'bg-[#EDE8E2] text-[var(--foreground)] border-[var(--border)]' :
                    b.status === 'NO_SHOW' ? 'bg-red-50 text-red-700 border-red-100' :
                    'bg-white text-[var(--foreground-muted)] border-[var(--border)]'
                  }`}>
                    {b.status}
                  </span>
                  
                  <div className="flex items-center gap-4">
                    <form action={async () => {
                      'use server'
                      await markAttendance(b.id, 'ATTENDED')
                    }}>
                      <button type="submit" disabled={b.status === 'ATTENDED'} className="text-[10px] tracking-[0.2em] uppercase text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors disabled:opacity-30 border-b border-transparent hover:border-[var(--accent-dark)] pb-0.5">
                        Attended
                      </button>
                    </form>
                    <span className="text-[var(--border)]">|</span>
                    <form action={async () => {
                      'use server'
                      await markAttendance(b.id, 'NO_SHOW')
                    }}>
                      <button type="submit" disabled={b.status === 'NO_SHOW'} className="text-[10px] tracking-[0.2em] uppercase text-red-600 hover:text-red-800 transition-colors disabled:opacity-30 border-b border-transparent hover:border-red-800 pb-0.5">
                        No Show
                      </button>
                    </form>
                    {(b.status === 'ATTENDED' || b.status === 'NO_SHOW') && (
                      <>
                        <span className="text-[var(--border)]">|</span>
                        <form action={async () => {
                          'use server'
                          await markAttendance(b.id, 'BOOKED')
                        }}>
                          <button type="submit" className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors border-b border-transparent hover:border-[var(--foreground)] pb-0.5">
                            Reset
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cancelledBookings.length > 0 && (
        <div className="bg-white/30 rounded-2xl overflow-hidden border border-white/50 backdrop-blur-sm opacity-70">
          <div className="px-6 py-4 border-b border-white/30">
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Cancelled</h2>
          </div>
          <div className="divide-y divide-white/30">
            {cancelledBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 px-6">
                <span className="text-sm font-light text-[var(--foreground-muted)]">{b.client.name}</span>
                <span className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">Cancelled</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
