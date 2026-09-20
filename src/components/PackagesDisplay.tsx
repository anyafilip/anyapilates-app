'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

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
}

export default function PackagesDisplay({ packages, isLoggedIn }: PackagesDisplayProps) {
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'GROUP' | 'DUO' | 'PRIVATE' | 'INTRO'>('ALL')

  const tabs = [
    { key: 'ALL', label: 'All Packages' },
    { key: 'GROUP', label: 'Group' },
    { key: 'DUO', label: 'Duo' },
    { key: 'PRIVATE', label: 'Private' },
    { key: 'INTRO', label: 'Introductory' },
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
        {filteredPackages.map(pkg => {
          const isIntro = pkg.name.toLowerCase().includes('intro')
          const isSingle = pkg.classCount === 1
          const priceInBaht = pkg.price / 100
          const unitPrice = Math.round(priceInBaht / pkg.classCount)

          return (
            <div
              key={pkg.id}
              className={`
                relative group bg-white/40 hover:bg-white/70 backdrop-blur-md border rounded-[2.5rem] p-8 md:p-10 text-center flex flex-col justify-between
                shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-500 overflow-hidden
                ${isIntro 
                  ? 'border-[var(--accent)]/40 hover:border-[var(--accent)]' 
                  : 'border-white/60 hover:border-white'
                }
              `}
            >
              {/* Decorative radial gradient blob */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

              <div>
                {/* Badge */}
                <div className="h-6 mb-4 flex items-center justify-center">
                  {isIntro && (
                    <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.25em] uppercase font-medium text-[var(--accent-dark)] bg-[var(--accent)]/10 px-3 py-1 rounded-full border border-[var(--accent)]/20">
                      ★ Introductory Offer
                    </span>
                  )}
                  {isSingle && !isIntro && (
                    <span className="text-[9px] tracking-[0.25em] uppercase text-[var(--foreground-muted)] font-medium">
                      Single Session
                    </span>
                  )}
                  {!isSingle && !isIntro && (
                    <span className="text-[9px] tracking-[0.25em] uppercase text-[var(--foreground-muted)]/70">
                      Multi-Class Pass
                    </span>
                  )}
                </div>

                {/* Package Name */}
                <h3 className="text-2xl font-serif font-normal text-[var(--foreground)] mb-1 z-10">
                  {pkg.name}
                </h3>

                {/* Class Type & Count Subtitle */}
                <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--foreground-muted)] mb-8 z-10">
                  {pkg.classCount} {pkg.classType.name}
                </p>

                {/* Price Display */}
                <div className="flex flex-col justify-center items-center mb-6 z-10">
                  <div className="text-4xl md:text-5xl font-light text-[var(--foreground)] tracking-tight mb-2">
                    <span className="text-xl font-normal align-top mr-1">฿</span>
                    {priceInBaht.toLocaleString('en-US')}
                  </div>

                  {/* Price per class breakdown */}
                  {pkg.classCount > 1 && (
                    <div className="text-[11px] font-medium tracking-wider text-[var(--foreground-muted)] uppercase bg-black/[0.03] px-3 py-1 rounded-full">
                      ฿{unitPrice.toLocaleString('en-US')} / class
                    </div>
                  )}
                </div>

                {/* Validity */}
                <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-8">
                  Valid for {pkg.expiresInDays} days
                </p>
              </div>

              <div>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 to-transparent mb-6 z-10" />

                <Link
                  href={isLoggedIn ? `/en/buy-credits?packageId=${pkg.id}` : "/en/register"}
                  className={`
                    relative z-10 w-full block py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium transition-all duration-300 shadow-sm text-center cursor-pointer
                    ${isIntro
                      ? 'bg-[var(--foreground)] text-[var(--background)] hover:bg-black'
                      : 'bg-transparent border border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]'
                    }
                  `}
                >
                  Select Package
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {filteredPackages.length === 0 && (
        <div className="text-center py-16 text-[var(--foreground-muted)] font-serif italic">
          No packages currently available in this category.
        </div>
      )}

      {/* ── Official Flyer Footer / Disclaimers ────────────────────────── */}
      <div className="text-center max-w-2xl mx-auto space-y-3 pt-6 border-t border-black/5">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] tracking-[0.25em] uppercase text-[var(--foreground-muted)] font-medium">
          <span>Class Duration: 50 Minutes</span>
          <span className="hidden sm:inline opacity-30">•</span>
          <span>Intro Packages: Valid 15 Days</span>
          <span className="hidden sm:inline opacity-30">•</span>
          <span>Packages: Valid 30–60 Days</span>
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
