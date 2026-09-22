'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'

export default function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return
    startTransition(() => {
      // Preserve search parameters when switching language
      const query = searchParams.toString()
      const href = query ? `${pathname}?${query}` : pathname
      
      // @ts-ignore - next-intl accepts string here but types might be strict
      router.replace(href, { locale: newLocale })
    })
  }

  return (
    <div
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none cursor-wait' : ''}`}
      style={{
        background: 'rgba(255,255,255,0.5)',
        border: '1px solid rgba(138,112,85,0.18)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <button
        onClick={() => switchLocale('en')}
        disabled={isPending}
        className="px-1.5 transition-colors"
        style={{
          color: locale === 'en' ? 'var(--accent)' : 'var(--foreground-muted)',
          fontWeight: locale === 'en' ? '600' : '400',
        }}
      >
        EN
      </button>
      <span style={{ color: 'var(--accent-light)' }}>|</span>
      <button
        onClick={() => switchLocale('th')}
        disabled={isPending}
        className="px-1.5 transition-colors"
        style={{
          color: locale === 'th' ? 'var(--accent)' : 'var(--foreground-muted)',
          fontWeight: locale === 'th' ? '600' : '400',
        }}
      >
        TH
      </button>
    </div>
  )
}
