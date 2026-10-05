import { auth } from '@/auth'
import PublicNavbar from '@/components/PublicNavbar'
import { Link } from '@/i18n/routing'
import { prisma } from '@/lib/prisma'
import { getLocale } from 'next-intl/server'

export default async function PrivacyPage() {
  const session = await auth()
  const user = session?.user as any
  const locale = await getLocale()
  const settings = await prisma.studioSettings.findUnique({ where: { id: 'default' } })
  const content = locale === 'th' ? settings?.policyContentTh : settings?.policyContentEn

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[var(--background)]">
      <PublicNavbar isLoggedIn={!!user} user={user} />
      
      <main className="flex-1 container mx-auto px-6 pt-32 pb-24 max-w-3xl">
        <div className="mb-12">
          <Link href="/" className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors border-b border-transparent hover:border-[var(--foreground)] pb-1">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-serif text-[var(--foreground)] mb-4">Privacy Policy</h1>
        <p className="text-sm text-[var(--foreground-muted)] mb-12">Last Updated: September 2026</p>

        {content ? (
          <div className="space-y-8 text-[var(--foreground)] font-light leading-relaxed prose prose-stone max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="space-y-8 text-[var(--foreground)] font-light leading-relaxed">
            <section>
              <h2 className="text-xl font-serif mb-4">1. Data Collection</h2>
              <p>We collect personal information such as your name, email address, phone number, and emergency contact details when you register.</p>
            </section>
            {/* Default truncated for brevity, admins will provide the real one in settings */}
          </div>
        )}
      </main>
    </div>
  )
}
