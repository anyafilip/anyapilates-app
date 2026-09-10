'use client'

import { useState } from 'react'
import Link from 'next/link'
import LanguageToggle from '@/components/LanguageToggle'
import { logout } from '@/app/actions/auth'

type PublicNavbarProps = {
  isLoggedIn: boolean
  user: { name?: string | null, role?: string } | null
  credits: number
}

export default function PublicNavbar({ isLoggedIn, user, credits }: PublicNavbarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 border-b border-[var(--border)] ${isOpen ? 'bg-[var(--background)]/95 backdrop-blur-xl h-screen md:h-auto overflow-y-auto' : 'bg-[var(--background)]/80 backdrop-blur-sm'}`}>
      <nav className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          
          {/* ── 1. Logo (Left) ──────────────────────────────────────────────── */}
          <div className="flex justify-start">
            <Link href="/en" className="flex flex-col items-start select-none" onClick={() => setIsOpen(false)}>
              <span className="text-xl md:text-2xl font-light tracking-[0.35em] uppercase text-[var(--foreground)]">
                ANYA
              </span>
              <span className="text-[9px] tracking-[0.4em] uppercase text-[var(--foreground-muted)]">
                Pilates
              </span>
            </Link>
          </div>

          {/* ── 2. Hamburger & Language (Right) ─────────────────────────────── */}
          <div className="flex items-center justify-end gap-4">
            <LanguageToggle />
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 -mr-2 text-[var(--foreground)] transition-transform hover:scale-105"
              aria-label="Toggle Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {isOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* ── Menu Dropdown ─────────────────────────────────────────────────── */}
        {isOpen && (
          <div className="mt-8 pt-8 border-t border-[var(--border)] flex flex-col gap-10 pb-8 animate-in slide-in-from-top-4 duration-500 fade-in">
            {/* Primary Navigation Links */}
            <div className="flex flex-col gap-8 px-2">
              <a href="#schedule" onClick={() => setIsOpen(false)} className="text-4xl md:text-5xl font-serif font-light text-[var(--foreground)] hover:text-[var(--accent)] hover:translate-x-3 transition-all duration-300">Schedule</a>
              <a href="#classes" onClick={() => setIsOpen(false)} className="text-4xl md:text-5xl font-serif font-light text-[var(--foreground)] hover:text-[var(--accent)] hover:translate-x-3 transition-all duration-300">Classes</a>
              <a href="#packages" onClick={() => setIsOpen(false)} className="text-4xl md:text-5xl font-serif font-light text-[var(--foreground)] hover:text-[var(--accent)] hover:translate-x-3 transition-all duration-300">Packages</a>
              <a href="#contact" onClick={() => setIsOpen(false)} className="text-4xl md:text-5xl font-serif font-light text-[var(--foreground)] hover:text-[var(--accent)] hover:translate-x-3 transition-all duration-300">Contact</a>
            </div>
            
            {/* User Section Card */}
            {isLoggedIn ? (
              <div className="bg-white/40 backdrop-blur-md border border-white p-6 md:p-8 rounded-3xl flex flex-col gap-6 mt-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-[var(--border)] pb-6">
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-2">Welcome back</p>
                    <span className="text-2xl font-serif text-[var(--foreground)]">{user?.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-light text-[var(--foreground)]">{credits}</span>
                    <span className="text-[9px] tracking-widest uppercase text-[var(--foreground-muted)] mt-1">Credit{credits !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-5 pt-4">
                  <Link 
                    href={
                      user?.role === 'ADMIN' ? '/en/admin' : 
                      user?.role === 'INSTRUCTOR' ? '/en/instructor' : 
                      '/en/account'
                    } 
                    onClick={() => setIsOpen(false)} 
                    className="w-full py-4 bg-[var(--foreground)] text-[var(--background)] rounded-full text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase flex items-center justify-center gap-3 hover:bg-black transition-all duration-300 group shadow-md"
                  >
                    {user?.role === 'ADMIN' ? 'Admin Dashboard' : 
                     user?.role === 'INSTRUCTOR' ? 'Instructor Dashboard' : 
                     'Member Dashboard'}
                    <span className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">→</span>
                  </Link>
                  <form action={logout}>
                    <button type="submit" className="text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors pb-1 border-b border-transparent hover:border-[var(--foreground)]">
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white/40 backdrop-blur-md border border-white p-6 rounded-3xl flex flex-col sm:flex-row gap-4 mt-4 shadow-sm">
                <Link href="/en/login" onClick={() => setIsOpen(false)} className="flex-1 text-center text-[10px] font-medium tracking-[0.2em] uppercase py-4 border border-[var(--border)] rounded-full hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors">
                  Sign In
                </Link>
                <Link href="/en/register" onClick={() => setIsOpen(false)} className="flex-1 text-center text-[10px] font-medium tracking-[0.2em] uppercase py-4 bg-[var(--foreground)] text-[var(--background)] border border-[var(--foreground)] rounded-full hover:bg-black transition-colors shadow-sm">
                  Join Anya Pilates
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
