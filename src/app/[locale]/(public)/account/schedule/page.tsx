import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'
import MemberNavbar from '@/components/MemberNavbar'
import BookButton from '@/components/BookButton'
import ClassNameDisplay from '@/components/ClassNameDisplay'
import DataTableTools from '@/components/admin/DataTableTools'
import Pagination from '@/components/admin/Pagination'
import ScheduleDatePicker from '@/components/ScheduleDatePicker'

const TZ_OFFSET = 7

function bangkokDate(utcDate: Date) {
  return new Date(utcDate.getTime() + TZ_OFFSET * 60 * 60 * 1000)
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

const CUTOFF_MS = 12 * 60 * 60 * 1000

export default async function FullSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; filter?: string; sort?: string; day?: string; date?: string }>
}) {
  const session = await auth()
  const userId = (session?.user as any)?.id

  if (!userId) {
    redirect('/en/login')
  }

  const role = (session?.user as any)?.role

  const resolvedParams = await searchParams
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1
  const q = resolvedParams.q || ''
  const filter = resolvedParams.filter || ''
  const sort = resolvedParams.sort || 'date_asc'
  const dayParam = resolvedParams.day
  const dateParam = resolvedParams.date
  
  const take = 20
  const skip = (page - 1) * take

  const now = new Date()

  // Limit to next 60 days to prevent massive payloads and slow queries
  const futureLimit = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const where: any = {
    status: 'SCHEDULED',
    date: { gte: now, lte: futureLimit },
  }

  // If specific date is picked, filter specifically for that full Bangkok day
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    const [y, m, d] = dateParam.split('-').map(Number)
    const startOfTargetDay = new Date(Date.UTC(y, m - 1, d, 0 - TZ_OFFSET, 0, 0))
    const endOfTargetDay = new Date(Date.UTC(y, m - 1, d, 24 - TZ_OFFSET, 0, 0, -1))
    where.date = { gte: startOfTargetDay, lte: endOfTargetDay }
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { classType: { name: { contains: q, mode: 'insensitive' } } },
      { instructor: { name: { contains: q, mode: 'insensitive' } } }
    ]
  }

  if (filter) {
    where.classTypeId = filter
  }

  const orderBy: any = sort === 'date_desc' 
    ? [{ date: 'desc' }, { startTime: 'desc' }] 
    : [{ date: 'asc' }, { startTime: 'asc' }]

  let [allClasses, bookings, classTypes] = await Promise.all([
    prisma.class.findMany({
      where,
      include: {
        classType: {
          select: {
            id: true,
            name: true,
            nameTh: true,
            description: true,
            descriptionTh: true,
          }
        },
        instructor: { select: { name: true } },
      },
      orderBy,
    }),
    prisma.booking.findMany({
      where: { clientId: userId, status: 'BOOKED' },
      select: { classId: true },
    }),
    prisma.classType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  ])

  if (dayParam && dayParam !== 'ALL') {
    const targetDay = parseInt(dayParam, 10)
    allClasses = allClasses.filter(c => {
      // Bangkok TZ adjustment for accurate day calculation
      const localDate = new Date(c.date.getTime() + TZ_OFFSET * 60 * 60 * 1000)
      return localDate.getUTCDay() === targetDay
    })
  }

  const totalCount = allClasses.length
  const classes = allClasses.slice(skip, skip + take)

  const bookedClassIds = new Set(bookings.map(b => b.classId))

  return (
    <div className="fixed inset-0 z-40 flex flex-col w-full bg-[var(--surface)]">
      <MemberNavbar />

      <main className="flex-1 overflow-y-auto w-full">
        <div className="container mx-auto px-6 py-10 max-w-5xl">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)]">
              Full Schedule
            </h1>
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <DataTableTools 
              searchPlaceholder="Search classes or instructors..."
              filterOptions={classTypes.map(ct => ({ label: ct.name, value: ct.id }))}
              filterPlaceholder="All Class Types"
              sortOptions={[
                { label: 'Date: Upcoming First', value: 'date_asc' },
                { label: 'Date: Furthest First', value: 'date_desc' }
              ]}
            >
              <ScheduleDatePicker selectedDate={dateParam} />
            </DataTableTools>
            {/* Secondary filter bar for Day of Week */}
            <DataTableTools 
              hideSearch={true}
              filterParamName="day"
              filterPlaceholder="All Days"
              filterOptions={[
                { label: 'Sunday', value: '0' },
                { label: 'Monday', value: '1' },
                { label: 'Tuesday', value: '2' },
                { label: 'Wednesday', value: '3' },
                { label: 'Thursday', value: '4' },
                { label: 'Friday', value: '5' },
                { label: 'Saturday', value: '6' },
              ]}
            />
          </div>

          {dateParam && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl px-5 py-3.5 mb-6 shadow-sm gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[var(--foreground-muted)]">Showing Date:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {new Date(dateParam + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <Link
                href="/account/schedule"
                className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] underline underline-offset-4 uppercase tracking-wider transition-colors"
              >
                Clear Date (Show All)
              </Link>
            </div>
          )}

          <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
            {/* ── Mobile Card List (under md) ── */}
            <div className="block md:hidden divide-y divide-[var(--border)]">
              {classes.map(cls => {
                const isBooked = bookedClassIds.has(cls.id)
                const isPast = Date.now() + CUTOFF_MS > new Date(cls.date).getTime()
                const isFull = cls.bookedCount >= cls.capacity
                const spotsLeft = cls.capacity - cls.bookedCount

                return (
                  <div key={cls.id} className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-medium text-[var(--foreground)] tracking-tight">
                          {cls.startTime}–{cls.endTime}
                        </span>
                        <span className="text-[11px] text-[var(--foreground-muted)]">
                          · {bangkokDate(cls.date)}
                        </span>
                      </div>
                      {isFull ? (
                        <span className="text-[10px] tracking-widest uppercase text-red-500 font-medium px-2.5 py-0.5 rounded-full bg-red-500/10">
                          Full
                        </span>
                      ) : (
                        <span className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] font-medium px-2.5 py-0.5 rounded-full bg-black/5">
                          {spotsLeft} Left
                        </span>
                      )}
                    </div>

                    <div>
                      <ClassNameDisplay name={cls.name} nameTh={cls.classType?.nameTh} classTypeName={cls.classType?.name} classTypeNameTh={cls.classType?.nameTh} size="sm" />
                      <p className="text-xs text-[var(--foreground-muted)] mt-1">
                        Instructor: <span className="text-[var(--foreground)] font-medium">{cls.instructor?.name ?? '—'}</span>
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] text-[var(--foreground-muted)]">
                        {cls.duration} min
                      </span>
                      {isBooked ? (
                        <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--accent)] font-medium px-4 py-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5">
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
                    </div>
                  </div>
                )
              })}

              {classes.length === 0 && (
                <div className="py-16 px-4 text-center">
                  <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">
                    {dateParam ? 'No classes scheduled for this date.' : 'No classes found.'}
                  </p>
                  {dateParam && (
                    <Link
                      href="/account/schedule"
                      className="text-xs text-[var(--accent)] hover:underline uppercase tracking-wider font-medium"
                    >
                      View all upcoming classes →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* ── Desktop Table (md and above) ── */}
            <div className="hidden md:block overflow-x-auto">
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
                        <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">
                          {dateParam ? 'No classes scheduled for this date.' : 'No classes found.'}
                        </p>
                        {dateParam && (
                          <Link
                            href="/account/schedule"
                            className="text-xs text-[var(--accent)] hover:underline uppercase tracking-wider font-medium"
                          >
                            View all upcoming classes →
                          </Link>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <Pagination totalCount={totalCount} pageSize={take} />
          </div>
        </div>
      </main>
    </div>
  )
}
