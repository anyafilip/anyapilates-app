import { prisma } from '@/lib/prisma'
import PaymentActions from './PaymentActions'
import SlipPreview from './SlipPreview'
import DataTableTools from '@/components/admin/DataTableTools'
import Pagination from '@/components/admin/Pagination'
import { Prisma, PayStatus } from '@prisma/client'

export default async function AdminPaymentsPage(props: { searchParams: Promise<{ q?: string, page?: string, status?: string }> }) {
  const searchParams = await props.searchParams
  const q = searchParams.q || ''
  const page = parseInt(searchParams.page || '1')
  const status = searchParams.status

  const where: Prisma.PaymentWhereInput = {
    ...(q ? {
      OR: [
        { refCode: { contains: q, mode: 'insensitive' } },
        { client: { name: { contains: q, mode: 'insensitive' } } },
      ],
    } : {}),
    ...(status ? { status: status as PayStatus } : {}),
  }

  const skip = (page - 1) * 20
  const take = 20

  const [payments, totalCount] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { client: { select: { name: true, email: true } }, package: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
  ])

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Payments</h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Review & Confirm Transfers</p>
      </div>

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
