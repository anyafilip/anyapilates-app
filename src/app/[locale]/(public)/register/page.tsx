'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register, type RegisterState } from '@/app/actions/auth'
import LanguageToggle from '@/components/LanguageToggle'

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(register, {})

  return (
    <div className="flex-1 w-full flex flex-col md:flex-row bg-[var(--background)]">
      {/* Left side – Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative">
        <div className="absolute top-8 left-8">
          <LanguageToggle />
        </div>

        <div className="w-full max-w-sm mt-8">
          <div className="mb-10 text-center">
            <h1 className="text-3xl tracking-[0.2em] uppercase font-light text-[var(--foreground)]">
              ANYA
            </h1>
          </div>

          <h2 className="font-serif text-3xl font-light text-[var(--foreground)] mb-2 text-center">
            Create Account
          </h2>
          <p className="text-center text-sm text-[var(--foreground-muted)] mb-8">
            Begin your Pilates journey with us.
          </p>

          <form action={action} className="space-y-5">
            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                className="studio-input"
              />
              {state.errors?.name && (
                <p className="text-xs mt-1 text-red-700">{state.errors.name[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="studio-input"
              />
              {state.errors?.email && (
                <p className="text-xs mt-1 text-red-700">{state.errors.email[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">
                Phone <span className="lowercase normal-case opacity-60">(Optional)</span>
              </label>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                className="studio-input"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                className="studio-input"
              />
              {state.errors?.password && (
                <p className="text-xs mt-1 text-red-700">{state.errors.password[0]}</p>
              )}
            </div>

            {state.message && !state.errors && (
              <p className="text-xs text-red-700 mt-2 text-center">
                {state.message}
              </p>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary w-full"
              >
                {isPending ? 'Creating...' : 'Register'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <div className="h-px bg-[var(--border)] w-full mb-6"></div>
            <p className="text-sm text-[var(--foreground-muted)]">
              Already have an account?{' '}
              <Link href="/en/login" className="text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side – Image (Editorial style) */}
      <div className="hidden md:block md:w-1/2 relative bg-[var(--surface)] overflow-hidden">
        <div className="absolute inset-0 bg-[var(--surface)] flex items-center justify-center">
          <p className="font-serif text-3xl text-[var(--foreground-muted)] opacity-50 italic">
            Find your center
          </p>
        </div>
      </div>
    </div>
  )
}
