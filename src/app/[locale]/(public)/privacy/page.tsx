import { auth } from '@/auth'
import PublicNavbar from '@/components/PublicNavbar'
import { Link } from '@/i18n/routing'

export default async function PrivacyPage() {
  const session = await auth()
  const user = session?.user as any

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

        <div className="space-y-8 text-[var(--foreground)] font-light leading-relaxed">
          <section>
            <h2 className="text-xl font-serif mb-4">1. Introduction</h2>
            <p>
              Anya Pilates Studio ("we", "our", "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy outlines how we collect, use, and safeguard your information when you use our booking platform and visit our studio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-4">2. Information We Collect</h2>
            <p className="mb-4">
              We may collect the following types of personal data:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
              <li><strong>Identity Data:</strong> First name, last name, profile picture (if provided via Google Single Sign-On).</li>
              <li><strong>Contact Data:</strong> Email address, phone number.</li>
              <li><strong>Transaction Data:</strong> Details about payments (such as uploaded payment slips) and packages purchased. Note: We do not directly collect or store credit card numbers.</li>
              <li><strong>Usage & Booking Data:</strong> Your class attendance history, upcoming bookings, and package balances.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-4">3. How We Use Your Data</h2>
            <p className="mb-4">
              Your personal information is used strictly for the operation of the studio, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
              <li>Creating and managing your member account.</li>
              <li>Processing your bookings, cancellations, and package purchases.</li>
              <li>Sending transactional emails (e.g., booking confirmations, class reminders, and receipts).</li>
              <li>Ensuring the physical safety of our members by keeping emergency contact information (if provided).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-4">4. Third-Party Services (SSO & Hosting)</h2>
            <p>
              We use Google Single Sign-On (SSO) to securely authenticate your account. When you log in with Google, we receive basic profile information (Name and Email) directly from Google. We do not have access to your Google password or private data.
            </p>
            <p className="mt-4">
              Our database and hosting are securely provided by industry-standard cloud providers (such as Amazon Web Services and Supabase). Your data is encrypted in transit and at rest.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-4">5. Data Retention</h2>
            <p>
              We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, or accounting requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-4">6. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the right to request access to, correction of, or deletion of your personal data. If you wish to exercise these rights, please contact our support team.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
