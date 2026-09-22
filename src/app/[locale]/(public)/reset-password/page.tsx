'use client'

import { useActionState, use } from 'react'
import { resetPassword, type ResetState } from '@/app/actions/password'
import PublicNavbar from '@/components/PublicNavbar'
import { Link } from '@/i18n/routing'

export default function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const resolvedParams = use(searchParams)
  const token = resolvedParams.token

  // Bind the token to the action
  const boundReset = resetPassword.bind(null, token || '')
  const [state, formAction, isPending] = useActionState(boundReset, {})

  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col font-sans">
        <PublicNavbar isLoggedIn={false} user={null} />
        <main className="flex-grow flex items-center justify-center p-6 mt-20">
          <div className="text-center">
            <h1 className="text-2xl font-serif mb-4">Invalid Link</h1>
            <p className="text-gray-500 mb-8">Missing reset token.</p>
            <Link href="/forgot-password" className="btn-primary">Request New Link</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col font-sans">
      <PublicNavbar isLoggedIn={false} user={null} />
      
      <main className="flex-grow flex items-center justify-center p-6 mt-20">
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 w-full max-w-md shadow-sm">
          <h1 className="text-3xl font-serif text-[var(--foreground)] mb-2 text-center">Set New Password</h1>
          <p className="text-[var(--foreground-muted)] text-sm mb-8 text-center font-light">
            Enter your new password below.
          </p>

          {state.message ? (
            <div className="text-center">
              <p className="text-[var(--foreground)] font-medium mb-8">{state.message}</p>
              <Link 
                href="/login" 
                className="inline-block bg-[var(--foreground)] text-[var(--background)] px-8 py-3.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors"
              >
                Log In
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-6">
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  className="w-full bg-white/40 border border-white/80 px-6 py-4 rounded-2xl text-sm font-light text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground)] transition-all"
                  placeholder="••••••••"
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
                {isPending ? 'Saving...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
