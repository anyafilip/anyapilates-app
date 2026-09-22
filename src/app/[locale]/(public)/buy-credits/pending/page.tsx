import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import PublicNavbar from '@/components/PublicNavbar'
import SlipUpload from './SlipUpload'

export default async function PendingPaymentPage({ searchParams }: { searchParams: Promise<{ paymentId?: string }> }) {
  const resolvedSearchParams = await searchParams
  const paymentId = resolvedSearchParams.paymentId

  const session = await auth()
  const user = session?.user as any

  if (!user) {
    redirect('/en/login')
  }

  if (!paymentId) {
    redirect('/en/#packages')
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { package: { include: { classType: true } }, client: { select: { name: true } } }
  })

  if (!payment || payment.clientId !== user.id) {
    redirect('/en/')
  }

  const settings = await prisma.studioSettings.findUnique({ where: { id: 'default' } })

  return (
    <div className="flex-1 w-full flex flex-col relative min-h-screen">
      <PublicNavbar isLoggedIn={true} user={user} />

      <main className="flex-1 container mx-auto px-6 pt-32 pb-16 max-w-lg flex flex-col justify-center">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-12 text-center">Payment Status</h1>

        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="text-center mb-10">
            {payment.status === 'PENDING' && !payment.slipUrl && (
              <p className="text-[13px] italic font-serif text-[var(--foreground-muted)]">
                {payment.method === 'COUNTER' ? 'Awaiting payment at counter' : 'Awaiting your transfer'}
              </p>
            )}
            {payment.status === 'PENDING' && payment.slipUrl && (
              <p className="text-[13px] italic font-serif text-[var(--foreground-muted)]">Slip submitted — awaiting admin confirmation</p>
            )}
            {payment.status === 'PAID' && (
              <p className="text-[13px] font-medium text-[var(--foreground)] flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Payment Confirmed
              </p>
            )}
            {payment.status === 'FAILED' && (
              <p className="text-[13px] font-medium text-red-700 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                {payment.notes || 'Payment failed'}
              </p>
            )}
          </div>

          <div className="text-center mb-8">
            <p className="text-[9px] tracking-widest uppercase text-[var(--foreground-muted)] mb-2">Order Reference</p>
            <h2 className="text-3xl font-serif font-normal text-[var(--foreground)] tracking-wide">{payment.refCode}</h2>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center pb-4 border-b border-black/5">
              <span className="text-sm font-light text-[var(--foreground)]">{payment.package.name}</span>
              <span className="text-sm font-medium text-[var(--foreground)]">{payment.package.classCount} <span className="text-[9px] text-[var(--foreground-muted)] ml-1 uppercase font-normal tracking-widest">{payment.package.classType.name}</span></span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)]">Total Amount</span>
              <span className="text-2xl font-serif font-normal text-[var(--foreground)]">฿{(payment.amount / 100).toLocaleString('en-US')}</span>
            </div>
          </div>

          {payment.status === 'PENDING' && !payment.slipUrl && (
            <>
              {payment.method === 'COUNTER' ? (
                <div className="bg-white/40 rounded-2xl p-6 border border-white/80 text-center space-y-4">
                  <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">Instructions</p>
                  <p className="text-sm font-light text-[var(--foreground)]">
                    Please proceed to the studio counter to complete your payment. Show your <strong className="font-serif">Order Reference ({payment.refCode})</strong> to the receptionist.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white/40 rounded-2xl p-6 border border-white/80 text-center space-y-4">
                    <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">Payment Instructions</p>
                    
                    {settings?.qrCodeUrl && (
                      <div className="flex justify-center my-4">
                        <img src={settings.qrCodeUrl} alt="PromptPay QR Code" className="w-48 h-48 object-contain rounded-xl border border-black/5 bg-white shadow-sm" />
                      </div>
                    )}
                    
                    <div className="text-sm font-light text-[var(--foreground)]">
                      <p>PromptPay / Bank Transfer</p>
                      <p className="mt-2 text-[var(--foreground-muted)]">Account: <span className="text-[var(--foreground)]">Anya Pilates Studio</span></p>
                    </div>
                    <div className="pt-4 border-t border-white flex flex-col gap-1">
                      <span className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">Amount</span>
                      <span className="text-xl font-serif text-[var(--foreground)]">฿{(payment.amount / 100).toLocaleString('en-US')}</span>
                      <span className="text-[11px] italic text-[var(--foreground-muted)] mt-2">Include {payment.refCode} in transfer note</span>
                    </div>
                  </div>
                  <SlipUpload paymentId={payment.id} />
                </>
              )}
            </>
          )}

          {payment.slipUrl && payment.status === 'PENDING' && payment.method === 'QR' && (
            <div className="mt-8 flex flex-col items-center">
              <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mb-4">Uploaded Slip</p>
              <img src={payment.slipUrl} alt="Payment Slip" className="w-32 h-32 object-cover rounded-xl border border-black/5 shadow-sm" />
            </div>
          )}

          {payment.status === 'PAID' ? (
            <div className="mt-8">
              <Link href="/account" className="w-full bg-[var(--foreground)] text-[var(--background)] py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm flex items-center justify-center">
                View My Account
              </Link>
            </div>
          ) : (
            <div className="mt-10 flex justify-center">
              <Link href="/" className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors border-b border-transparent hover:border-[var(--foreground)] pb-1">
                ← Return to Home
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
