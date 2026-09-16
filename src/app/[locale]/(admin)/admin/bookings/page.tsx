import { prisma } from '@/lib/prisma'
import DataTableTools from '@/components/admin/DataTableTools'
import Pagination from '@/components/admin/Pagination'
import { Prisma, BookingStatus } from '@prisma/client'

export default async function AdminBookingsPage(props: { searchParams: Promise<{ q?: string, page?: string, status?: string }> }) {
  const searchParams = await props.searchParams
  const q = searchParams.q || ''
  const page = parseInt(searchParams.page || '1')
  const status = searchParams.status

  const where: Prisma.BookingWhereInput = {
    ...(q ? {
      client: { name: { contains: q, mode: 'insensitive' } },
    } : {}),
    ...(status ? { status: status as BookingStatus } : {}),
  }

  const skip = (page - 1) * 20
  const take = 20

  const [bookings, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { bookedAt: 'desc' },
      skip,
      take,
      include: {
        client: { select: { name: true, email: true } },
        class: {
          include: { classType: true },
        },
      },
    }),
    prisma.booking.count({ where }),
  ])

  const TZ_OFFSET = 7
  function bangkokDate(utcDate: Date) {
    const local = new Date(utcDate.getTime() + TZ_OFFSET * 60 * 60 * 1000)
    return {
      date: local.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }),
      time: local.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Bookings</h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Manage all client reservations</p>
      </div>

      <DataTableTools
        searchPlaceholder="Search client name..."
        filterParamName="status"
        filterOptions={[
          { label: 'RESERVED', value: 'BOOKED' },
          { label: 'CANCELLED', value: 'CANCELLED' },
          { label: 'ATTENDED', value: 'ATTENDED' },
        ]}
      />

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                <th className="font-medium py-6 pl-8">Client</th>
                <th className="font-medium py-6">Session</th>
                <th className="font-medium py-6">Status</th>
                <th className="font-medium py-6 pr-8 text-right">Booked On</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light text-[var(--foreground)]">
              {bookings.map(b => {
                const bkk = bangkokDate(b.class.date)
                return (
                  <tr key={b.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                    <td className="py-5 pl-8">
                      <p className="font-medium text-[var(--foreground)]">{b.client.name}</p>
                      <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{b.client.email}</p>
                    </td>
                    <td className="py-5">
                      <p>{b.class.classType?.name || b.class.name}</p>
                      <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{bkk.date} &middot; {bkk.time}</p>
                    </td>
                    <td className="py-5">
                      <span className={b.status === 'BOOKED' ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}>
                        {b.status === 'BOOKED' ? 'Reserved' : b.status === 'CANCELLED' ? 'Cancelled' : b.status === 'ATTENDED' ? 'Attended' : b.status === 'NO_SHOW' ? 'No Show' : b.status}
                      </span>
                    </td>
                    <td className="py-5 pr-8 text-right text-[var(--foreground-muted)]">
                      {bangkokDate(b.bookedAt).date}
                    </td>
                  </tr>
                )
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">No bookings found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination totalCount={totalCount} pageSize={20} />
      </div>
    </div>
  )
}
