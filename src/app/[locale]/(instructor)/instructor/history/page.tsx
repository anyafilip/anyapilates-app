import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const TZ_OFFSET = 7 // Bangkok UTC+7

export default async function InstructorHistory() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  // Fetch past classes for this instructor
  const todayLocal = new Date(Date.now() + TZ_OFFSET * 60 * 60 * 1000)
  todayLocal.setUTCHours(0, 0, 0, 0)
  const cutoff = new Date(todayLocal.getTime() - TZ_OFFSET * 60 * 60 * 1000)

  const classes = await prisma.class.findMany({
    where: {
      instructorId: userId,
      date: { lt: cutoff },
    },
    include: {
      classType: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
    take: 50 // last 50 classes
  })

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-12 border-b border-[var(--border)] pb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-light text-[var(--foreground)]">Class History</h1>
      </div>

      <div className="bg-white/60 rounded-2xl overflow-hidden border border-white shadow-sm backdrop-blur-md">
        {classes.length === 0 ? (
          <div className="text-center py-20 px-6">
            <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">A blank canvas.</p>
            <p className="text-xs tracking-widest uppercase text-[var(--foreground-muted)]/70">You have no past classes.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {classes.map(cls => {
              const localDate = new Date(cls.date.getTime() + TZ_OFFSET * 60 * 60 * 1000)
              const dateStr = localDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })
              return (
                <div key={cls.id} className={`group flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 hover:bg-white/80 transition-all duration-300 ${cls.status === 'CANCELLED' ? 'opacity-50' : ''}`}>
                  <div className="flex items-start md:items-center gap-6 mb-4 md:mb-0">
                    <div className="min-w-[100px]">
                      <p className="text-xl font-medium text-[var(--foreground)]">{cls.startTime}</p>
                      <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mt-1">{cls.duration} Min</p>
                    </div>
                    <div className="hidden md:block w-px h-10 bg-[var(--border)]"></div>
                    <div>
                      <p className="text-lg font-medium text-[var(--foreground)] mb-1">{cls.name}</p>
                      <p className="text-sm font-light text-[var(--foreground-muted)]">{dateStr}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto border-t border-[var(--border)] md:border-t-0 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-sm text-[var(--foreground)] font-medium">{cls.bookedCount} <span className="text-[var(--foreground-muted)] font-light">/ {cls.capacity}</span></p>
                      <p className={`text-[10px] tracking-widest uppercase mt-1 ${cls.status === 'SCHEDULED' ? 'text-[var(--foreground-muted)]' : 'text-red-700'}`}>
                        {cls.status === 'SCHEDULED' ? 'COMPLETED' : cls.status}
                      </p>
                    </div>
                    {cls.status === 'SCHEDULED' ? (
                      <Link href={`/en/instructor/class/${cls.id}`} className="inline-block border border-[var(--border)] px-6 py-3 rounded-full text-[10px] tracking-widest uppercase text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-white transition-all duration-300 text-center">
                        View Roster
                      </Link>
                    ) : (
                      <div className="px-6 py-3"></div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
