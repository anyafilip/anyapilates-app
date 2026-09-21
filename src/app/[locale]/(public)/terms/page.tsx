import { auth } from '@/auth'
import PublicNavbar from '@/components/PublicNavbar'
import Link from 'next/link'

export default async function TermsPage() {
  const session = await auth()
  const user = session?.user as any

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[var(--background)]">
      <PublicNavbar isLoggedIn={!!user} user={user} />
      
      <main className="flex-1 container mx-auto px-6 pt-32 pb-24 max-w-3xl">
        <div className="mb-12">
          <Link href="/en" className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors border-b border-transparent hover:border-[var(--foreground)] pb-1">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-serif text-[var(--foreground)] mb-4">Terms & Conditions</h1>
        <p className="text-sm text-[var(--foreground-muted)] mb-12">Last Updated: September 2026</p>

        <div className="space-y-8 text-[var(--foreground)] font-light leading-relaxed">
          <section>
            <h2 className="text-xl font-serif mb-4">1. Introduction</h2>
            <p>
              Welcome to Anya Pilates Studio. By booking a class, purchasing a package, or using our studio facilities, you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-4">2. Booking & Cancellation Policy</h2>
            <p className="mb-4">
              All classes must be booked in advance through our online platform. We operate a strict cancellation policy to ensure fairness to all members:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
              <li>Cancellations must be made at least <strong>12 hours</strong> prior to the class start time.</li>
              <li>Late cancellations or no-shows will result in the forfeiture of one class credit from your active package.</li>
              <li>If you arrive more than 10 minutes late, you may be denied entry to prevent disruption to the class and for your own physical safety.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-4">3. Packages & Payments</h2>
            <p className="mb-4">
              All purchases are final. Class packages are non-refundable and non-transferable between individuals.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
              <li>Packages expire exactly on their stated expiration date. Extensions are only granted in the event of severe medical conditions (with a doctor's note).</li>
              <li>Introductory packages are strictly limited to one per person and are for new clients only.</li>
              <li>Payments made via QR PromptPay are subject to manual verification by our administrative team before credits are applied to your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-4">4. Health, Safety & Liability</h2>
            <p className="mb-4">
              Pilates involves physical exertion. By participating, you acknowledge and assume all risks associated with physical exercise.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--foreground-muted)]">
              <li>You must inform your instructor of any injuries, medical conditions, or pregnancies before the class begins.</li>
              <li>Anya Pilates Studio and its instructors are not liable for any personal injury, loss, or damage to personal property while on the premises.</li>
              <li>For hygiene and safety on the Reformer machines, <strong>grip socks are strictly required</strong> for all classes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-4">5. Studio Etiquette</h2>
            <p>
              Please respect the tranquil environment of the studio. Mobile phones must be silenced during class. We ask that you wipe down your machine and equipment after use with the provided cleaning supplies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-4">6. Amendments</h2>
            <p>
              Anya Pilates reserves the right to amend these Terms & Conditions, class schedules, pricing, and instructors at any time. Changes will be reflected on this page.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
