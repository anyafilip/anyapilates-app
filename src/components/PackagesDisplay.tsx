'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import toast from 'react-hot-toast'
import { useTranslations, useLocale } from 'next-intl'

type PackageItem = {
  id: string
  name: string
  classCount: number
  price: number // in satang
  expiresInDays: number
  classType: {
    id: string
    name: string
  }
}

interface PackagesDisplayProps {
  packages: PackageItem[]
  isLoggedIn: boolean
  userRole?: string
}

export default function PackagesDisplay({ packages, isLoggedIn, userRole }: PackagesDisplayProps) {
  const t = useTranslations('Packages')
  const locale = useLocale()
  const isEn = locale === 'en'
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'GROUP' | 'DUO' | 'PRIVATE' | 'TRIAL'>('ALL')

  const handleSelectPackage = (pkgId: string) => {
    if (!isLoggedIn) {
      router.push('/register')
      return
    }
    if (userRole === 'ADMIN' || userRole === 'INSTRUCTOR') {
      toast.error('Admins and Instructors cannot purchase packages.')
      return
    }
    router.push(`/buy-credits?packageId=${pkgId}`)
  }

  const tabs = [
    { key: 'ALL', label: t('allPackages') },
    { key: 'GROUP', label: t('group') },
    { key: 'DUO', label: t('duo') },
    { key: 'PRIVATE', label: t('private') },
    { key: 'TRIAL', label: t('trial') },
  ] as const

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const isTrial = pkg.name.toLowerCase().includes('trial')
      if (selectedTab === 'ALL') return true
      if (selectedTab === 'TRIAL') return isTrial
      if (selectedTab === 'GROUP') return pkg.classType.name.toLowerCase().includes('group')
      if (selectedTab === 'DUO') return pkg.classType.name.toLowerCase().includes('duo')
      if (selectedTab === 'PRIVATE') return pkg.classType.name.toLowerCase().includes('private')
      return true
    })
  }, [packages, selectedTab])


  return (
    <div>
      {/* ── Category Filter Tabs ────────────────────────────────────────── */}
      <div className="flex justify-start md:justify-center mb-12 overflow-x-auto py-4 -mx-4 px-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="inline-flex p-1.5 rounded-full bg-black/[0.04] backdrop-blur-md border border-white/60 min-w-max">
          {tabs.map(tab => {
            const isActive = selectedTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`
                  px-5 md:px-7 py-2.5 rounded-full text-[10px] md:text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-300 whitespace-nowrap cursor-pointer
                  ${isActive
                    ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/40'
                  }
                `}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Package Cards Grid ─────────────────────────────────────────── */}
      <div className="flex overflow-x-auto gap-6 md:gap-8 mb-16 pb-6 snap-x snap-mandatory packages-scrollbar w-full"
      >
        {filteredPackages.map(pkg => {
          const isTrial = pkg.name.toLowerCase().includes('trial')
          const isSingle = pkg.classCount === 1
          const priceInBaht = pkg.price / 100
          const unitPrice = Math.round(priceInBaht / pkg.classCount)

          return (
            <div
              key={pkg.id}
              className={`
                shrink-0 snap-start w-[calc(33.333vw-1.5rem)] md:w-[calc(25vw-2rem)] min-w-[200px] max-w-[320px]
                relative group bg-white/40 hover:bg-white/70 backdrop-blur-md border rounded-[2rem] p-6 text-center flex flex-col justify-between
                shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-500 overflow-hidden
                ${isTrial 
                  ? 'border-[var(--accent)]/40 hover:border-[var(--accent)]' 
                  : 'border-white/60 hover:border-white'
                }
              `}
            >
              {/* Decorative radial gradient blob */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

              <div>
                {/* Badge */}
                <div className="h-5 mb-3 flex items-center justify-center">
                  {isTrial && (
                    <span className={`inline-flex items-center gap-1 text-[8px] ${isEn ? 'tracking-[0.2em]' : 'tracking-normal'} uppercase font-medium text-[var(--accent-dark)] bg-[var(--accent)]/10 px-2.5 py-0.5 rounded-full border border-[var(--accent)]/20`}>
                      ★ {t('trial')}
                    </span>
                  )}
                  {isSingle && !isTrial && (
                    <span className={`text-[8px] ${isEn ? 'tracking-[0.2em]' : 'tracking-normal'} uppercase text-[var(--foreground-muted)] font-medium`}>
                      {t('singleSession')}
                    </span>
                  )}
                  {!isSingle && !isTrial && (
                    <span className={`text-[8px] ${isEn ? 'tracking-[0.2em]' : 'tracking-normal'} uppercase text-[var(--foreground-muted)]/70`}>
                      {t('classPackage')}
                    </span>
                  )}
                </div>

                {/* Package Name */}
                <h3 className="text-lg font-serif font-normal text-[var(--foreground)] mb-1 z-10 leading-snug">
                  {pkg.name}
                </h3>

                {/* Class Type & Count Subtitle */}
                <p className={`text-[9px] ${isEn ? 'tracking-[0.2em]' : 'tracking-normal'} uppercase text-[var(--foreground-muted)] mb-5 z-10`}>
                  {pkg.classCount} {pkg.classType.name}
                </p>

                {/* Price Display */}
                <div className="flex flex-col justify-center items-center mb-4 z-10">
                  <div className={`text-3xl font-light text-[var(--foreground)] ${isEn ? 'tracking-tight' : 'tracking-normal'} mb-1.5`}>
                    <span className="text-base font-normal align-top mr-0.5">฿</span>
                    {priceInBaht.toLocaleString('en-US')}
                  </div>

                  {/* Price per class breakdown */}
                  {pkg.classCount > 1 && (
                    <div className={`text-[9px] font-medium ${isEn ? 'tracking-wider' : 'tracking-normal'} text-[var(--foreground-muted)] uppercase bg-black/[0.03] px-2.5 py-0.5 rounded-full`}>
                      ฿{unitPrice.toLocaleString('en-US')} / {t('classUnit')}
                    </div>
                  )}
                </div>

                {/* Validity */}
                <p className={`text-[9px] ${isEn ? 'tracking-[0.2em]' : 'tracking-normal'} uppercase text-[var(--foreground-muted)] mb-5`}>
                  Valid {pkg.expiresInDays} days
                </p>
              </div>

              <div>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mb-4 z-10" />

                <button
                  type="button"
                  onClick={() => handleSelectPackage(pkg.id)}
                  className={`
                    relative z-10 w-full block py-3 rounded-full text-[9px] tracking-[0.2em] uppercase font-medium transition-all duration-300 shadow-sm text-center cursor-pointer
                    ${isTrial
                      ? 'bg-[var(--foreground)] text-[var(--background)] hover:bg-black'
                      : 'bg-transparent border border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]'
                    }
                  `}
                >
                  {t('select')}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredPackages.length === 0 && (
        <div className="text-center py-16 text-[var(--foreground-muted)] font-serif italic">
          {t('noPackages')}
        </div>
      )}
    </div>
  )
}
