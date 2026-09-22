'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

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
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'GROUP' | 'DUO' | 'PRIVATE' | 'INTRO'>('ALL')

  const handleSelectPackage = (pkgId: string) => {
    if (!isLoggedIn) {
      router.push('/en/register')
      return
    }
    if (userRole === 'ADMIN') {
      toast.error('Admins cannot purchase packages.')
      return
    }
    router.push(`/en/buy-credits?packageId=${pkgId}`)
  }

  const tabs = [
    { key: 'ALL', label: t('allPackages') },
    { key: 'GROUP', label: t('group') },
    { key: 'DUO', label: t('duo') },
    { key: 'PRIVATE', label: t('private') },
    { key: 'INTRO', label: t('introductory') },
  ] as const

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const isIntro = pkg.name.toLowerCase().includes('intro')
      if (selectedTab === 'ALL') return true
      if (selectedTab === 'INTRO') return isIntro
      if (selectedTab === 'GROUP') return pkg.classType.name.toLowerCase().includes('group')
      if (selectedTab === 'DUO') return pkg.classType.name.toLowerCase().includes('duo')
      if (selectedTab === 'PRIVATE') return pkg.classType.name.toLowerCase().includes('private')
      return true
    })
  }, [packages, selectedTab])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Attach wheel-to-horizontal-scroll listener
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY * 1.5
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  return (
    <div>
      {/* ── Category Filter Tabs ────────────────────────────────────────── */}
      <div className="flex justify-center mb-12 overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide">
        <div className="inline-flex p-1.5 rounded-full bg-black/[0.04] backdrop-blur-md border border-white/60">
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
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-6 md:gap-8 mb-16 pb-8 snap-x snap-mandatory scrollbar-hide w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {filteredPackages.map(pkg => {
          const isIntro = pkg.name.toLowerCase().includes('intro')
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
                ${isIntro 
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
                  {isIntro && (
                    <span className="inline-flex items-center gap-1 text-[8px] tracking-[0.2em] uppercase font-medium text-[var(--accent-dark)] bg-[var(--accent)]/10 px-2.5 py-0.5 rounded-full border border-[var(--accent)]/20">
                      ★ {t('introductory')}
                    </span>
                  )}
                  {isSingle && !isIntro && (
                    <span className="text-[8px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] font-medium">
                      {t('singleSession')}
                    </span>
                  )}
                  {!isSingle && !isIntro && (
                    <span className="text-[8px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]/70">
                      {t('classPackage')}
                    </span>
                  )}
                </div>

                {/* Package Name */}
                <h3 className="text-lg font-serif font-normal text-[var(--foreground)] mb-1 z-10 leading-snug">
                  {pkg.name}
                </h3>

                {/* Class Type & Count Subtitle */}
                <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-5 z-10">
                  {pkg.classCount} {pkg.classType.name}
                </p>

                {/* Price Display */}
                <div className="flex flex-col justify-center items-center mb-4 z-10">
                  <div className="text-3xl font-light text-[var(--foreground)] tracking-tight mb-1.5">
                    <span className="text-base font-normal align-top mr-0.5">฿</span>
                    {priceInBaht.toLocaleString('en-US')}
                  </div>

                  {/* Price per class breakdown */}
                  {pkg.classCount > 1 && (
                    <div className="text-[9px] font-medium tracking-wider text-[var(--foreground-muted)] uppercase bg-black/[0.03] px-2.5 py-0.5 rounded-full">
                      ฿{unitPrice.toLocaleString('en-US')} / {t('classUnit')}
                    </div>
                  )}
                </div>

                {/* Validity */}
                <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-5">
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
                    ${isIntro
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

      {/* ── Official Flyer Footer / Disclaimers ────────────────────────── */}
      <div className="text-center max-w-2xl mx-auto space-y-3 pt-6 border-t border-black/5">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] tracking-[0.25em] uppercase text-[var(--foreground-muted)] font-medium">
          <span>{t('classDuration')}</span>
          <span className="hidden sm:inline opacity-30">•</span>
          <span>{t('introValid')}</span>
          <span className="hidden sm:inline opacity-30">•</span>
          <span>{t('pkgsValid')}</span>
        </div>
        <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] opacity-60">
          All packages are non-refundable. Validity starts from the date of purchase.
        </p>
        <p className="font-serif italic text-xs text-[var(--foreground-muted)]/70 pt-2">
          Stronger · Calmer · You
        </p>
      </div>
    </div>
  )
}
