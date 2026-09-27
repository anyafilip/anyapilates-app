import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import InstructorScheduleView from './InstructorScheduleView'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TZ_OFFSET = 7

export default async function InstructorSchedulePage() {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) redirect('/en/login')

  // Bangkok "today" start (UTC representation)
  const nowBkk = new Date(Date.now() + TZ_OFFSET * 60 * 60 * 1000)
  const todayMidnight = new Date(nowBkk)
  todayMidnight.setUTCHours(0, 0, 0, 0)
  const todayStartUTC = new Date(todayMidnight.getTime() - TZ_OFFSET * 60 * 60 * 1000)

  // Fetch 6 weeks ahead
  const sixWeeksAhead = new Date(todayStartUTC.getTime() + 42 * 24 * 60 * 60 * 1000)

  const classes = await prisma.class.findMany({
    where: {
      instructorId: userId,
      date: { gte: todayStartUTC, lt: sixWeeksAhead },
      status: 'SCHEDULED',
    },
    include: {
      classType: { select: { name: true } },
      bookings: {
        where: { status: { not: 'CANCELLED' } },
        include: { client: { select: { name: true } } },
        orderBy: { bookedAt: 'asc' },
      },
    },
    orderBy: { date: 'asc' },
  })

  // Serialise dates to ISO strings for client component
  const serialised = classes.map(c => ({
    ...c,
    date: c.date.toISOString(),
    createdAt: c.createdAt.toISOString(),
    classType: c.classType ? { name: c.classType.name } : null,
    bookings: c.bookings.map(b => ({
      id: b.id,
      status: b.status,
      client: { name: b.client.name },
    })),
  }))

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 border-b border-[var(--border)] pb-6 pt-2">
        <h1 className="text-3xl md:text-4xl font-serif font-light text-[var(--foreground)]">My Schedule</h1>
        <p className="text-sm font-light text-[var(--foreground-muted)] mt-1">Next 6 weeks · Bangkok time</p>
      </div>
      <InstructorScheduleView classes={serialised} />
    </div>
  )
}
