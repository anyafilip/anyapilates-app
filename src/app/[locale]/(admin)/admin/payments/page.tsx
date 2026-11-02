import { prisma } from '@/lib/prisma'
import { Link } from '@/i18n/routing'
import PaymentActions from './PaymentActions'
import SlipPreview from './SlipPreview'
import DataTableTools from '@/components/admin/DataTableTools'
import Pagination from '@/components/admin/Pagination'
import { Prisma, PayStatus } from '@prisma/client'

export default async function AdminPaymentsPage(props: { searchParams: Promise<{ q?: string, page?: string, status?: string, month?: string }> }) {
  const searchParams = await props.searchParams
  const q = searchParams.q || ''
  const page = parseInt(searchParams.page || '1')
  const VALID_STATUSES: PayStatus[] = ['PENDING', 'PAID', 'FAILED']
  const rawStatus = searchParams.status
  const status = VALID_STATUSES.includes(rawStatus as PayStatus) ? (rawStatus as PayStatus) : undefined
  const selectedMonth = searchParams.month || ''

  // Filter by specific month (e.g. "2026-10")
  let monthFilter: { gte?: Date; lt?: Date } | undefined = undefined
  if (selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)) {
    const [year, month] = selectedMonth.split('-').map(Number)
    monthFilter = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1)
    }
  }

  const where: Prisma.PaymentWhereInput = {
    ...(q ? {
      OR: [
        { refCode: { contains: q, mode: 'insensitive' } },
        { client: { name: { contains: q, mode: 'insensitive' } } },
      ],
    } : {}),
    ...(status ? { status } : {}),
    ...(monthFilter ? { createdAt: monthFilter } : {}),
  }

  const skip = (page - 1) * 20
  const take = 20

  const [payments, totalCount, allPaidPayments] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { client: { select: { name: true, email: true } }, package: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
    // Fetch all paid payments for calculating monthly revenue breakdown pills
    prisma.payment.findMany({
      where: { status: 'PAID' },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
  ])

  // Aggregate revenue by month
  const monthsMap = new Map<string, { key: string; label: string; revenue: number; count: number }>()
  let totalRevenueAllTime = 0

  for (const p of allPaidPayments) {
    const d = new Date(p.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const amountThb = p.amount / 100
    totalRevenueAllTime += amountThb

    const curr = monthsMap.get(key) || { key, label, revenue: 0, count: 0 }
    curr.revenue += amountThb
    curr.count += 1
    monthsMap.set(key, curr)
  }

  const monthlyTabs = Array.from(monthsMap.values())
  const activeMonthStat = selectedMonth ? monthsMap.get(selectedMonth) : null

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Payments</h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
          Review & Confirm Transfers · All-Time Revenue: ฿{totalRevenueAllTime.toLocaleString()}
        </p>
      </div>

      {/* Monthly Revenue Filter Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Link
            href={`/admin/payments${status ? `?status=${status}` : ''}${q ? `${status ? '&' : '?'}q=${q}` : ''}`}
            className={`px-4 py-2 rounded-full text-[10px] md:text-[11px] font-medium uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              !selectedMonth
                ? 'bg-[var(--foreground)] text-white shadow-sm'
                : 'bg-white/60 text-[var(--foreground-muted)] hover:bg-white hover:text-[var(--foreground)] border border-black/5'
            }`}
          >
            All Time · ฿{totalRevenueAllTime.toLocaleString()} ({allPaidPayments.length})
          </Link>
          {monthlyTabs.map(m => (
            <Link
              key={m.key}
              href={`/admin/payments?month=${m.key}${status ? `&status=${status}` : ''}${q ? `&q=${q}` : ''}`}
              className={`px-4 py-2 rounded-full text-[10px] md:text-[11px] font-medium uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                selectedMonth === m.key
                  ? 'bg-[var(--foreground)] text-white shadow-sm'
                  : 'bg-white/60 text-[var(--foreground-muted)] hover:bg-white hover:text-[var(--foreground)] border border-black/5'
              }`}
            >
              {m.label} · ฿{m.revenue.toLocaleString()} ({m.count})
            </Link>
          ))}
        </div>
      </div>

      {/* Active Month Banner */}
      {activeMonthStat && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Viewing {activeMonthStat.label}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Confirmed Revenue: <strong className="text-[var(--foreground)] font-semibold">฿{activeMonthStat.revenue.toLocaleString()}</strong> across {activeMonthStat.count} payments
              </p>
            </div>
          </div>
          <Link
            href={`/admin/payments${status ? `?status=${status}` : ''}${q ? `${status ? '&' : '?'}q=${q}` : ''}`}
            className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] font-medium underline"
          >
            Show All Months
          </Link>
        </div>
      )}

      <DataTableTools
        searchPlaceholder="Search ref code or member name..."
        filterParamName="status"
        filterOptions={[
          { label: 'PENDING', value: 'PENDING' },
          { label: 'PAID', value: 'PAID' },
          { label: 'FAILED', value: 'FAILED' },
        ]}
      />

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                <th className="font-medium py-6 pl-8">Member</th>
                <th className="font-medium py-6">Package</th>
                <th className="font-medium py-6">Amount</th>
                <th className="font-medium py-6">Method</th>
                <th className="font-medium py-6">Ref Code</th>
                <th className="font-medium py-6 text-center">Slip</th>
                <th className="font-medium py-6">Status</th>
                <th className="font-medium py-6 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light text-[var(--foreground)]">
              {payments.map(p => (
                <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                  <td className="py-4 pl-8">
                    <p className="font-medium text-[var(--foreground)]">{p.client.name}</p>
                    <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{p.client.email}</p>
                  </td>
                  <td className="py-4 text-[13px]">{p.package.name}</td>
                  <td className="py-4">฿{(p.amount / 100).toLocaleString()}</td>
                  <td className="py-4">
                    {p.method === 'QR' && <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] tracking-widest uppercase">QR</span>}
                    {p.method === 'COUNTER' && <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] tracking-widest uppercase">Counter</span>}
                  </td>
                  <td className="py-4 font-mono text-[11px]">{p.refCode}</td>
                  <td className="py-4 text-center">
                    <SlipPreview url={p.slipUrl || ''} />
                  </td>
                  <td className="py-4">
                    {p.status === 'PENDING' && <span className="text-[10px] tracking-[0.1em] uppercase text-yellow-600 font-medium">Pending</span>}
                    {p.status === 'PAID' && <span className="text-[10px] tracking-[0.1em] uppercase text-green-700 font-medium">Confirmed</span>}
                    {p.status === 'FAILED' && <span className="text-[10px] tracking-[0.1em] uppercase text-red-700 font-medium" title={p.notes || ''}>Rejected</span>}
                  </td>
                  <td className="py-4 pr-8 text-right">
                    <div className="flex justify-end">
                      {p.status === 'PENDING' ? (
                        <PaymentActions paymentId={p.id} />
                      ) : (
                        <span className="text-[12px] text-[var(--foreground-muted)]">
                          {p.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <p className="text-[var(--foreground-muted)] font-serif italic text-lg">No payments found.</p>
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
