'use client'

import { useState, useMemo } from 'react'
import { Link } from '@/i18n/routing'
import ClassNameDisplay from '@/components/ClassNameDisplay'

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

export type BookingHistoryItem = {
  id: string
  status: string
  bookedAt?: Date | string
  class: {
    id: string
    name: string
    date: Date | string
    startTime: string
    endTime?: string | null
    duration?: number | null
    instructor?: {
      name: string
    } | null
    classType?: {
      id: string
      name: string
      nameTh?: string | null
    } | null
  }
}

export default function ClassHistoryTable({ bookings }: { bookings: BookingHistoryItem[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc'>('date_desc')

  // Extract unique instructors for optional quick filter if desired
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        // Status filter
        if (statusFilter !== 'ALL' && b.status !== statusFilter) {
          return false
        }

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          const className = b.class.name?.toLowerCase() || ''
          const typeName = b.class.classType?.name?.toLowerCase() || ''
          const typeNameTh = b.class.classType?.nameTh?.toLowerCase() || ''
          const instructorName = b.class.instructor?.name?.toLowerCase() || ''

          if (
            !className.includes(query) &&
            !typeName.includes(query) &&
            !typeNameTh.includes(query) &&
            !instructorName.includes(query)
          ) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        const timeA = new Date(a.class.date).getTime()
        const timeB = new Date(b.class.date).getTime()

        if (sortBy === 'date_asc') return timeA - timeB
        return timeB - timeA
      })
  }, [bookings, searchQuery, statusFilter, sortBy])

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL' || sortBy !== 'date_desc'

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('ALL')
    setSortBy('date_desc')
  }

  if (bookings.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-[var(--border)] rounded-3xl bg-white/30 backdrop-blur-sm px-4">
        <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-3">No past classes found.</p>
        <p className="text-xs text-[var(--foreground-muted)] mb-5">You haven&apos;t attended or completed any classes yet.</p>
        <Link
          href="/account/schedule"
          className="inline-block px-6 py-2.5 rounded-full bg-[var(--foreground)] text-[var(--background)] text-xs tracking-wider uppercase font-medium hover:opacity-90 transition-opacity"
        >
          View Full Schedule →
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
              placeholder="Search class or instructor..."
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
                <option value="ATTENDED">Attended</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
                <option value="BOOKED">Booked</option>
              </select>
              <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[var(--foreground-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:flex-none sm:min-w-[130px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs px-3 py-2.5 pr-8 rounded-xl bg-white/70 border border-black/10 text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-all cursor-pointer appearance-none"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
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
            Showing <span className="font-medium text-[var(--foreground)]">{filteredBookings.length}</span> of {bookings.length} classes
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

      {/* ── Class History Table Card ───────────────────────────────────── */}
      <div className="bg-white/70 backdrop-blur-xl border border-black/10 rounded-2xl md:rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">No matching classes</p>
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
                    <th className="py-4 px-4 font-normal">Class</th>
                    <th className="py-4 px-4 font-normal">Instructor</th>
                    <th className="py-4 px-4 font-normal">Duration</th>
                    <th className="py-4 pr-6 md:pr-8 text-right font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-sm">
                  {filteredBookings.map((b) => {
                    const isAttended = b.status === 'ATTENDED'
                    const isCancelled = b.status === 'CANCELLED'
                    const isNoShow = b.status === 'NO_SHOW'
                    const isBooked = b.status === 'BOOKED'

                    return (
                      <tr key={b.id} className="hover:bg-black/[0.02] transition-colors">
                        {/* Date & Time */}
                        <td className="py-4 pl-6 md:pl-8 text-sm text-[var(--foreground)]">
                          <p className="font-normal">{bangkokDate(b.class.date)}</p>
                          <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                            {b.class.startTime}
                            {b.class.endTime ? ` – ${b.class.endTime}` : ''}
                          </p>
                        </td>

                        {/* Class */}
                        <td className="py-4 px-4 text-sm text-[var(--foreground)] font-normal">
                          <ClassNameDisplay
                            name={b.class.name}
                            nameTh={b.class.classType?.nameTh}
                            classTypeName={b.class.classType?.name}
                            classTypeNameTh={b.class.classType?.nameTh}
                            size="sm"
                          />
                        </td>

                        {/* Instructor */}
                        <td className="py-4 px-4 text-sm font-normal text-[var(--foreground)]">
                          {b.class.instructor?.name || '—'}
                        </td>

                        {/* Duration */}
                        <td className="py-4 px-4 text-xs text-[var(--foreground-muted)]">
                          {b.class.duration || 50} min
                        </td>

                        {/* Status (Quiet Typography) */}
                        <td className="py-4 pr-6 md:pr-8 text-right text-xs font-medium uppercase tracking-wider">
                          {isAttended && <span className="text-emerald-700">Attended</span>}
                          {isCancelled && <span className="text-[var(--foreground-muted)]/70">Cancelled</span>}
                          {isNoShow && <span className="text-rose-700">No Show</span>}
                          {isBooked && <span className="text-[var(--foreground)]">Booked</span>}
                          {!isAttended && !isCancelled && !isNoShow && !isBooked && (
                            <span className="text-[var(--foreground-muted)]">{b.status}</span>
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
              {filteredBookings.map((b) => {
                const isAttended = b.status === 'ATTENDED'
                const isCancelled = b.status === 'CANCELLED'
                const isNoShow = b.status === 'NO_SHOW'
                const isBooked = b.status === 'BOOKED'

                return (
                  <div key={b.id} className="p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <ClassNameDisplay
                          name={b.class.name}
                          nameTh={b.class.classType?.nameTh}
                          classTypeName={b.class.classType?.name}
                          classTypeNameTh={b.class.classType?.nameTh}
                          size="sm"
                        />
                        <p className="text-[11px] text-[var(--foreground-muted)] mt-1">
                          {bangkokDate(b.class.date)} · {b.class.startTime}
                          {b.class.endTime ? `–${b.class.endTime}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] tracking-wider uppercase font-medium">
                          {isAttended && <span className="text-emerald-700">Attended</span>}
                          {isCancelled && <span className="text-[var(--foreground-muted)]/70">Cancelled</span>}
                          {isNoShow && <span className="text-rose-700">No Show</span>}
                          {isBooked && <span className="text-[var(--foreground)]">Booked</span>}
                        </span>
                        <p className="text-[10px] text-[var(--foreground-muted)] mt-1">
                          {b.class.duration || 50} min
                        </p>
                      </div>
                    </div>

                    {b.class.instructor?.name && (
                      <p className="text-xs text-[var(--foreground-muted)] pt-1 border-t border-black/5">
                        Instructor: <span className="text-[var(--foreground)] font-medium">{b.class.instructor.name}</span>
                      </p>
                    )}
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
