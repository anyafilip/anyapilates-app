'use client'

import { useState, useMemo } from 'react'

const TZ_OFFSET = 7 // Bangkok UTC+7

function getBangkokMidnight(date: Date) {
  const local = new Date(date.getTime() + TZ_OFFSET * 60 * 60 * 1000)
  local.setUTCHours(0, 0, 0, 0)
  return local
}

export default function AdminInteractiveSchedule({ sessions }: { sessions: any[] }) {
  const todayLocal = getBangkokMidnight(new Date())
  const dates = Array.from({ length: 21 }).map((_, i) => {
    const d = new Date(todayLocal.getTime() + (i - 7) * 24 * 60 * 60 * 1000)
    return {
      dateObj: d,
      timestamp: d.getTime(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      dateNumber: d.getUTCDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    }
  })

  const [selectedTimestamp, setSelectedTimestamp] = useState(dates[0].timestamp)

  const filteredSessions = useMemo(() => {
    return sessions.filter(cls => {
      const clsBkkMidnight = getBangkokMidnight(new Date(cls.date))
      return clsBkkMidnight.getTime() === selectedTimestamp
    })
  }, [sessions, selectedTimestamp])

  return (
    <div>
      <div className="mb-8">
        <div className="flex overflow-x-auto py-6 px-4 gap-4 snap-x hide-scrollbar -mx-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {dates.map(d => {
            const isSelected = d.timestamp === selectedTimestamp
            const hasClasses = sessions.some(cls => getBangkokMidnight(new Date(cls.date)).getTime() === d.timestamp)

            return (
              <button
                key={d.timestamp}
                onClick={() => setSelectedTimestamp(d.timestamp)}
                className={`
                  relative snap-start flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[100px] rounded-full transition-all duration-300 border
                  ${isSelected ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)] shadow-xl scale-110' : 'bg-transparent border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] hover:bg-black/5'}
                  ${!hasClasses && !isSelected ? 'opacity-40 hover:opacity-70' : ''}
                `}
              >
                <span className={`text-[10px] tracking-[0.2em] uppercase mb-2 ${isSelected ? 'text-[var(--background)]/80' : 'text-[var(--foreground-muted)]'}`}>{d.dayName}</span>
                <span className="text-2xl font-light">{d.dateNumber}</span>
                {hasClasses && !isSelected && <div className="absolute bottom-4 w-1 h-1 rounded-full bg-[var(--accent)]"></div>}
                {hasClasses && isSelected && <div className="absolute bottom-4 w-1 h-1 rounded-full bg-[var(--background)]"></div>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                <th className="font-medium py-6 pl-8">Class & Time</th>
                <th className="font-medium py-6">Instructor</th>
                <th className="font-medium py-6">Bookings</th>
                <th className="font-medium py-6 pr-8 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light text-[var(--foreground)]">
              {filteredSessions.map(cls => (
                <tr key={cls.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                  <td className="py-5 pl-8">
                    <p className="font-medium text-[var(--foreground)]">{cls.name}</p>
                    <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{cls.startTime} – {cls.endTime}</p>
                  </td>
                  <td className="py-5">
                    {cls.instructor?.name || '—'}
                  </td>
                  <td className="py-5">
                    {cls.bookedCount} / {cls.capacity}
                  </td>
                  <td className="py-5 pr-8 text-right">
                    <span className={cls.status === 'SCHEDULED' ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}>
                      {cls.status === 'SCHEDULED' ? 'Active' : 'Cancelled'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">No sessions on this date.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
