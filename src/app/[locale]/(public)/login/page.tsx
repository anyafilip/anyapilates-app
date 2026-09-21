'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { login, type LoginState } from '@/app/actions/auth'
import LanguageToggle from '@/components/LanguageToggle'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, {})
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get('callbackUrl') ?? '/en'

  return (
    <div className="flex-1 w-full flex flex-col md:flex-row bg-[var(--background)]">
      {/* Left side – decorative panel */}
      <div className="hidden md:flex md:w-1/2 relative bg-[var(--surface)] overflow-hidden items-center justify-center">
        <div className="text-center px-12">
          <h2 className="font-serif text-5xl font-normal text-[var(--foreground)] opacity-30 italic leading-relaxed">
            Move.<br />Breathe.<br />Transform.
          </h2>
        </div>
      </div>

      {/* Right side – form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative">
        <div className="absolute top-8 right-8">
          <LanguageToggle />
        </div>

        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="mb-10 text-center select-none">
            <Link href="/en">
              <h1 className="text-2xl tracking-[0.3em] uppercase font-light text-[var(--foreground)]">ANYA</h1>
              <p className="text-[9px] tracking-[0.4em] uppercase mt-1 text-[var(--foreground-muted)]">Pilates</p>
            </Link>
          </div>

          <h2 className="font-serif text-3xl font-normal text-[var(--foreground)] mb-8 text-center">
            Welcome Back
          </h2>

          {/* ── Google SSO ──────────────────────────────────────────── */}
          <button
            onClick={() => signIn('google', { callbackUrl })}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-[var(--border)] text-sm font-light text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors mb-6"
          >
            {/* Google logo SVG */}
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M43.611 20.083H42V20H24v8h11.303C33.96 32.513 29.396 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.804 0 5.35 1.059 7.283 2.783l5.657-5.657C33.93 7.31 29.22 5 24 5 12.954 5 4 13.954 4 25s8.954 20 20 20c11.046 0 19.895-8.954 19.895-20 0-1.343-.138-2.655-.384-3.917Z" fill="#FFC107"/>
              <path d="m6.306 15.691 6.571 4.819C14.655 17.108 19.001 14 24 14c2.804 0 5.35 1.059 7.283 2.783l5.657-5.657C33.93 7.31 29.22 5 24 5c-7.682 0-14.344 4.337-17.694 10.691Z" fill="#FF3D00"/>
              <path d="M24 45c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.379 0-9.926-3.464-11.283-8.211l-6.522 5.025C9.505 40.556 16.227 45 24 45Z" fill="#4CAF50"/>
              <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 25c0-1.343-.138-2.655-.389-3.917Z" fill="#1976D2"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[var(--border)]"></div>
            <span className="text-xs text-[var(--foreground-muted)] tracking-widest uppercase">or</span>
            <div className="flex-1 h-px bg-[var(--border)]"></div>
          </div>

          {/* ── Credentials form ────────────────────────────────────── */}
          <form action={action} className="space-y-6">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />

            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="studio-input"
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="block text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">
                  Password
                </label>
                <Link href="/en/forgot-password" className="text-[10px] tracking-widest uppercase text-[var(--foreground)] hover:underline">
                  Forgot?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="studio-input"
              />
            </div>

            {state.message && (
              <p className="text-xs text-red-700 text-center">{state.message}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full mt-2"
            >
              {isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <div className="h-px bg-[var(--border)] w-full mb-6"></div>
            <p className="text-sm text-[var(--foreground-muted)]">
              No account?{' '}
              <Link href="/en/register" className="text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
