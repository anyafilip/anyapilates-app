import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PublicNavbar from '@/components/PublicNavbar'
import CheckoutButton from './CheckoutButton'

export default async function BuyCreditsPage({ searchParams }: { searchParams: Promise<{ packageId?: string }> }) {
  const resolvedSearchParams = await searchParams
  const packageId = resolvedSearchParams.packageId

  const session = await auth()
  const user = session?.user as any

  if (!user) {
    redirect('/en/login')
  }

  if (user?.role === 'ADMIN') {
    redirect('/en/#packages')
  }

  if (!packageId) {
    redirect('/en/#packages')
  }

  const pkg = await prisma.package.findUnique({ 
    where: { id: packageId },
    include: { classType: true }
  })

  if (!pkg) {
    redirect('/en/#packages')
  }

  return (
    <div className="flex-1 w-full flex flex-col relative min-h-screen">
      <PublicNavbar isLoggedIn={true} user={user} />

      <main className="flex-1 container mx-auto px-6 pt-32 pb-16 max-w-lg flex flex-col justify-center">
        <Link href="/en/#packages" className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors mb-12 inline-block">
          ← Back to Packages
        </Link>

        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-12 text-center">Checkout</h1>

        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
          {/* Subtle gradient blob for premium feel */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
          
          <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-2 text-center">Order Summary</p>
          <h2 className="text-2xl font-serif font-normal text-[var(--foreground)] mb-8 text-center">{pkg.name}</h2>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center pb-4 border-b border-black/5">
              <span className="text-sm font-light text-[var(--foreground)]">Classes Included</span>
              <span className="text-lg font-medium text-[var(--foreground)]">{pkg.classCount} <span className="text-[10px] text-[var(--foreground-muted)] ml-1 uppercase font-normal tracking-widest">{pkg.classType.name}</span></span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-black/5">
              <span className="text-sm font-light text-[var(--foreground)]">Validity</span>
              <span className="text-sm font-medium text-[var(--foreground)]">{pkg.expiresInDays} Days</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-black/5">
              <span className="text-sm font-light text-[var(--foreground)]">Subtotal</span>
              <span className="text-lg font-light text-[var(--foreground)]">฿{(pkg.price / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)]">Total Amount</span>
              <span className="text-3xl font-serif font-normal text-[var(--foreground)]">฿{(pkg.price / 100).toLocaleString('en-US')}</span>
            </div>
          </div>

          <CheckoutButton packageId={pkg.id} />
          
          <p className="text-[9px] tracking-widest uppercase text-[var(--foreground-muted)] text-center mt-6 leading-relaxed">
            By proceeding, you agree to our terms. Packages are non-refundable.
          </p>
        </div>
      </main>
    </div>
  )
}
