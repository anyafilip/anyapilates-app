import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import MemberNavbar from '@/components/MemberNavbar'
import { redirect } from 'next/navigation'

const TZ_OFFSET = 7

function bangkokDate(utcDate: Date) {
  return new Date(utcDate.getTime() + TZ_OFFSET * 60 * 60 * 1000)
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default async function PurchasesPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  if (!userId) {
    redirect('/en/login')
  }

  const payments = await prisma.payment.findMany({
    where: { clientId: userId },
    include: { package: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="flex-1 w-full flex flex-col h-[100dvh] overflow-hidden bg-[var(--surface)]">
      <MemberNavbar />

      <main className="flex-1 overflow-y-auto w-full">
        <div className="container mx-auto px-6 py-10 max-w-4xl">
          <div className="mb-12">
            <p className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)] mb-2">Member Portal</p>
            <h1 className="text-4xl font-serif font-normal text-[var(--foreground)]">
              Purchase History
            </h1>
          </div>

          {payments.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[var(--border)] rounded-lg">
              <p className="text-[var(--foreground-muted)] font-light mb-4">No purchases found.</p>
              <Link href="/en/#packages" className="text-[var(--accent)] text-sm underline underline-offset-4">
                Buy a package →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-sm">
              {payments.map(payment => (
                <Link
                  key={payment.id} 
                  href={payment.status === 'PENDING' ? `/en/buy-credits/pending?paymentId=${payment.id}` : '#'}
                  className={`py-5 flex items-center justify-between gap-4 transition-colors ${payment.status === 'PENDING' ? 'hover:bg-black/5 rounded-lg px-2 -mx-2' : ''}`}
                >
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {payment.package.name}
                      {payment.status === 'PENDING' && (
                        <span className="inline-block ml-2 w-2 h-2 rounded-full bg-[var(--foreground-muted)] animate-pulse"></span>
                      )}
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                      {bangkokDate(payment.createdAt)} · {payment.refCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-lg text-[var(--foreground)]">฿{(payment.amount / 100).toLocaleString('en-US')}</p>
                    <span className={`text-[10px] tracking-widest uppercase ${
                      payment.status === 'PAID' ? 'text-green-600' :
                      payment.status === 'FAILED' ? 'text-red-600' :
                      'text-[var(--foreground-muted)]'
                    }`}>
                      {payment.status} {payment.status === 'PENDING' ? '→' : ''}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
