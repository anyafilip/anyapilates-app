'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ClassNameDisplay from '@/components/ClassNameDisplay'

const TZ_OFFSET = 7

interface ClassItem {
  id: string
  name: string
  startTime: string
  endTime: string
  duration: number
  capacity: number
  bookedCount: number
  date: string // ISO string
  classType: { name: string } | null
  bookings: { id: string; status: string; client: { name: string } }[]
}

function getBangkokDay(isoDate: string) {
  // Shift UTC date to Bangkok, then extract YYYY-MM-DD key
  const d = new Date(new Date(isoDate).getTime() + TZ_OFFSET * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

function formatDayKey(key: string) {
  const d = new Date(key + 'T00:00:00Z')
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    day:     d.toLocaleDateString('en-US', { day: 'numeric',   timeZone: 'UTC' }),
    month:   d.toLocaleDateString('en-US', { month: 'short',  timeZone: 'UTC' }),
    full:    d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }),
  }
}

function getWeekLabel(key: string) {
  const d = new Date(key + 'T00:00:00Z')
  const dayOfWeek = d.getUTCDay()
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

function getWeekStart(key: string) {
  const d = new Date(key + 'T00:00:00Z')
  const dayOfWeek = d.getUTCDay()
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  return monday.toISOString().slice(0, 10)
}

function todayKey() {
  const d = new Date(Date.now() + TZ_OFFSET * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

export default function InstructorScheduleView({ classes }: { classes: ClassItem[] }) {
  const today = todayKey()

  // Build sorted list of unique day keys that have classes
  const dayKeys: string[] = useMemo(() => {
    const keys = new Set(classes.map(c => getBangkokDay(c.date)))
    return Array.from(keys).sort()
  }, [classes])

  const [selectedDay, setSelectedDay] = useState<string>(dayKeys[0] ?? today)

  // Group classes by day key
  const byDay = useMemo(() => {
    const map: Record<string, ClassItem[]> = {}
    for (const cls of classes) {
      const key = getBangkokDay(cls.date)
      if (!map[key]) map[key] = []
      map[key].push(cls)
    }
    return map
  }, [classes])

  // Group day keys into weeks
  const weeks: Record<string, string[]> = useMemo(() => {
    const wk: Record<string, string[]> = {}
    for (const key of dayKeys) {
      const ws = getWeekStart(key)
      if (!wk[ws]) wk[ws] = []
      wk[ws].push(key)
    }
    return wk
  }, [dayKeys])

  const selectedClasses = byDay[selectedDay] ?? []
  const { full: selectedFull } = selectedDay ? formatDayKey(selectedDay) : { full: '' }

  if (classes.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-16 text-center shadow-sm">
        <p className="font-serif italic text-[var(--foreground-muted)] text-xl mb-2">Your schedule is beautifully clear.</p>
        <p className="text-xs tracking-widest uppercase text-[var(--foreground-muted)]/60">No upcoming classes in the next 6 weeks.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* ── Left: Week/Day Picker ───────────────────────────────────────── */}
      <aside className="lg:w-64 xl:w-72 flex-shrink-0">
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden shadow-sm sticky top-4">
          <div className="px-4 py-4 border-b border-[var(--border)]">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--foreground-muted)]">Jump to</p>
          </div>
          <div className="overflow-y-auto max-h-[70vh]">
            {Object.entries(weeks).map(([weekStart, keys]) => (
              <div key={weekStart}>
                {/* Week label */}
                <div className="px-4 py-2 bg-[var(--surface)]/60 border-b border-[var(--border)]/50">
                  <p className="text-[9px] tracking-[0.25em] uppercase text-[var(--foreground-muted)]">
                    {getWeekLabel(keys[0])}
                  </p>
                </div>
                {/* Days in this week */}
                {keys.map(key => {
                  const isSelected = key === selectedDay
                  const isToday   = key === today
                  const { weekday, day, month } = formatDayKey(key)
                  const count = byDay[key]?.length ?? 0
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDay(key)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all border-b border-[var(--border)]/30 last:border-b-0 ${
                        isSelected
                          ? 'bg-[var(--foreground)] text-white'
                          : 'hover:bg-white/80 text-[var(--foreground)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-center w-8 ${isSelected ? 'text-white' : ''}`}>
                          <p className={`text-[9px] tracking-widest uppercase ${isSelected ? 'text-white/60' : 'text-[var(--foreground-muted)]'}`}>{weekday}</p>
                          <p className={`text-base font-light leading-tight ${isSelected ? 'text-white' : 'text-[var(--foreground)]'}`}>{day}</p>
                        </div>
                        <div>
                          <p className={`text-[10px] tracking-widest uppercase ${isSelected ? 'text-white/70' : 'text-[var(--foreground-muted)]'}`}>{month}</p>
                          {isToday && (
                            <p className={`text-[8px] tracking-widest uppercase font-medium ${isSelected ? 'text-white/50' : 'text-[var(--accent)]'}`}>Today</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-[var(--foreground)]/8 text-[var(--foreground-muted)]'}`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Right: Day Detail ──────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Day Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-light text-[var(--foreground)]">{selectedFull}</h2>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mt-0.5">
              {selectedClasses.length} {selectedClasses.length === 1 ? 'Class' : 'Classes'}
            </p>
          </div>
          {selectedDay === today && (
            <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--accent)] border border-[var(--accent)]/30 rounded-full px-4 py-1.5">
              Today
            </span>
          )}
        </div>

        {/* Class Cards */}
        <div className="space-y-4">
          {selectedClasses.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-12 text-center shadow-sm">
              <p className="font-serif italic text-[var(--foreground-muted)] text-lg">No classes on this day.</p>
            </div>
          ) : (
            selectedClasses.map(cls => {
              const booked = cls.bookings.filter(b => b.status !== 'CANCELLED')
              const spotsLeft = cls.capacity - cls.bookedCount
              const isFull = cls.bookedCount >= cls.capacity

              return (
                <div key={cls.id} className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl overflow-hidden shadow-sm">
                  {/* Main row */}
                  <div className="flex items-start md:items-center justify-between px-6 py-6 gap-4">
                    {/* Time block */}
                    <div className="flex-shrink-0 text-center w-16">
                      <p className="text-xl font-light text-[var(--foreground)]">{cls.startTime}</p>
                      <p className="text-[9px] tracking-widest uppercase text-[var(--foreground-muted)] mt-0.5">{cls.duration}m</p>
                    </div>

                    <div className="w-px h-10 bg-[var(--border)] hidden sm:block flex-shrink-0" />

                    {/* Class info */}
                    <div className="flex-1 min-w-0">
                      <ClassNameDisplay name={cls.name} classTypeName={cls.classType?.name} />
                      <p className="text-sm text-[var(--foreground-muted)] font-light mt-1">
                        {cls.startTime} – {cls.endTime}
                      </p>
                    </div>

                    {/* Booking count + action */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-base font-medium text-[var(--foreground)]">
                          {cls.bookedCount}
                          <span className="text-[var(--foreground-muted)] font-light text-sm"> / {cls.capacity}</span>
                        </p>
                        <p className={`text-[9px] tracking-widest uppercase mt-0.5 ${isFull ? 'text-[var(--foreground-muted)]' : 'text-[var(--foreground-muted)]'}`}>
                          {isFull ? 'Full' : `${spotsLeft} open`}
                        </p>
                      </div>
                      <Link
                        href={`/instructor/class/${cls.id}`}
                        className="border border-[var(--border)] px-5 py-2 rounded-full text-[10px] tracking-widest uppercase text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-white transition-all duration-200 whitespace-nowrap"
                      >
                        View Roster
                      </Link>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div className="px-6 pb-2">
                    <div className="h-0.5 bg-black/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--foreground)] rounded-full transition-all"
                        style={{ width: `${Math.min(100, (cls.bookedCount / cls.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Roster preview (only if clients booked) */}
                  {booked.length > 0 && (
                    <div className="border-t border-[var(--border)] bg-white/40 px-6 py-3 flex flex-wrap gap-2 items-center">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mr-1">Booked:</span>
                      {booked.map(b => (
                        <span
                          key={b.id}
                          className="inline-flex items-center gap-1.5 text-[11px] font-light text-[var(--foreground)] bg-white border border-white/80 rounded-full px-3 py-1"
                        >
                          <span className="w-4 h-4 rounded-full bg-[var(--foreground)]/10 flex items-center justify-center text-[8px] font-medium uppercase flex-shrink-0">
                            {b.client.name?.[0]}
                          </span>
                          {b.client.name}
                        </span>
                      ))}
                      {booked.length === 0 && (
                        <span className="text-[11px] italic text-[var(--foreground-muted)]">No bookings yet</span>
                      )}
                    </div>
                  )}

                  {booked.length === 0 && (
                    <div className="border-t border-[var(--border)]/50 bg-white/20 px-6 py-3">
                      <span className="text-[11px] italic text-[var(--foreground-muted)]">No bookings yet — {cls.capacity} spots available</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Navigation between days */}
        <div className="flex justify-between mt-8 pt-6 border-t border-[var(--border)]">
          {(() => {
            const idx = dayKeys.indexOf(selectedDay)
            const prev = dayKeys[idx - 1]
            const next = dayKeys[idx + 1]
            return (
              <>
                {prev ? (
                  <button onClick={() => setSelectedDay(prev)} className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-2">
                    ← {formatDayKey(prev).full}
                  </button>
                ) : <div />}
                {next ? (
                  <button onClick={() => setSelectedDay(next)} className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-2">
                    {formatDayKey(next).full} →
                  </button>
                ) : <div />}
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
