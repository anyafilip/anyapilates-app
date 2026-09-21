import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const TZ_OFFSET = 7 // Bangkok UTC+7

export default async function InstructorDashboard() {
  const session = await auth()
  const userId = (session?.user as any)?.id
  const userName = (session?.user as any)?.name

  // Metrics
  const todayLocal = new Date(Date.now() + TZ_OFFSET * 60 * 60 * 1000)
  todayLocal.setUTCHours(0, 0, 0, 0)
  const cutoff = new Date(todayLocal.getTime() - TZ_OFFSET * 60 * 60 * 1000)

  let totalClasses = 0
  let totalStudents = 0
  let upcomingClasses: any[] = []
  let errorMsg = null

  try {
    const results = await Promise.all([
      // Total classes taught
      prisma.class.count({
        where: { instructorId: userId, date: { lt: cutoff } }
      }),
      // Total students taught (Attended status)
      prisma.booking.count({
        where: { class: { instructorId: userId }, status: 'ATTENDED' }
      }),
      // Upcoming classes next 7 days
      prisma.class.findMany({
        where: {
          instructorId: userId,
          date: { gte: cutoff }
        },
        include: {
          classType: { select: { name: true } },
        },
        orderBy: { date: 'asc' },
        take: 5 // preview next 5
      })
    ])

    totalClasses = results[0]
    totalStudents = results[1]
    upcomingClasses = results[2]
  } catch (err: any) {
    console.error('InstructorDashboard error:', err)
    errorMsg = err?.message || 'Unknown error occurred'
  }

  if (errorMsg) {
    return <div className="p-10 text-red-500 font-mono">Error loading dashboard: {errorMsg}</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Premium Header with Integrated Stats */}
      <div className="mb-16 border-b border-[var(--border)] pb-10">
        <h1 className="text-4xl md:text-5xl font-serif font-light text-[var(--foreground)] mb-6">Welcome back, {userName}</h1>
        <div className="flex flex-wrap items-center gap-6 text-[10px] md:text-xs tracking-widest uppercase text-[var(--foreground-muted)]">
          <div className="flex items-center gap-3">
            <span className="text-lg md:text-xl font-serif text-[var(--accent)]">{totalClasses}</span>
            <span>Classes Taught</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-[var(--border)]"></div>
          <div className="flex items-center gap-3">
            <span className="text-lg md:text-xl font-serif text-[var(--accent)]">{totalStudents}</span>
            <span>Students Guided</span>
          </div>
        </div>
      </div>

      {/* Upcoming Classes Section */}
      <div>
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-2xl font-serif font-light text-[var(--foreground)]">Your Next Sessions</h2>
          <Link href="/en/instructor/schedule" className="text-[10px] tracking-[0.2em] uppercase text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors border-b border-transparent hover:border-[var(--accent-dark)] pb-1">
            View All Schedule
          </Link>
        </div>

        <div className="bg-white/60 rounded-2xl overflow-hidden border border-white shadow-sm backdrop-blur-md">
          {upcomingClasses.length === 0 ? (
            <div className="text-center py-20 px-6">
              <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">Your schedule is beautifully clear.</p>
              <p className="text-xs tracking-widest uppercase text-[var(--foreground-muted)]/70">No upcoming classes assigned.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {upcomingClasses.map(cls => {
                const localDate = new Date(cls.date.getTime() + TZ_OFFSET * 60 * 60 * 1000)
                const dateStr = localDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })
                return (
                  <div key={cls.id} className="group flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 hover:bg-white/80 transition-all duration-300">
                    <div className="flex items-start md:items-center gap-6 mb-4 md:mb-0">
                      <div className="min-w-[100px]">
                        <p className="text-xl font-medium text-[var(--foreground)]">{cls.startTime}</p>
                        <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mt-1">{cls.duration} Min</p>
                      </div>
                      <div className="hidden md:block w-px h-10 bg-[var(--border)]"></div>
                      <div>
                        <p className="text-lg font-medium text-[var(--foreground)] mb-1 group-hover:text-[var(--accent)] transition-colors">{cls.name}</p>
                        <p className="text-sm font-light text-[var(--foreground-muted)]">{dateStr}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto border-t border-[var(--border)] md:border-t-0 pt-4 md:pt-0">
                      <div className="text-left md:text-right">
                        <p className="text-sm text-[var(--foreground)] font-medium">{cls.bookedCount} <span className="text-[var(--foreground-muted)] font-light">/ {cls.capacity}</span></p>
                        <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mt-1">Booked</p>
                      </div>
                      <Link href={`/en/instructor/class/${cls.id}`} className="inline-block border border-[var(--border)] px-6 py-3 rounded-full text-[10px] tracking-widest uppercase text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-white transition-all duration-300 text-center">
                        View Roster
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
