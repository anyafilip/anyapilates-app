import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import PublicNavbar from '@/components/PublicNavbar'

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const resolvedParams = await searchParams
  const token = resolvedParams.token

  let status: 'success' | 'invalid' | 'expired' = 'invalid'

  if (token) {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (verificationToken) {
      if (verificationToken.expires < new Date()) {
        status = 'expired'
      } else {
        await prisma.user.update({
          where: { email: verificationToken.email },
          data: { emailVerified: new Date() }
        })
        await prisma.verificationToken.delete({
          where: { id: verificationToken.id }
        })
        status = 'success'
      }
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col font-sans">
      <PublicNavbar isLoggedIn={false} user={null} />
      
      <main className="flex-grow flex items-center justify-center p-6 mt-20">
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 w-full max-w-md text-center shadow-sm">
          {status === 'success' && (
            <>
              <h1 className="text-3xl font-serif text-[var(--foreground)] mb-4">Email Verified</h1>
              <p className="text-[var(--foreground-muted)] mb-8">
                Your email has been successfully verified. You can now log in to your account.
              </p>
              <Link 
                href="/en/login" 
                className="inline-block bg-[var(--foreground)] text-[var(--background)] px-8 py-3.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors"
              >
                Log In
              </Link>
            </>
          )}

          {status === 'expired' && (
            <>
              <h1 className="text-3xl font-serif text-[var(--foreground)] mb-4">Link Expired</h1>
              <p className="text-[var(--foreground-muted)] mb-8">
                This verification link has expired. Please try registering or logging in again to request a new link.
              </p>
              <Link 
                href="/en/login" 
                className="inline-block border border-[var(--border)] text-[var(--foreground)] px-8 py-3.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black/5 transition-colors"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === 'invalid' && (
            <>
              <h1 className="text-3xl font-serif text-[var(--foreground)] mb-4">Invalid Link</h1>
              <p className="text-[var(--foreground-muted)] mb-8">
                This verification link is invalid. It may have already been used.
              </p>
              <Link 
                href="/en/login" 
                className="inline-block border border-[var(--border)] text-[var(--foreground)] px-8 py-3.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black/5 transition-colors"
              >
                Go to Login
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
