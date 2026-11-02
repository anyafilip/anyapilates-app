import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import MemberNavbar from '@/components/MemberNavbar'
import { redirect } from 'next/navigation'
import ClassHistoryTable from './ClassHistoryTable'

export const dynamic = 'force-dynamic'

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
    include: {
      class: {
        include: {
          classType: {
            select: {
              id: true,
              name: true,
              nameTh: true,
            },
          },
          instructor: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [
      { class: { date: 'desc' } },
      { class: { startTime: 'desc' } },
    ],
  })

  return (
    <div className="fixed inset-0 z-40 flex flex-col w-full bg-[var(--surface)]">
      <MemberNavbar />

      <main className="flex-1 overflow-y-auto w-full">
        <div className="container mx-auto px-4 sm:px-6 py-8 md:py-10 max-w-5xl">
          <div className="mb-6 md:mb-8">
            <p className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)] mb-1.5 font-normal">
              Member Portal
            </p>
            <h1 className="text-3xl md:text-5xl font-serif font-normal text-[var(--foreground)]">
              Class History
            </h1>
            <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-1.5 font-light">
              View your past attendance, sessions, and bookings.
            </p>
          </div>

          <ClassHistoryTable bookings={pastBookings} />
        </div>
      </main>
    </div>
  )
}
