import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'

// Force this page to always be server-rendered fresh — never cached
export const dynamic = 'force-dynamic'
export const revalidate = 0

const TZ_OFFSET = 7 // Bangkok UTC+7

function getBangkokNow() {
  return new Date(Date.now() + TZ_OFFSET * 60 * 60 * 1000)
}

function getBangkokMidnight(date: Date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export default async function InstructorDashboard() {
  const session = await auth()
  const userId = (session?.user as any)?.id
  const userName = session?.user?.name ?? 'Instructor'

  if (!userId) redirect('/en/login')

  const nowBkk = getBangkokNow()
  const todayMidnightUTC = getBangkokMidnight(nowBkk) // midnight Bangkok = 17:00 prev day UTC
  // Convert back to real UTC midnight for BKK
  const todayStartUTC = new Date(todayMidnightUTC.getTime() - TZ_OFFSET * 60 * 60 * 1000)
  const todayEndUTC   = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000)

  // End of this week (Sunday = end of week)
  const dayOfWeek = nowBkk.getUTCDay() // 0=Sun
  const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  const weekEndUTC = new Date(todayEndUTC.getTime() + daysToSunday * 24 * 60 * 60 * 1000)

  const [
    todayClasses,
    thisWeekClasses,
    upcomingClasses,
    totalClassesTaught,
    totalStudentsTaught,
    thisMonthClasses,
  ] = await Promise.all([
    // Today's classes with full booking roster
    prisma.class.findMany({
      where: {
        instructorId: userId,
        status: 'SCHEDULED',
        date: { gte: todayStartUTC, lt: todayEndUTC },
      },
      include: {
        classType: { select: { name: true } },
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          include: { client: { select: { name: true, email: true } } },
          orderBy: { bookedAt: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    }),

    // This week's classes (excluding today)
    prisma.class.findMany({
      where: {
        instructorId: userId,
        status: 'SCHEDULED',
        date: { gte: todayEndUTC, lt: weekEndUTC },
      },
      include: {
        classType: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
      take: 10,
    }),

    // Next 14 days upcoming (after this week)
    prisma.class.findMany({
      where: {
        instructorId: userId,
        status: 'SCHEDULED',
        date: { gte: weekEndUTC },
      },
      include: {
        classType: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
      take: 5,
    }),

    // Career stats: total classes taught (past)
    prisma.class.count({
      where: { instructorId: userId, date: { lt: todayStartUTC } },
    }),

    // Career stats: total attended student-sessions
    prisma.booking.count({
      where: {
        class: { instructorId: userId },
        status: 'ATTENDED',
      },
    }),

    // This month's classes
    prisma.class.count({
      where: {
        instructorId: userId,
        date: {
          gte: new Date(nowBkk.getUTCFullYear(), nowBkk.getUTCMonth(), 1),
          lt:  new Date(nowBkk.getUTCFullYear(), nowBkk.getUTCMonth() + 1, 1),
        },
        status: 'SCHEDULED',
      },
    }),
  ])

  function formatDate(utcDate: Date, opts?: Intl.DateTimeFormatOptions) {
    return utcDate.toLocaleDateString('en-US', {
      timeZone: 'Asia/Bangkok',
      ...opts,
    })
  }

  const hour = nowBkk.getUTCHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-[var(--border)] pb-8 pt-2">
        <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--foreground-muted)] mb-2">
          {greeting}
        </p>
        <h1 className="text-3xl md:text-4xl font-serif font-light text-[var(--foreground)]">
          {userName}
        </h1>
        <p className="text-sm font-light text-[var(--foreground-muted)] mt-1">
          {formatDate(nowBkk, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* ── Stat Tiles ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Classes This Month', value: thisMonthClasses },
          { label: 'Career Classes', value: totalClassesTaught },
          { label: 'Students Guided', value: totalStudentsTaught },
        ].map(stat => (
          <div key={stat.label} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-5 md:p-8 text-center shadow-sm">
            <p className="text-2xl md:text-3xl font-serif font-light text-[var(--foreground)] mb-1">{stat.value}</p>
            <p className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Today's Classes ──────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xl font-serif font-light text-[var(--foreground)]">Today</h2>
          <span className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">
            {formatDate(nowBkk, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {todayClasses.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-10 text-center shadow-sm">
            <p className="font-serif italic text-[var(--foreground-muted)] text-lg">Your day is free.</p>
            <p className="text-xs tracking-widest uppercase text-[var(--foreground-muted)]/60 mt-1">No classes scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayClasses.map(cls => {
              const confirmed = cls.bookings.filter(b => b.status !== 'CANCELLED')
              const spotsLeft = cls.capacity - cls.bookedCount
              return (
                <div key={cls.id} className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl overflow-hidden shadow-sm">
                  {/* Class header row */}
                  <div className="flex items-center justify-between px-6 py-5 gap-4">
                    <div className="flex items-center gap-5">
                      <div>
                        <p className="text-xl font-medium text-[var(--foreground)]">{cls.startTime}</p>
                        <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">{cls.duration} min</p>
                      </div>
                      <div className="w-px h-8 bg-[var(--border)] hidden sm:block" />
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{cls.name}</p>
                        {cls.classType && cls.name !== cls.classType.name && (
                          <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">{cls.classType.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {cls.bookedCount}<span className="text-[var(--foreground-muted)] font-light"> / {cls.capacity}</span>
                        </p>
                        <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">
                          {spotsLeft > 0 ? `${spotsLeft} left` : 'Full'}
                        </p>
                      </div>
                      <Link
                        href={`/instructor/class/${cls.id}`}
                        className="border border-[var(--border)] px-5 py-2.5 rounded-full text-[10px] tracking-widest uppercase text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-white transition-all duration-200"
                      >
                        Roster
                      </Link>
                    </div>
                  </div>

                  {/* Roster preview */}
                  {confirmed.length > 0 && (
                    <div className="border-t border-[var(--border)] bg-white/40 px-6 py-3 flex flex-wrap gap-2">
                      {confirmed.map(b => (
                        <span key={b.id} className="inline-flex items-center gap-1.5 text-[11px] font-light text-[var(--foreground)] bg-white/80 border border-white/60 rounded-full px-3 py-1">
                          <span className="w-5 h-5 rounded-full bg-[var(--foreground)]/10 flex items-center justify-center text-[9px] font-medium uppercase">
                            {b.client.name?.[0]}
                          </span>
                          {b.client.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── This Week ──────────────────────────────────── */}
      {thisWeekClasses.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-xl font-serif font-light text-[var(--foreground)]">This Week</h2>
            <Link href="/instructor/schedule" className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
              Full Schedule →
            </Link>
          </div>
          <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden shadow-sm divide-y divide-[var(--border)]">
            {thisWeekClasses.map(cls => {
              const dateStr = formatDate(cls.date, { weekday: 'short', month: 'short', day: 'numeric' })
              return (
                <div key={cls.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/60 transition-colors group">
                  <div className="flex items-center gap-5">
                    <div className="min-w-[90px]">
                      <p className="text-sm font-medium text-[var(--foreground)]">{cls.startTime}</p>
                      <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">{dateStr}</p>
                    </div>
                    <div className="w-px h-6 bg-[var(--border)]" />
                    <div>
                      <p className="text-sm text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{cls.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-[var(--foreground-muted)]">
                      {cls.bookedCount}<span className="text-[var(--foreground-muted)]/50">/{cls.capacity}</span>
                    </span>
                    <Link
                      href={`/instructor/class/${cls.id}`}
                      className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Coming Up ──────────────────────────────────── */}
      {upcomingClasses.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-xl font-serif font-light text-[var(--foreground)]">Coming Up</h2>
          </div>
          <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden shadow-sm divide-y divide-[var(--border)]">
            {upcomingClasses.map(cls => {
              const dateStr = formatDate(cls.date, { weekday: 'short', month: 'short', day: 'numeric' })
              return (
                <div key={cls.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/60 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="min-w-[90px]">
                      <p className="text-sm font-medium text-[var(--foreground)]">{cls.startTime}</p>
                      <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">{dateStr}</p>
                    </div>
                    <div className="w-px h-6 bg-[var(--border)]" />
                    <p className="text-sm text-[var(--foreground)]">{cls.name}</p>
                  </div>
                  <span className="text-sm text-[var(--foreground-muted)]">
                    {cls.bookedCount}<span className="text-[var(--foreground-muted)]/50">/{cls.capacity}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Quick Links ──────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 pb-8">
        <Link href="/instructor/schedule" className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-6 hover:bg-white/80 transition-all shadow-sm group">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-2">Navigate</p>
          <p className="text-lg font-serif text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">My Schedule</p>
        </Link>
        <Link href="/instructor/history" className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-6 hover:bg-white/80 transition-all shadow-sm group">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-2">Navigate</p>
          <p className="text-lg font-serif text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">Class History</p>
        </Link>
      </section>

    </div>
  )
}
