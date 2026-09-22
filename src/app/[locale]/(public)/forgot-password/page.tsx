'use client'

import { useActionState } from 'react'
import { requestPasswordReset, type ForgotState } from '@/app/actions/password'
import PublicNavbar from '@/components/PublicNavbar'
import { Link } from '@/i18n/routing'

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, {})

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col font-sans">
      <PublicNavbar isLoggedIn={false} user={null} />
      
      <main className="flex-grow flex items-center justify-center p-6 mt-20">
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 w-full max-w-md shadow-sm">
          <h1 className="text-3xl font-serif text-[var(--foreground)] mb-2 text-center">Forgot Password</h1>
          <p className="text-[var(--foreground-muted)] text-sm mb-8 text-center font-light">
            Enter your email and we'll send you a reset link.
          </p>

          {state.message ? (
            <div className="text-center">
              <p className="text-[var(--foreground)] font-medium mb-8">{state.message}</p>
              <Link 
                href="/login" 
                className="inline-block bg-[var(--foreground)] text-[var(--background)] px-8 py-3.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-6">
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full bg-white/40 border border-white/80 px-6 py-4 rounded-2xl text-sm font-light text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground)] transition-all"
                  placeholder="name@example.com"
                />
              </div>

              {state.error && (
                <p className="text-red-500 text-sm pl-2">{state.error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[var(--foreground)] text-[var(--background)] px-8 py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors disabled:opacity-50"
              >
                {isPending ? 'Sending...' : 'Send Reset Link'}
              </button>

              <p className="text-center text-sm text-[var(--foreground-muted)] pt-4">
                Remembered?{' '}
                <Link href="/login" className="text-[var(--foreground)] hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
