'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export default function MemberNavbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="relative z-50 w-full shrink-0">
      {/* Topbar (Always visible on all screens) */}
      <div className="flex items-center justify-between px-6 py-4 bg-[var(--foreground)] text-[var(--background)] w-full">
        <Link href="/en/account">
          <span className="text-base tracking-[0.3em] uppercase font-light">ANYA</span>
          <span className="text-[9px] tracking-[0.35em] uppercase text-white/50 ml-2">Member</span>
        </Link>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 transition-transform hover:scale-105">
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

      {/* Dropdown Menu (Hidden unless open) */}
      <aside className={`
        ${isOpen ? 'flex' : 'hidden'} 
        flex-col w-full md:w-64 shrink-0 bg-[var(--foreground)] text-[var(--background)] 
        absolute top-full left-0 h-[calc(100vh-56px)] border-t border-white/10
      `}>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
          <Link
            href="/en/account"
            onClick={() => setIsOpen(false)}
            className="px-3 py-3 rounded-lg text-sm font-light text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/en/account/upcoming"
            onClick={() => setIsOpen(false)}
            className="px-3 py-3 rounded-lg text-sm font-light text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Upcoming Classes
          </Link>
          <Link
            href="/en/account/history"
            onClick={() => setIsOpen(false)}
            className="px-3 py-3 rounded-lg text-sm font-light text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Class History
          </Link>
          <Link
            href="/en/account/purchases"
            onClick={() => setIsOpen(false)}
            className="px-3 py-3 rounded-lg text-sm font-light text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Purchase History
          </Link>
          <Link
            href="/en/#schedule"
            onClick={() => setIsOpen(false)}
            className="px-3 py-3 rounded-lg text-sm font-light text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Book a Class
          </Link>
          <Link
            href="/en/#packages"
            onClick={() => setIsOpen(false)}
            className="px-3 py-3 rounded-lg text-sm font-light text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Buy Packages
          </Link>
        </nav>

        <div className="px-4 pb-8 space-y-2">
          <Link href="/en" className="block w-full px-3 py-3 text-sm font-light text-white/50 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors">
            ⚲ View Public Site
          </Link>
          <form action={logout}>
            <button type="submit" className="w-full px-3 py-3 text-sm font-light text-white/50 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors cursor-pointer">
              ← Logout
            </button>
          </form>
        </div>
      </aside>
    </header>
  )
}
