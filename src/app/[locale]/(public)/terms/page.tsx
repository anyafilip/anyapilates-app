import { auth } from '@/auth'
import PublicNavbar from '@/components/PublicNavbar'
import { Link } from '@/i18n/routing'
import { prisma } from '@/lib/prisma'
import { getLocale } from 'next-intl/server'

export default async function TermsPage() {
  const session = await auth()
  const user = session?.user as any
  const locale = await getLocale()
  const settings = await prisma.studioSettings.findUnique({ where: { id: 'default' } })
  const content = locale === 'th' ? settings?.termsContentTh : settings?.termsContentEn

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[var(--background)]">
      <PublicNavbar isLoggedIn={!!user} user={user} />
      
      <main className="flex-1 container mx-auto px-6 pt-32 pb-24 max-w-3xl">
        <div className="mb-12">
          <Link href="/" className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors border-b border-transparent hover:border-[var(--foreground)] pb-1">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-serif text-[var(--foreground)] mb-4">Terms & Conditions</h1>
        <p className="text-sm text-[var(--foreground-muted)] mb-12">Last Updated: September 2026</p>

        {content ? (
          <div className="space-y-8 text-[var(--foreground)] font-light leading-relaxed prose prose-stone max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="space-y-8 text-[var(--foreground)] font-light leading-relaxed">
            <section>
              <h2 className="text-xl font-serif mb-4">1. Introduction</h2>
              <p>Welcome to Anya Pilates Studio. By booking a class, purchasing a package, or using our studio facilities, you agree to comply with and be bound by the following Terms and Conditions.</p>
            </section>
            <section>
              <h2 className="text-xl font-serif mb-4">2. Booking & Cancellation Policy</h2>
              <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
                <li>Cancellations must be made at least <strong>12 hours</strong> prior to the class start time.</li>
                <li>Late cancellations or no-shows will result in the forfeiture of one class credit.</li>
              </ul>
            </section>
            {/* Default truncated for brevity, admins will provide the real one in settings */}
          </div>
        )}
      </main>
    </div>
  )
}
