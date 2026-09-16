'use client'

import { useState, useMemo } from 'react'
import BookButton from './BookButton'
import Link from 'next/link'

const TZ_OFFSET = 7 // Bangkok UTC+7

function getBangkokMidnight(date: Date) {
  const local = new Date(date.getTime() + TZ_OFFSET * 60 * 60 * 1000)
  local.setUTCHours(0, 0, 0, 0)
  return local
}

export default function InteractiveSchedule({
  classes,
  bookedClassIds,
  isLoggedIn,
  userRole,
}: {
  classes: any[]
  bookedClassIds: string[]
  isLoggedIn: boolean
  userRole?: string
}) {
  const CUTOFF_MS = 12 * 60 * 60 * 1000

  // Determine the dates to show. We'll show today + the next 13 days (14 days total).
  const todayLocal = getBangkokMidnight(new Date())
  
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(todayLocal.getTime() + i * 24 * 60 * 60 * 1000)
    return {
      dateObj: d,
      timestamp: d.getTime(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      dateNumber: d.getUTCDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    }
  })

  const [selectedTimestamp, setSelectedTimestamp] = useState(dates[0].timestamp)

  // Filter classes by selected date
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const clsBkkMidnight = getBangkokMidnight(new Date(cls.date))
      return clsBkkMidnight.getTime() === selectedTimestamp
    })
  }, [classes, selectedTimestamp])

  return (
    <div>
      {/* Horizontal Date Picker */}
      <div className="mb-14">
        <div className="flex overflow-x-auto py-6 px-1 md:px-4 gap-1 md:gap-4 snap-x hide-scrollbar -mx-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {dates.map(d => {
            const isSelected = d.timestamp === selectedTimestamp
            
            // Check if there are ANY classes on this day
            const hasClasses = classes.some(cls => getBangkokMidnight(new Date(cls.date)).getTime() === d.timestamp)

            return (
              <button
                key={d.timestamp}
                onClick={() => setSelectedTimestamp(d.timestamp)}
                className={`
                  relative snap-start flex-shrink-0 flex flex-col items-center justify-center w-[46px] md:w-[72px] h-[76px] md:h-[100px] rounded-full transition-all duration-300 border
                  ${isSelected 
                    ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)] shadow-xl scale-110' 
                    : 'bg-transparent border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] hover:bg-black/5'
                  }
                  ${!hasClasses && !isSelected ? 'opacity-40 hover:opacity-70' : ''}
                `}
              >
                <span className={`text-[8px] md:text-[10px] tracking-widest md:tracking-[0.2em] uppercase mb-1 md:mb-2 ${isSelected ? 'text-[var(--background)]/80' : 'text-[var(--foreground-muted)]'}`}>{d.dayName}</span>
                <span className="text-xl md:text-2xl font-light">{d.dateNumber}</span>
                {hasClasses && !isSelected && (
                  <div className="absolute bottom-3 md:bottom-4 w-1 h-1 rounded-full bg-[var(--accent)]"></div>
                )}
                {hasClasses && isSelected && (
                  <div className="absolute bottom-3 md:bottom-4 w-1 h-1 rounded-full bg-[var(--background)]"></div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Class List */}
      <div className="bg-white/60 rounded-[2.5rem] p-6 md:p-12 backdrop-blur-xl border border-white shadow-sm">
        {filteredClasses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--foreground-muted)] font-serif italic text-xl mb-2">A day of rest.</p>
            <p className="text-xs tracking-widest uppercase text-[var(--foreground-muted)]/70">No classes scheduled.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredClasses.map(cls => {
              const isFull     = cls.bookedCount >= cls.capacity
              const isPast     = Date.now() + CUTOFF_MS > new Date(cls.date).getTime()
              const isBooked   = bookedClassIds.includes(cls.id)
              const spotsLeft  = cls.capacity - cls.bookedCount

              return (
                <div key={cls.id} className="group py-8 first:pt-4 last:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-white/40 transition-colors -mx-6 px-6 md:-mx-12 md:px-12 rounded-3xl">
                  {/* Date + Time */}
                  <div className="flex items-start md:items-center gap-6 md:gap-10 flex-1">
                    <div className="min-w-[100px]">
                      <p className="text-2xl font-light text-[var(--foreground)] tracking-tight">
                        {cls.startTime}
                      </p>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mt-2">
                        {cls.duration} min
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-12 bg-[var(--border)] hidden sm:block"></div>

                    {/* Class info */}
                    <div className="flex-1 pr-4">
                      {cls.classTypeId ? (
                        <Link href={`/en/classes/${cls.classTypeId}`} className="inline-block hover:opacity-80 transition-opacity">
                          <p className="text-xl font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors inline-flex items-center gap-2">
                            {cls.name}
                            <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-1 text-[var(--foreground-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </p>
                        </Link>
                      ) : (
                        <p className="text-xl font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{cls.name}</p>
                      )}
                      
                      {cls.instructor && (
                        <p className="text-sm font-light text-[var(--foreground-muted)] mt-1">
                          with <span className="font-medium text-[var(--foreground)]">{cls.instructor.name}</span>
                        </p>
                      )}
                      {cls.classType?.description && (
                        <p className="text-sm text-[var(--foreground)]/70 mt-2 font-light line-clamp-2 leading-relaxed">{cls.classType.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right side: spots + book */}
                  <div className="flex items-center justify-between sm:justify-end gap-8 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
                    <div className="text-left sm:text-right">
                      {!isFull && !isPast ? (
                        <>
                          <p className="text-sm font-light text-[var(--foreground-muted)]">
                            <span className="font-medium text-[var(--foreground)]">{spotsLeft}</span> spot{spotsLeft !== 1 ? 's' : ''} left
                          </p>
                          <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mt-1">Available</p>
                        </>
                      ) : isFull ? (
                        <>
                          <p className="text-sm font-medium text-[var(--foreground-muted)]">0 spots</p>
                          <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mt-1">Waitlist</p>
                        </>
                      ) : null}
                    </div>

                    {isBooked ? (
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--accent)] border border-[var(--accent)] bg-[var(--accent)]/5 rounded-full px-8 py-4 font-medium shadow-sm">
                        Reserved ✓
                      </span>
                    ) : (
                      <BookButton
                        classId={cls.id}
                        isLoggedIn={isLoggedIn}
                        isFull={isFull}
                        isPast={isPast}
                        userRole={userRole}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
