'use client'

import { useState, useTransition } from 'react'
import { manuallyGrantPackage } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import CustomDropdown from '@/components/CustomDropdown'

export default function GrantPackageForm({ userId, packages }: { userId: string, packages: any[] }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [selectedPkg, setSelectedPkg] = useState<any>(null)
  const [credits, setCredits] = useState('')
  const [expiry, setExpiry] = useState('')
  const [useCustomExpiry, setUseCustomExpiry] = useState(false)

  const handleSelect = (pkg: any) => {
    setSelectedPkg(pkg)
    setCredits('')
    setExpiry('')
    setUseCustomExpiry(false)
  }

  const handleGrant = () => {
    if (!selectedPkg) return

    startTransition(async () => {
      try {
        const overrideCredits = credits ? parseInt(credits) : undefined
        const overrideExpiry = useCustomExpiry && expiry ? new Date(expiry).toISOString() : undefined
        await manuallyGrantPackage(userId, selectedPkg.id, overrideCredits, overrideExpiry)
        toast.success('Package granted successfully.')
        setSelectedPkg(null)
        setCredits('')
        setExpiry('')
        setUseCustomExpiry(false)
        router.refresh()
      } catch (e: any) {
        toast.error(e.message || 'Failed to grant package.')
      }
    })
  }

  // Default expiry preview based on selected package
  const defaultExpiryDate = selectedPkg
    ? (() => {
        const d = new Date()
        d.setDate(d.getDate() + selectedPkg.startWindowDays)
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      })()
    : null

  return (
    <div className="space-y-6">

      {/* Step 1 — Package */}
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">
          1 — Choose Package
        </p>
        <CustomDropdown
          variant="standard"
          placeholder="Select a package..."
          options={packages.map(pkg => ({
            value: pkg.id,
            label: `${pkg.name} — ${pkg.classCount} credits (${pkg.classType?.name})`,
          }))}
          onChange={val => {
            const pkg = packages.find(p => p.id === val) ?? null
            handleSelect(pkg)
          }}
        />
      </div>

      {/* Step 2 — Customise (only shown once a package is selected) */}
      {selectedPkg && (
        <div className="border-t border-black/5 pt-6 space-y-5">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
            2 — Customise <span className="text-black/30">(optional — for existing clients)</span>
          </p>

          {/* Credits override */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
              Remaining Credits
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={selectedPkg.classCount}
                value={credits}
                onChange={e => setCredits(e.target.value)}
                placeholder={`${selectedPkg.classCount} (full package)`}
                className="flex-1 bg-white/60 border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] placeholder-black/30"
              />
              {credits && (
                <button
                  type="button"
                  onClick={() => setCredits('')}
                  className="text-xs text-[var(--foreground-muted)] hover:text-red-600 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="text-[10px] text-[var(--foreground-muted)] mt-1">
              Leave blank to grant the full {selectedPkg.classCount} credits.
            </p>
          </div>

          {/* Expiry toggle */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-2">
              Expiration Date
            </label>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setUseCustomExpiry(false)}
                className={`px-4 py-2 rounded-full text-[10px] tracking-widest uppercase transition-colors ${
                  !useCustomExpiry
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'bg-black/5 text-[var(--foreground-muted)] hover:bg-black/10'
                }`}
              >
                Use Default
              </button>
              <button
                type="button"
                onClick={() => setUseCustomExpiry(true)}
                className={`px-4 py-2 rounded-full text-[10px] tracking-widest uppercase transition-colors ${
                  useCustomExpiry
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'bg-black/5 text-[var(--foreground-muted)] hover:bg-black/10'
                }`}
              >
                Set Specific Date
              </button>
            </div>

            {!useCustomExpiry ? (
              <div className="bg-black/[0.03] rounded-xl px-4 py-3 text-sm text-[var(--foreground-muted)]">
                Auto-activates on <span className="font-medium text-[var(--foreground)]">{defaultExpiryDate}</span>
                <span className="block text-[10px] mt-0.5">Countdown starts from first booked class.</span>
              </div>
            ) : (
              <div>
                <input
                  type="date"
                  value={expiry}
                  onChange={e => setExpiry(e.target.value)}
                  className="w-full bg-white/60 border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]"
                />
                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2">
                  ⚠ Setting a specific date marks this pass as <strong>already active</strong>. The expiry countdown starts immediately from this date.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary + Grant */}
      {selectedPkg && (
        <div className="border-t border-black/5 pt-6">
          <div className="bg-black/[0.03] rounded-2xl px-5 py-4 mb-4 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[var(--foreground-muted)]">Package</span>
              <span className="font-medium text-[var(--foreground)]">{selectedPkg.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--foreground-muted)]">Credits</span>
              <span className="font-medium text-[var(--foreground)]">
                {credits || selectedPkg.classCount} / {selectedPkg.classCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--foreground-muted)]">Expiry</span>
              <span className="font-medium text-[var(--foreground)]">
                {useCustomExpiry && expiry
                  ? new Date(expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : `Auto · ${defaultExpiryDate}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGrant}
            disabled={isPending || (useCustomExpiry && !expiry)}
            className="btn-primary w-full justify-center py-3 disabled:opacity-40"
          >
            {isPending ? 'Granting...' : `Grant Package →`}
          </button>
        </div>
      )}

      {!selectedPkg && (
        <p className="text-xs text-[var(--foreground-muted)] italic text-center pt-2">
          Select a package above to continue.
        </p>
      )}
    </div>
  )
}
