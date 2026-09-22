'use client'

import { useState } from 'react'
import { Link } from '@/i18n/routing'
import { logout } from '@/app/actions/auth'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslations } from 'next-intl'

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('AdminNav')

  const links = [
    { href: '/admin', label: t('dashboard') },
    { href: '/admin/classes', label: t('classTypes') },
    { href: '/admin/schedule', label: t('schedule') },
    { href: '/admin/bookings', label: t('bookings') },
    { href: '/admin/users', label: t('users') },
    { href: '/admin/instructors', label: t('instructors') },
    { href: '/admin/packages', label: t('packages') },
    { href: '/admin/payments', label: t('payments') },
    { href: '/admin/settings', label: t('settings') },
  ]

  return (
    <header className="relative z-50 w-full shrink-0">
      {/* Topbar (Always visible on all screens) */}
      <div className="flex items-center justify-between px-6 py-4 bg-[var(--foreground)] text-[var(--background)] w-full">
        <Link href="/admin">
          <span className="text-base tracking-[0.3em] uppercase font-light">ANYA</span>
          <span className="text-[9px] tracking-[0.35em] uppercase text-white/50 ml-2">Admin</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <LanguageToggle dark />
          </div>
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
      </div>

      {/* Sidebar Content (Hidden unless open) */}
      <aside className={`
        ${isOpen ? 'flex' : 'hidden'} 
        flex-col w-full md:w-64 shrink-0 bg-[var(--foreground)] text-[var(--background)] 
        absolute top-full left-0 h-[calc(100dvh-56px)] border-t border-white/10
      `}>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
          {links.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="px-3 py-3 rounded-lg text-sm font-light text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 pb-8 space-y-2">
          <div className="md:hidden pb-4 px-3 flex justify-start">
            <LanguageToggle dark />
          </div>
          <Link href="/" className="block w-full px-3 py-3 text-sm font-light text-white/50 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors">
            ⚲ {t('viewPublicSite')}
          </Link>
          <form action={logout}>
            <button type="submit" className="w-full px-3 py-3 text-sm font-light text-white/50 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors cursor-pointer">
              ← {t('logout')}
            </button>
          </form>
        </div>
      </aside>
    </header>
  )
}
