import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 86400000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextWeek = new Date(startOfDay.getTime() + 7 * 86400000)

  const endOfTomorrow = new Date(endOfDay.getTime() + 86400000)

  const [
    revenueAgg,
    trafficToday,
    totalMembers,
    newMembersThisMonth,
    classesThisWeek,
    pendingPaymentsQR,
    pendingPaymentsCounter
  ] = await Promise.all([
    // Revenue this month
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID', createdAt: { gte: startOfMonth } }
    }),
    // Traffic today
    prisma.booking.count({
      where: { status: 'BOOKED', class: { date: { gte: startOfDay, lt: endOfDay } } }
    }),
    // Total clients
    prisma.user.count({ where: { role: 'CLIENT' } }),
    // Clients who joined this month
    prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: startOfMonth } } }),
    // Classes this week
    prisma.class.count({
      where: { status: 'SCHEDULED', date: { gte: startOfDay, lt: nextWeek } }
    }),
    // Pending QR
    prisma.payment.count({ where: { status: 'PENDING', method: 'QR' } }),
    // Pending Counter
    prisma.payment.count({ where: { status: 'PENDING', method: 'COUNTER' } })
  ])

  const pendingTotal = pendingPaymentsQR + pendingPaymentsCounter
  const revenueThisMonth = (revenueAgg._sum.amount || 0) / 100

  // Today's Schedule
  const todaySchedule = await prisma.class.findMany({
    where: { date: { gte: startOfDay, lt: endOfDay } },
    orderBy: { startTime: 'asc' },
    include: { instructor: { select: { name: true } } }
  })

  // Tomorrow's Schedule
  const tomorrowSchedule = await prisma.class.findMany({
    where: { date: { gte: endOfDay, lt: endOfTomorrow } },
    orderBy: { startTime: 'asc' },
    include: { instructor: { select: { name: true } } }
  })

  // Recent Sales
  const recentSales = await prisma.payment.findMany({
    where: { status: 'PAID' },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      client: { select: { name: true } },
      package: { select: { name: true } }
    }
  })

  // Low Credit Members
  const lowCreditPasses = await prisma.userPass.findMany({
    where: {
      remainingCount: { lte: 1 },
      expiresAt: { gte: now }
    },
    include: { user: { select: { id: true, name: true, email: true } }, classType: { select: { name: true } } },
    orderBy: { remainingCount: 'asc' },
    take: 20
  })
  
  // Filter out duplicates so we only show each user once
  const seenUsers = new Set()
  const lowCreditMembers = lowCreditPasses.filter(pass => {
    if (seenUsers.has(pass.userId)) return false
    seenUsers.add(pass.userId)
    return true
  }).map(pass => ({
    id: pass.user.id,
    name: pass.user.name,
    email: pass.user.email,
    credits: pass.remainingCount,
    passName: pass.classType.name
  })).slice(0, 6)

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((now.getTime() - date.getTime()) / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="mb-4">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Overview</h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Studio Dashboard</p>
      </div>

      {pendingTotal > 0 && (
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
              <p className="text-[var(--foreground-muted)] text-xs md:text-sm mt-0.5">
                There are {pendingTotal} payments waiting for confirmation ({pendingPaymentsQR} by QR, {pendingPaymentsCounter} at counter).
              </p>
            </div>
          </div>
          <Link href="/en/admin/payments" className="w-full md:w-auto text-center bg-orange-600 text-white px-6 py-2.5 rounded-full text-[10px] tracking-widest uppercase hover:bg-orange-700 transition-colors">
            Review Payments
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Card 1: Monthly Revenue */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col justify-between h-[140px] md:h-[200px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex justify-between items-start">
            <h3 className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Revenue</h3>
            <span className="text-[var(--foreground-muted)]/50">
              <svg width="16" height="16" className="md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </span>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-serif text-[var(--foreground)] mb-1 md:mb-2">฿{revenueThisMonth.toLocaleString()}</p>
            <p className="text-[8px] md:text-[10px] font-medium text-[var(--foreground-muted)] uppercase tracking-widest">This Month</p>
          </div>
        </div>

        {/* Card 2: Traffic Today */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col justify-between h-[140px] md:h-[200px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex justify-between items-start">
            <h3 className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Traffic</h3>
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
            <p className="text-4xl md:text-5xl font-serif text-[var(--foreground)] mb-1 md:mb-2">{trafficToday}</p>
            <p className="text-[8px] md:text-[10px] font-medium text-[var(--foreground-muted)] uppercase tracking-widest">Attendees Today</p>
          </div>
        </div>

        {/* Card 3: Members */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col justify-between h-[140px] md:h-[200px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex justify-between items-start">
            <h3 className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Members</h3>
            <span className="text-[var(--foreground-muted)]/50">
              <svg width="16" height="16" className="md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
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

        {/* Card 4: Classes Next 7 Days */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col justify-between h-[140px] md:h-[200px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex justify-between items-start">
            <h3 className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Classes</h3>
            <span className="text-[var(--foreground-muted)]/50">
              <svg width="16" height="16" className="md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1 md:mb-2">
              <p className="text-4xl md:text-5xl font-serif text-[var(--foreground)]">{classesThisWeek}</p>
            </div>
            <p className="text-[8px] md:text-[10px] font-medium text-[var(--foreground-muted)] uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
              Next 7 Days
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* Today's Schedule */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-end mb-6 border-b border-black/5 pb-4">
            <h2 className="text-xl font-serif text-[var(--foreground)]">Today's Schedule</h2>
            <Link href="/en/admin/schedule" className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors border-b border-transparent hover:border-[var(--foreground)] pb-1">
              Full Calendar →
            </Link>
          </div>
          
          <div className="space-y-4">
            {todaySchedule.map(cls => {
              const isFull = cls.bookedCount >= cls.capacity
              
              return (
                <div key={cls.id} className="p-4 bg-white/40 border border-white/60 rounded-2xl flex items-center justify-between group hover:bg-white/60 transition-colors">
                  <div className="flex-1">
                    <p className="text-[13px] tracking-wider uppercase text-[var(--foreground-muted)] mb-1">
                      {cls.startTime} {cls.instructor && <span className="lowercase normal-case font-serif italic ml-1">with {cls.instructor.name}</span>}
                    </p>
                    <p className="text-base font-medium text-[var(--foreground)]">{cls.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-light ${isFull ? 'text-green-700' : 'text-[var(--foreground)]'}`}>
                      {cls.bookedCount}<span className="text-[10px] text-[var(--foreground-muted)]">/{cls.capacity}</span>
                    </span>
                    <p className="text-[8px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mt-1">Booked</p>
                  </div>
                </div>
              )
            })}
            {todaySchedule.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[var(--foreground-muted)] font-serif italic text-base mb-1">No classes today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tomorrow's Schedule */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-end mb-6 border-b border-black/5 pb-4">
            <h2 className="text-xl font-serif text-[var(--foreground)]">Tomorrow's Schedule</h2>
            <Link href="/en/admin/schedule" className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors border-b border-transparent hover:border-[var(--foreground)] pb-1">
              Full Calendar →
            </Link>
          </div>
          
          <div className="space-y-4">
            {tomorrowSchedule.map(cls => {
              const isFull = cls.bookedCount >= cls.capacity
              return (
                <div key={cls.id} className="p-4 bg-white/40 border border-white/60 rounded-2xl flex items-center justify-between group hover:bg-white/60 transition-colors">
                  <div className="flex-1">
                    <p className="text-[13px] tracking-wider uppercase text-[var(--foreground-muted)] mb-1">
                      {cls.startTime} {cls.instructor && <span className="lowercase normal-case font-serif italic ml-1">with {cls.instructor.name}</span>}
                    </p>
                    <p className="text-base font-medium text-[var(--foreground)]">{cls.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-light ${isFull ? 'text-green-700' : 'text-[var(--foreground)]'}`}>
                      {cls.bookedCount}<span className="text-[10px] text-[var(--foreground-muted)]">/{cls.capacity}</span>
                    </span>
                    <p className="text-[8px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mt-1">Booked</p>
                  </div>
                </div>
              )
            })}
            {tomorrowSchedule.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[var(--foreground-muted)] font-serif italic text-base mb-1">No classes tomorrow.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales Activity */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-end mb-6 border-b border-black/5 pb-4">
            <h2 className="text-xl font-serif text-[var(--foreground)]">Recent Sales</h2>
            <Link href="/en/admin/payments" className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors border-b border-transparent hover:border-[var(--foreground)] pb-1">
              All Payments →
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentSales.map(sale => (
              <div key={sale.id} className="p-4 bg-white/40 border border-white/60 rounded-2xl flex items-center justify-between group hover:bg-white/60 transition-colors">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{sale.client.name}</p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">{sale.package.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    +฿{(sale.amount / 100).toLocaleString()}
                  </span>
                  <p className="text-[9px] tracking-widest uppercase text-[var(--foreground-muted)] mt-1">{formatTimeAgo(sale.createdAt)}</p>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[var(--foreground-muted)] font-serif italic text-base mb-1">No recent sales.</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Classes Remaining Alerts */}
        <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-end mb-6 border-b border-black/5 pb-4">
            <h2 className="text-xl font-serif text-[var(--foreground)]">Running Out Soon</h2>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
              Renewal Reminders
            </span>
          </div>
          
          <div className="space-y-4">
            {lowCreditMembers.map(member => (
              <div key={member.id} className="p-4 bg-white/40 border border-white/60 rounded-2xl flex items-center justify-between group hover:bg-white/60 transition-colors">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{member.name}</p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">{member.passName}</p>
                </div>
                <div>
                  {member.credits === 0 ? (
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] tracking-widest uppercase font-medium">0 Classes</span>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] tracking-widest uppercase font-medium">1 Class</span>
                  )}
                </div>
              </div>
            ))}
            {lowCreditMembers.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[var(--foreground-muted)] font-serif italic text-base mb-1">All members are topped up!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
