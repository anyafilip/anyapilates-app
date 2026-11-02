'use client'

import { useState, useMemo } from 'react'
import { Link } from '@/i18n/routing'

const TZ_OFFSET = 7 // Bangkok UTC+7

function bangkokDate(dateInput: Date | string) {
  const d = new Date(dateInput)
  const local = new Date(d.getTime() + TZ_OFFSET * 60 * 60 * 1000)
  return local.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function bangkokTime(dateInput: Date | string) {
  const d = new Date(dateInput)
  const local = new Date(d.getTime() + TZ_OFFSET * 60 * 60 * 1000)
  return local.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
}

export type PaymentItem = {
  id: string
  amount: number
  status: string
  refCode: string
  createdAt: Date | string
  package: {
    id: string
    name: string
    classCount: number
    expiresInDays: number
  }
}

export default function PurchasesTable({ payments }: { payments: PaymentItem[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc')

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        // Status filter
        if (statusFilter !== 'ALL' && p.status !== statusFilter) {
          return false
        }

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          const packageName = p.package?.name?.toLowerCase() || ''
          const refCode = p.refCode?.toLowerCase() || ''
          const amountStr = (p.amount / 100).toString()
          if (!packageName.includes(query) && !refCode.includes(query) && !amountStr.includes(query)) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime()
        const timeB = new Date(b.createdAt).getTime()

        if (sortBy === 'date_asc') return timeA - timeB
        if (sortBy === 'date_desc') return timeB - timeA
        if (sortBy === 'amount_asc') return a.amount - b.amount
        if (sortBy === 'amount_desc') return b.amount - a.amount
        return 0
      })
  }, [payments, searchQuery, statusFilter, sortBy])

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL' || sortBy !== 'date_desc'

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('ALL')
    setSortBy('date_desc')
  }

  if (payments.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-[var(--border)] rounded-3xl bg-white/30 backdrop-blur-sm px-4">
        <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-3">No purchases found.</p>
        <p className="text-xs text-[var(--foreground-muted)] mb-5">You haven&apos;t purchased any packages or passes yet.</p>
        <Link
          href="/#packages"
          className="inline-block px-6 py-2.5 rounded-full bg-[var(--foreground)] text-[var(--background)] text-xs tracking-wider uppercase font-medium hover:opacity-90 transition-opacity"
        >
          Explore Packages →
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* ── Search & Filter Controls Bar ───────────────────────────────── */}
      <div className="bg-white/70 backdrop-blur-xl border border-black/10 rounded-2xl md:rounded-[2rem] p-4 md:p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[var(--foreground-muted)]/60">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search package or reference..."
              className="w-full text-xs pl-10 pr-8 py-2.5 rounded-xl bg-white/70 border border-black/10 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/60 focus:outline-none focus:border-[var(--accent)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex items-center gap-2.5">
            {/* Status Filter */}
            <div className="relative flex-1 sm:flex-none sm:min-w-[130px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs px-3 py-2.5 pr-8 rounded-xl bg-white/70 border border-black/10 text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-all cursor-pointer appearance-none"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
              <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[var(--foreground-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs px-3 py-2.5 pr-8 rounded-xl bg-white/70 border border-black/10 text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-all cursor-pointer appearance-none"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Amount: High to Low</option>
                <option value="amount_asc">Amount: Low to High</option>
              </select>
              <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[var(--foreground-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Showing Count / Reset */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 text-[11px] text-[var(--foreground-muted)]">
          <span>
            Showing <span className="font-medium text-[var(--foreground)]">{filteredPayments.length}</span> of {payments.length} purchases
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[var(--accent)] hover:underline uppercase tracking-wider font-medium text-[10px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Purchases Table Card ───────────────────────────────────────── */}
      <div className="bg-white/70 backdrop-blur-xl border border-black/10 rounded-2xl md:rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">No matching purchases</p>
            <p className="text-xs text-[var(--foreground-muted)]/70 mb-4">Try clearing your search query or status filter.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs uppercase tracking-wider text-[var(--accent)] hover:underline font-medium"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View (md and above) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-black/5 text-xs text-[var(--foreground-muted)] font-normal">
                    <th className="py-4 pl-6 md:pl-8 font-normal">Date & Time</th>
                    <th className="py-4 px-4 font-normal">Package / Description</th>
                    <th className="py-4 px-4 font-normal">Reference</th>
                    <th className="py-4 px-4 font-normal">Amount</th>
                    <th className="py-4 px-4 font-normal">Status</th>
                    <th className="py-4 pr-6 md:pr-8 text-right font-normal">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-sm">
                  {filteredPayments.map((payment) => {
                    const isPending = payment.status === 'PENDING'
                    const isPaid = payment.status === 'PAID'
                    const isFailed = payment.status === 'FAILED'

                    return (
                      <tr key={payment.id} className="hover:bg-black/[0.02] transition-colors">
                        {/* Date & Time */}
                        <td className="py-4 pl-6 md:pl-8 text-sm text-[var(--foreground)]">
                          <p className="font-normal">{bangkokDate(payment.createdAt)}</p>
                          <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">{bangkokTime(payment.createdAt)}</p>
                        </td>

                        {/* Package */}
                        <td className="py-4 px-4 text-sm text-[var(--foreground)] font-normal">
                          <p className="font-medium text-[var(--foreground)]">{payment.package?.name}</p>
                          {payment.package?.classCount && (
                            <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                              {payment.package.classCount} {payment.package.classCount === 1 ? 'class' : 'classes'}
                              {payment.package.expiresInDays ? ` · ${payment.package.expiresInDays} days validity` : ''}
                            </p>
                          )}
                        </td>

                        {/* Reference Code */}
                        <td className="py-4 px-4 text-xs font-mono text-[var(--foreground-muted)]">
                          {payment.refCode}
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 font-normal text-sm text-[var(--foreground)]">
                          ฿{(payment.amount / 100).toLocaleString('en-US')}
                        </td>

                        {/* Status (Quiet typography) */}
                        <td className="py-4 px-4 text-xs font-medium uppercase tracking-wider">
                          {isPaid && <span className="text-emerald-700">Paid</span>}
                          {isPending && (
                            <span className="text-amber-700 inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                              Pending
                            </span>
                          )}
                          {isFailed && <span className="text-rose-700">Failed</span>}
                          {!isPaid && !isPending && !isFailed && (
                            <span className="text-[var(--foreground-muted)]">{payment.status}</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-4 pr-6 md:pr-8 text-right text-xs">
                          {isPending ? (
                            <Link
                              href={`/buy-credits/pending?paymentId=${payment.id}`}
                              className="text-[var(--accent)] hover:underline font-medium uppercase tracking-wider"
                            >
                              Complete Payment →
                            </Link>
                          ) : (
                            <span className="text-[var(--foreground-muted)]/40">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card / List View (under md) */}
            <div className="block md:hidden divide-y divide-black/5">
              {filteredPayments.map((payment) => {
                const isPending = payment.status === 'PENDING'
                const isPaid = payment.status === 'PAID'
                const isFailed = payment.status === 'FAILED'

                return (
                  <div key={payment.id} className="p-4 flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm text-[var(--foreground)]">{payment.package?.name}</p>
                        <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                          {bangkokDate(payment.createdAt)} · {bangkokTime(payment.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-normal text-[var(--foreground)]">
                          ฿{(payment.amount / 100).toLocaleString('en-US')}
                        </p>
                        <span className="text-[10px] tracking-wider uppercase font-medium">
                          {isPaid && <span className="text-emerald-700">Paid</span>}
                          {isPending && (
                            <span className="text-amber-700 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                              Pending
                            </span>
                          )}
                          {isFailed && <span className="text-rose-700">Failed</span>}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[11px]">
                      <span className="font-mono text-[var(--foreground-muted)] text-[10px]">
                        {payment.refCode}
                      </span>
                      {isPending && (
                        <Link
                          href={`/buy-credits/pending?paymentId=${payment.id}`}
                          className="text-[var(--accent)] hover:underline font-medium uppercase tracking-wider text-[10px]"
                        >
                          Complete Payment →
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
