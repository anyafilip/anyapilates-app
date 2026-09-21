import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalBookings, 
    todayBookings, 
    upcomingClasses, 
    todayClasses,
    totalMembers, 
    newMembersThisMonth,
    pendingPayments,
    pendingPaymentsWithSlip
  ] = await Promise.all([
    // Active bookings for upcoming classes
    prisma.booking.count({ where: { status: 'BOOKED', class: { date: { gte: startOfDay } } } }),
    // Bookings made today (regardless of when the class is)
    prisma.booking.count({ where: { status: 'BOOKED', bookedAt: { gte: startOfDay } } }),
    // Scheduled classes from today onwards
    prisma.class.count({ where: { status: 'SCHEDULED', date: { gte: startOfDay } } }),
    // Classes scheduled specifically for today
    prisma.class.count({ where: { status: 'SCHEDULED', date: { gte: startOfDay, lt: new Date(startOfDay.getTime() + 86400000) } } }),
    // Total clients
    prisma.user.count({ where: { role: 'CLIENT' } }),
    // Clients who joined this month
    prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: startOfMonth } } }),
    // All pending payments
    prisma.payment.count({ where: { status: 'PENDING' } }),
    // Pending payments with a slip uploaded (action required)
    prisma.payment.count({ where: { status: 'PENDING', slipUrl: { not: null } } })
  ])

  const upcoming = await prisma.class.findMany({
    where: { date: { gte: startOfDay } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    take: 5,
    include: { instructor: { select: { name: true } } }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="mb-4">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Overview</h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Studio Dashboard</p>
      </div>

      {pendingPaymentsWithSlip > 0 && (
        <div className="bg-[#FAF5F0] border border-[#E8DFD5] rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"></path>
                <path d="M12 8v4"></path>
                <path d="M12 16h.01"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-[var(--foreground)] font-medium text-sm md:text-base">Action Required: Pending Payments</h3>
              <p className="text-[var(--foreground-muted)] text-xs md:text-sm mt-0.5">There are {pendingPaymentsWithSlip} payment slips waiting for your confirmation.</p>
            </div>
          </div>
          <Link href="/en/admin/payments" className="w-full md:w-auto text-center bg-orange-600 text-white px-6 py-2.5 rounded-full text-[10px] tracking-widest uppercase hover:bg-orange-700 transition-colors">
            Review Slips
          </Link>
        </div>
      )}

      {/* Stats Grid - Minimalist & Premium */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Card 1: Active Bookings */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col justify-between h-[140px] md:h-[200px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex justify-between items-start">
            <h3 className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Bookings</h3>
            <span className="text-[var(--foreground-muted)]/50">
              <svg width="16" height="16" className="md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
            </span>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-serif text-[var(--foreground)] mb-1 md:mb-2">{totalBookings}</p>
            <p className="text-[8px] md:text-[10px] font-medium text-[var(--foreground-muted)] uppercase tracking-widest">Active</p>
          </div>
        </div>

        {/* Card 2: Booked Today */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col justify-between h-[140px] md:h-[200px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex justify-between items-start">
            <h3 className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Today</h3>
            <span className="text-[var(--foreground-muted)]/50">
              <svg width="16" height="16" className="md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </span>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-serif text-[var(--foreground)] mb-1 md:mb-2">+{todayBookings}</p>
            <p className="text-[8px] md:text-[10px] font-medium text-[var(--foreground-muted)] uppercase tracking-widest">Last 24h</p>
          </div>
        </div>

        {/* Card 3: Members */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col justify-between h-[140px] md:h-[200px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex justify-between items-start">
            <h3 className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Members</h3>
            <span className="text-[var(--foreground-muted)]/50">
              <svg width="16" height="16" className="md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1 md:mb-2">
              <p className="text-4xl md:text-5xl font-serif text-[var(--foreground)]">{totalMembers}</p>
            </div>
            <p className="text-[8px] md:text-[10px] font-medium text-[var(--foreground-muted)] uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
              {newMembersThisMonth > 0 ? `+${newMembersThisMonth} this month` : 'Total clients'}
            </p>
          </div>
        </div>

        {/* Card 4: Upcoming Sessions */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col justify-between h-[140px] md:h-[200px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex justify-between items-start">
            <h3 className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Sessions</h3>
            <span className="text-[var(--foreground-muted)]/50">
              <svg width="16" height="16" className="md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1 md:mb-2">
              <p className="text-4xl md:text-5xl font-serif text-[var(--foreground)]">{upcomingClasses}</p>
            </div>
            <p className="text-[8px] md:text-[10px] font-medium text-[var(--foreground-muted)] uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
              {todayClasses > 0 ? `${todayClasses} today` : 'Scheduled'}
            </p>
          </div>
        </div>

      </div>

      {/* Upcoming sessions List */}
      <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-3xl p-8 md:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mt-8">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-serif text-[var(--foreground)]">Next Sessions</h2>
          <Link href="/en/admin/schedule" className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors border-b border-transparent hover:border-[var(--foreground)] pb-1">
            View All →
          </Link>
        </div>
        
        <div className="divide-y divide-[var(--border)]">
          {upcoming.map(cls => (
            <div key={cls.id} className="group py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-white/40 transition-colors -mx-6 px-6 md:-mx-12 md:px-12 rounded-2xl">
              <div>
                <p className="text-xl font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{cls.name}</p>
                <p className="text-xs tracking-wider uppercase text-[var(--foreground-muted)] mt-2">
                  {new Date(cls.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' · '}<span className="text-[var(--foreground)] font-medium">{cls.startTime}</span>
                  {cls.instructor && ` · with ${cls.instructor.name}`}
                </p>
              </div>
              <div className="text-left sm:text-right border-t border-[var(--border)] sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                <span className="text-xl font-light text-[var(--foreground)]">
                  {cls.bookedCount}<span className="text-sm text-[var(--foreground-muted)]">/{cls.capacity}</span>
                </span>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mt-1">Booked</p>
              </div>
            </div>
          ))}
          {upcoming.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">No upcoming sessions.</p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]/70">The studio is resting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
