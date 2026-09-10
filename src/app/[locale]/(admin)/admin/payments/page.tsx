import { prisma } from '@/lib/prisma'
import PaymentActions from './PaymentActions'

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: { client: { select: { name: true, email: true } }, package: true },
    orderBy: { createdAt: 'desc' },
  })

  const pendingPayments = payments.filter(p => p.status === 'PENDING')
  const historyPayments = payments.filter(p => p.status !== 'PENDING')

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Payments</h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Review & Confirm Transfers</p>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-serif font-normal text-[var(--foreground)] mb-6">Pending Approvals</h2>
        
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
                  <th className="font-medium py-6 pr-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-light text-[var(--foreground)]">
                {pendingPayments.map(p => (
                  <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                    <td className="py-4 pl-8">
                      <p className="font-medium text-[var(--foreground)]">{p.client.name}</p>
                      <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{p.client.email}</p>
                    </td>
                    <td className="py-4 text-[13px]">{p.package.name}</td>
                    <td className="py-4">฿{(p.amount / 100).toLocaleString()}</td>
                    <td className="py-4 font-mono text-[11px]">{p.refCode}</td>
                    <td className="py-4 text-center">
                      {p.slipUrl ? (
                        <a href={p.slipUrl} target="_blank" rel="noopener noreferrer" className="inline-block hover:opacity-80 transition-opacity">
                          <img src={p.slipUrl} alt="Slip" className="w-12 h-12 object-cover rounded-lg border border-black/5" />
                        </a>
                      ) : (
                        <span className="text-[var(--foreground-muted)]">—</span>
                      )}
                    </td>
                    <td className="py-4 pr-8 text-right">
                      <div className="flex justify-end">
                        <PaymentActions paymentId={p.id} />
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <p className="text-[var(--foreground-muted)] font-serif italic text-lg">No pending payments.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-serif font-normal text-[var(--foreground)] mb-6">History</h2>
        
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                  <th className="font-medium py-6 pl-8">Member</th>
                  <th className="font-medium py-6">Package</th>
                  <th className="font-medium py-6">Amount</th>
                  <th className="font-medium py-6">Ref Code</th>
                  <th className="font-medium py-6">Status</th>
                  <th className="font-medium py-6 pr-8 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm font-light text-[var(--foreground)]">
                {historyPayments.map(p => (
                  <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                    <td className="py-4 pl-8">
                      <p className="font-medium text-[var(--foreground)]">{p.client.name}</p>
                    </td>
                    <td className="py-4 text-[13px]">{p.package.name}</td>
                    <td className="py-4">฿{(p.amount / 100).toLocaleString()}</td>
                    <td className="py-4 font-mono text-[11px]">{p.refCode}</td>
                    <td className="py-4">
                      {p.status === 'PAID' ? (
                        <span className="text-[10px] tracking-[0.1em] uppercase text-green-700 font-medium">Confirmed</span>
                      ) : (
                        <span className="text-[10px] tracking-[0.1em] uppercase text-red-700 font-medium" title={p.notes || ''}>Rejected</span>
                      )}
                    </td>
                    <td className="py-4 pr-8 text-right text-[12px] text-[var(--foreground-muted)]">
                      {p.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {historyPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <p className="text-[var(--foreground-muted)] font-serif italic text-lg">No payment history.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
