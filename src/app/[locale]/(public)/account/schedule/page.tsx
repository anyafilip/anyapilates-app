import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import MemberNavbar from '@/components/MemberNavbar'
import FullScheduleTable from '@/components/FullScheduleTable'

export const dynamic = 'force-dynamic'

export default async function FullSchedulePage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  if (!userId) {
    redirect('/en/login')
  }

  const role = (session?.user as any)?.role

  const now = new Date()
  // Fetch up to 60 days ahead for the full schedule
  const futureLimit = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  const [classes, bookings] = await Promise.all([
    prisma.class.findMany({
      where: {
        status: 'SCHEDULED',
        date: { gte: now, lte: futureLimit },
      },
      include: {
        classType: {
          select: {
            id: true,
            name: true,
            nameTh: true,
            description: true,
            descriptionTh: true,
          },
        },
        instructor: {
          select: {
            name: true,
            bio: true,
            imageUrl: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.booking.findMany({
      where: { clientId: userId, status: 'BOOKED' },
      select: { classId: true },
    }),
  ])

  const bookedClassIds = bookings.map(b => b.classId)

  return (
    <div className="fixed inset-0 z-40 flex flex-col w-full bg-[var(--surface)]">
      <MemberNavbar />

      <main className="flex-1 overflow-y-auto w-full">
        <div className="container mx-auto px-4 sm:px-6 py-8 md:py-10 max-w-5xl">
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-5xl font-serif font-normal text-[var(--foreground)]">
              Full Schedule
            </h1>
            <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-1.5 font-light">
              Explore and reserve upcoming reformer and mat classes.
            </p>
          </div>

          <FullScheduleTable
            classes={classes}
            bookedClassIds={bookedClassIds}
            isLoggedIn={true}
            userRole={role}
          />
        </div>
      </main>
    </div>
  )
}
