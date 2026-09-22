'use client'

import { useState, useMemo } from 'react'
import BookButton from './BookButton'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('Schedule')
  const CUTOFF_MS = 12 * 60 * 60 * 1000

  // Show 14 days starting today
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
  const [selectedClass, setSelectedClass] = useState<any | null>(null)

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const clsBkkMidnight = getBangkokMidnight(new Date(cls.date))
      return clsBkkMidnight.getTime() === selectedTimestamp
    })
  }, [classes, selectedTimestamp])

  return (
    <div>
      {/* ── Horizontal Date Picker ──────────────────────────────────────────── */}
      {/* On mobile: 7 pills visible at once (w-[calc(100%/7-4px)]), scroll for more */}
      <div className="mb-10">
        <div
          className="flex overflow-x-auto py-4 gap-1 snap-x hide-scrollbar -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {dates.map(d => {
            const isSelected = d.timestamp === selectedTimestamp
            const hasClasses = classes.some(
              cls => getBangkokMidnight(new Date(cls.date)).getTime() === d.timestamp
            )
            return (
              <button
                key={d.timestamp}
                onClick={() => setSelectedTimestamp(d.timestamp)}
                className={`
                  relative snap-start flex-shrink-0 flex flex-col items-center justify-center
                  w-[calc(100%/7.5)] md:w-[72px]
                  h-[60px] md:h-[90px]
                  rounded-full transition-all duration-300 border text-center
                  ${isSelected
                    ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)] shadow-lg scale-105'
                    : 'bg-transparent border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] hover:bg-black/5'
                  }
                  ${!hasClasses && !isSelected ? 'opacity-35' : ''}
                `}
              >
                <span className={`text-[7px] md:text-[9px] tracking-wider uppercase mb-0.5 ${isSelected ? 'text-[var(--background)]/75' : 'text-[var(--foreground-muted)]'}`}>
                  {d.dayName}
                </span>
                <span className="text-base md:text-xl font-light leading-none">{d.dateNumber}</span>
                {hasClasses && (
                  <div className={`absolute bottom-2 w-1 h-1 rounded-full ${isSelected ? 'bg-[var(--background)]' : 'bg-[var(--accent)]'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Class List ─────────────────────────────────────────────────────── */}
      <div className="bg-white/60 rounded-[2.5rem] p-5 md:p-12 backdrop-blur-xl border border-white shadow-sm">
        {filteredClasses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--foreground-muted)] font-serif italic text-xl mb-2">{t('dayOfRest')}</p>
            <p className="text-xs tracking-widest uppercase text-[var(--foreground-muted)]/70">{t('noClasses')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredClasses.map(cls => {
              const isFull   = cls.bookedCount >= cls.capacity
              const isPast   = Date.now() + CUTOFF_MS > new Date(cls.date).getTime()
              const isBooked = bookedClassIds.includes(cls.id)
              const spotsLeft = cls.capacity - cls.bookedCount

              return (
                // Clicking the row opens the detail panel
                <div
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className="group py-5 md:py-8 first:pt-3 last:pb-3 flex items-center justify-between gap-4 hover:bg-white/40 transition-colors -mx-5 px-5 md:-mx-12 md:px-12 rounded-3xl cursor-pointer"
                >
                  {/* Time */}
                  <div className="min-w-[60px] md:min-w-[90px]">
                    <p className="text-lg md:text-2xl font-light text-[var(--foreground)] tracking-tight">{cls.startTime}</p>
                    <p className="text-[9px] md:text-[10px] tracking-[0.15em] uppercase text-[var(--foreground-muted)] mt-1">{cls.duration} min</p>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-10 bg-[var(--border)] hidden sm:block" />

                  {/* Class info */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm md:text-lg font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors truncate">{cls.name}</p>
                    {cls.instructor && (
                      <p className="text-[11px] md:text-sm font-light text-[var(--foreground-muted)] mt-0.5 truncate">
                        with <span className="font-medium text-[var(--foreground)]">{cls.instructor.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Right: spots + status */}
                  <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {isBooked ? (
                      <span className="text-[9px] md:text-[10px] tracking-[0.15em] uppercase text-[var(--accent)] border border-[var(--accent)]/40 bg-[var(--accent)]/5 rounded-full px-4 md:px-6 py-2 md:py-3 font-medium">
                        {t('reserved')}
                      </span>
                    ) : (
                      <>
                        {!isFull && !isPast && (
                          <span className="hidden sm:block text-[10px] text-[var(--foreground-muted)]">
                            <span className="font-medium text-[var(--foreground)]">{spotsLeft}</span> left
                          </span>
                        )}
                        <BookButton classId={cls.id} isLoggedIn={isLoggedIn} isFull={isFull} isPast={isPast} userRole={userRole} />
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Class Detail Slide-Over ─────────────────────────────────────────── */}
      {selectedClass && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedClass(null)}
          />
          {/* Panel */}
          <div className="fixed inset-x-0 bottom-0 z-50 md:inset-auto md:right-0 md:top-0 md:w-[420px] flex flex-col bg-[var(--background)] md:h-screen shadow-2xl rounded-t-[2rem] md:rounded-none overflow-hidden">
            {/* Handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-black/20" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-8 pt-6 pb-5 border-b border-[var(--border)]">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-1">{t('classDetails')}</p>
                <h3 className="text-2xl font-serif font-normal text-[var(--foreground)]">{selectedClass.name}</h3>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="p-2 -mr-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

              {/* Date / Time / Duration row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-1">{t('date')}</p>
                  <p className="text-sm font-light text-[var(--foreground)]">
                    {new Date(selectedClass.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-1">{t('time')}</p>
                  <p className="text-sm font-light text-[var(--foreground)]">{selectedClass.startTime}–{selectedClass.endTime}</p>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-1">{t('duration')}</p>
                  <p className="text-sm font-light text-[var(--foreground)]">{selectedClass.duration} min</p>
                </div>
              </div>

              {/* Capacity */}
              <div>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-2">{t('availability')}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-black/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--foreground)] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (selectedClass.bookedCount / selectedClass.capacity) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--foreground-muted)] whitespace-nowrap">
                    {selectedClass.capacity - selectedClass.bookedCount} / {selectedClass.capacity} {t('spotsLeft')}
                  </span>
                </div>
              </div>

              {/* Instructor */}
              {selectedClass.instructor && (
                <div className="p-5 bg-white/60 rounded-2xl border border-white/80">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">{t('instructor')}</p>
                  <div className="flex items-center gap-4">
                    {selectedClass.instructor.imageUrl ? (
                      <img src={selectedClass.instructor.imageUrl} alt={selectedClass.instructor.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[var(--foreground)]/10 flex items-center justify-center text-[var(--foreground)] font-medium text-sm">
                        {selectedClass.instructor.name?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{selectedClass.instructor.name}</p>
                      {selectedClass.instructor.bio && (
                        <p className="text-xs text-[var(--foreground-muted)] mt-0.5 line-clamp-2">{selectedClass.instructor.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Class description */}
              {selectedClass.classType?.description && (
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-2">{t('aboutClass')}</p>
                  <p className="text-sm text-[var(--foreground)]/80 font-light leading-relaxed">{selectedClass.classType.description}</p>
                </div>
              )}

              {/* Notes */}
              {selectedClass.notes && (
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-2">{t('notes')}</p>
                  <p className="text-sm text-[var(--foreground)]/80 font-light leading-relaxed italic">{selectedClass.notes}</p>
                </div>
              )}

              {/* Upcoming sessions link */}
              {selectedClass.classTypeId && (
                <Link
                  href={`/classes/${selectedClass.classTypeId}`}
                  className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                  onClick={() => setSelectedClass(null)}
                >
                  {t('viewUpcomingSessions')}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}
            </div>

            {/* Footer CTA */}
            <div className="px-8 py-6 border-t border-[var(--border)] bg-[var(--background)]">
              {bookedClassIds.includes(selectedClass.id) ? (
                <div className="w-full text-center py-4 text-[10px] tracking-[0.2em] uppercase text-[var(--accent)] border border-[var(--accent)]/40 bg-[var(--accent)]/5 rounded-full font-medium">
                  {t('youAreReserved')}
                </div>
              ) : (
                <div onClick={() => setSelectedClass(null)}>
                  <BookButton
                    classId={selectedClass.id}
                    isLoggedIn={isLoggedIn}
                    isFull={selectedClass.bookedCount >= selectedClass.capacity}
                    isPast={Date.now() + CUTOFF_MS > new Date(selectedClass.date).getTime()}
                    userRole={userRole}
                    fullWidth
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
