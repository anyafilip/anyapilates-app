import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'
import MemberNavbar from '@/components/MemberNavbar'
import BookButton from '@/components/BookButton'
import ClassNameDisplay from '@/components/ClassNameDisplay'

const TZ_OFFSET = 7

function bangkokDate(utcDate: Date) {
  return new Date(utcDate.getTime() + TZ_OFFSET * 60 * 60 * 1000)
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

const CUTOFF_MS = 12 * 60 * 60 * 1000

export default async function FullSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()
  const userId = (session?.user as any)?.id

  if (!userId) {
    redirect('/en/login')
  }

  const role = (session?.user as any)?.role

  const resolvedParams = await searchParams
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1
  const take = 30
  const skip = (page - 1) * take

  const now = new Date()

  const [classes, totalCount, bookings] = await Promise.all([
    prisma.class.findMany({
      where: {
        status: 'SCHEDULED',
        date: { gte: now },
      },
      include: {
        classType: true,
        instructor: { select: { name: true } },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ],
      take,
      skip,
    }),
    prisma.class.count({
      where: {
        status: 'SCHEDULED',
        date: { gte: now },
      }
    }),
    prisma.booking.findMany({
      where: { clientId: userId, status: 'BOOKED' },
      select: { classId: true },
    })
  ])

  const bookedClassIds = new Set(bookings.map(b => b.classId))

  const totalPages = Math.max(1, Math.ceil(totalCount / take))

  return (
    <div className="fixed inset-0 z-40 flex flex-col w-full bg-[var(--surface)]">
      <MemberNavbar />

      <main className="flex-1 overflow-y-auto w-full">
        <div className="container mx-auto px-6 py-10 max-w-5xl">
          <div className="mb-12">
            <p className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)] mb-2">Member Portal</p>
            <h1 className="text-4xl font-serif font-normal text-[var(--foreground)]">
              Full Schedule
            </h1>
          </div>

          <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                    <th className="font-medium py-6 pl-8">Class &amp; Date</th>
                    <th className="font-medium py-6">Instructor</th>
                    <th className="font-medium py-6">Availability</th>
                    <th className="font-medium py-6 pr-8 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-light text-[var(--foreground)] divide-y divide-[var(--border)]">
                  {classes.map(cls => {
                    const isBooked = bookedClassIds.has(cls.id)
                    const isPast = Date.now() + CUTOFF_MS > new Date(cls.date).getTime()
                    const isFull = cls.bookedCount >= cls.capacity
                    const spotsLeft = cls.capacity - cls.bookedCount

                    return (
                      <tr key={cls.id} className="hover:bg-white/20 transition-colors">
                        <td className="py-5 pl-8">
                          <ClassNameDisplay name={cls.name} nameTh={cls.classType?.nameTh} classTypeName={cls.classType?.name} classTypeNameTh={cls.classType?.nameTh} size="sm" />
                          <p className="text-[11px] text-[var(--foreground-muted)] mt-1">
                            {bangkokDate(cls.date)} · {cls.startTime}–{cls.endTime}
                          </p>
                        </td>
                        <td className="py-5">{cls.instructor?.name ?? '—'}</td>
                        <td className="py-5">
                          {isFull ? (
                            <span className="text-[11px] tracking-widest uppercase text-red-500/70 font-medium">Full</span>
                          ) : (
                            <span className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)]">
                              {spotsLeft} Spot{spotsLeft !== 1 ? 's' : ''} Left
                            </span>
                          )}
                        </td>
                        <td className="py-5 pr-8 text-right">
                          {isBooked ? (
                            <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--accent)] font-medium">
                              Reserved
                            </span>
                          ) : (
                            <BookButton 
                              classId={cls.id}
                              isLoggedIn={true}
                              isFull={isFull}
                              isPast={isPast}
                              userRole={role}
                            />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {classes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-16 text-center">
                        <p className="text-[var(--foreground-muted)] font-serif italic text-lg">
                          No classes scheduled.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-8 py-6 border-t border-[var(--border)] bg-white/20">
                <p className="text-[11px] tracking-widest text-[var(--foreground-muted)] uppercase">
                  Showing {skip + 1} to {Math.min(skip + take, totalCount)} of {totalCount}
                </p>
                <div className="flex gap-2">
                  {page > 1 ? (
                    <Link href={`/account/schedule?page=${page - 1}`} className="px-4 py-2 text-[10px] tracking-widest uppercase border border-[var(--border)] rounded-full hover:bg-white/40 transition-colors text-[var(--foreground)]">
                      Previous
                    </Link>
                  ) : (
                    <span className="px-4 py-2 text-[10px] tracking-widest uppercase border border-[var(--border)] rounded-full opacity-30 text-[var(--foreground)]">
                      Previous
                    </span>
                  )}
                  
                  {page < totalPages ? (
                    <Link href={`/account/schedule?page=${page + 1}`} className="px-4 py-2 text-[10px] tracking-widest uppercase border border-[var(--border)] rounded-full hover:bg-white/40 transition-colors text-[var(--foreground)]">
                      Next
                    </Link>
                  ) : (
                    <span className="px-4 py-2 text-[10px] tracking-widest uppercase border border-[var(--border)] rounded-full opacity-30 text-[var(--foreground)]">
                      Next
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
