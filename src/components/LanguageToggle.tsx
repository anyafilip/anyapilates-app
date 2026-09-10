'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <div
      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs"
      style={{
        background: 'rgba(255,255,255,0.5)',
        border: '1px solid rgba(138,112,85,0.18)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <button
        onClick={() => switchLocale('en')}
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
