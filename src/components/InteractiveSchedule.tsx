'use client'

import { useState, useMemo } from 'react'
import BookButton from './BookButton'
import { Link } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import ClassNameDisplay from '@/components/ClassNameDisplay'
import { isPastCutoff, isTooFarInAdvance } from '@/lib/booking-window'

const TZ_OFFSET = 7 // Bangkok UTC+7

function getBangkokMidnight(date: Date) {
  const local = new Date(date.getTime() + TZ_OFFSET * 60 * 60 * 1000)
  local.setUTCHours(0, 0, 0, 0)
  return local
}

// Find Monday of a given week offset from today (0 = current week, 1 = next week, etc.)
function getStartOfWeek(baseDate: Date, weekOffset: number = 0) {
  const d = new Date(baseDate.getTime())
  const day = d.getUTCDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diffToMonday + weekOffset * 7)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// Calculate end time string from startTime (HH:MM) and duration in minutes
function getEndTime(startTime: string, durationMinutes: number) {
  const [hours, minutes] = startTime.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return ''
  const totalMinutes = hours * 60 + minutes + (durationMinutes || 50)
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMins = totalMinutes % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`
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
  const locale = useLocale()

  const [weekOffset, setWeekOffset] = useState(0)

  // Bangkok today at midnight
  const todayLocal = useMemo(() => getBangkokMidnight(new Date()), [])

  // 7 days window (Monday to Sunday) for the selected week offset
  const dates = useMemo(() => {
    const monday = getStartOfWeek(todayLocal, weekOffset)
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000)
      return {
        dateObj: d,
        timestamp: d.getTime(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
        dateNumber: d.getUTCDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
        year: d.getUTCFullYear(),
        isToday: d.getTime() === todayLocal.getTime(),
      }
    })
  }, [todayLocal, weekOffset])

  const [selectedTimestamp, setSelectedTimestamp] = useState(() => todayLocal.getTime())
  const [selectedClass, setSelectedClass] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInstructor, setSelectedInstructor] = useState<string>('ALL')

  // Extract unique instructors list for dropdown
  const instructors = useMemo(() => {
    const set = new Set<string>()
    classes.forEach(c => {
      if (c.instructor?.name) set.add(c.instructor.name)
    })
    return Array.from(set).sort()
  }, [classes])

  // Pre-calculate midnight time for each class
  const classesWithMidnight = useMemo(() => {
    return classes.map(cls => ({
      ...cls,
      midnightTime: getBangkokMidnight(new Date(cls.date)).getTime(),
      endTime: getEndTime(cls.startTime, cls.duration || 50),
    }))
  }, [classes])

  // Filter classes for currently selected day + search + instructor
  const filteredClasses = useMemo(() => {
    return classesWithMidnight.filter(cls => {
      if (cls.midnightTime !== selectedTimestamp) return false

      if (selectedInstructor !== 'ALL' && cls.instructor?.name !== selectedInstructor) {
        return false
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const nameMatch = cls.name?.toLowerCase().includes(query)
        const typeMatch = cls.classType?.name?.toLowerCase().includes(query) || cls.classType?.nameTh?.toLowerCase().includes(query)
        const instructorMatch = cls.instructor?.name?.toLowerCase().includes(query)
        if (!nameMatch && !typeMatch && !instructorMatch) return false
      }

      return true
    })
  }, [classesWithMidnight, selectedTimestamp, selectedInstructor, searchQuery])

  const handlePrevWeek = () => {
    if (weekOffset > 0) {
      setWeekOffset(w => w - 1)
      setSelectedTimestamp(prev => prev - 7 * 24 * 60 * 60 * 1000)
    }
  }

  const handleNextWeek = () => {
    if (weekOffset < 8) {
      setWeekOffset(w => w + 1)
      setSelectedTimestamp(prev => prev + 7 * 24 * 60 * 60 * 1000)
    }
  }

  // Header date range string e.g. "2 - 8 Nov 2026" or "26 Oct - 1 Nov 2026"
  const rangeHeader = useMemo(() => {
    if (dates.length < 7) return ''
    const first = dates[0]
    const last = dates[6]
    if (first.year !== last.year) {
      return `${first.dateNumber} ${first.monthName} ${first.year} - ${last.dateNumber} ${last.monthName} ${last.year}`
    }
    if (first.monthName !== last.monthName) {
      return `${first.dateNumber} ${first.monthName} - ${last.dateNumber} ${last.monthName} ${last.year}`
    }
    return `${first.dateNumber} - ${last.dateNumber} ${last.monthName} ${last.year}`
  }, [dates])

  return (
    <div className="w-full">
      {/* ── Main Schedule Table Card Container ─────────────────────────── */}
      <div className="bg-white/70 backdrop-blur-xl border border-black/10 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        
        {/* ── Top Bar: Date Range + Nav + Search + Instructor Filter ── */}
        <div className="p-4 md:p-6 border-b border-black/5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Left: Date Range & Nav Arrows */}
          <div className="flex items-center justify-between lg:justify-start gap-3">
            <span className="font-serif text-lg md:text-xl text-[var(--foreground)] tracking-tight font-normal">
              {rangeHeader}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevWeek}
                disabled={weekOffset === 0}
                aria-label="Previous week"
                className="w-8 h-8 rounded-lg border border-black/10 flex items-center justify-center text-[var(--foreground)] hover:bg-black/5 transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                disabled={weekOffset >= 8}
                aria-label="Next week"
                className="w-8 h-8 rounded-lg border border-black/10 flex items-center justify-center text-[var(--foreground)] hover:bg-black/5 transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* Right: Search & Instructor Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-1 lg:max-w-xl lg:justify-end">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--foreground-muted)]/60">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search class or instructor..."
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl bg-white/60 border border-black/10 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/60 focus:outline-none focus:border-[var(--accent)] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-2.5 flex items-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* Instructor Filter */}
            <div className="relative min-w-[150px]">
              <select
                value={selectedInstructor}
                onChange={e => setSelectedInstructor(e.target.value)}
                className="w-full text-xs px-3 py-2.5 pr-8 rounded-xl bg-white/60 border border-black/10 text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-all cursor-pointer appearance-none"
              >
                <option value="ALL">All Instructors</option>
                {instructors.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[var(--foreground-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>
          </div>

        </div>

        {/* ── 7-Day Week Tabs Bar ────────────────────────────────────────── */}
        <div className="grid grid-cols-7 border-b border-black/5 divide-x divide-black/5 bg-transparent">
          {dates.map((d) => {
            const isSelected = d.timestamp === selectedTimestamp

            return (
              <button
                key={d.timestamp}
                type="button"
                onClick={() => setSelectedTimestamp(d.timestamp)}
                className={`py-4 md:py-5 px-1 md:px-2 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#E5EDF5] text-[#2C4875]'
                    : 'hover:bg-black/[0.02] text-[var(--foreground-muted)]'
                }`}
              >
                <span className={`text-[11px] md:text-xs mb-1 font-normal ${
                  isSelected ? 'text-[#2C4875]' : 'text-[var(--foreground-muted)]'
                }`}>
                  {d.dayName}
                </span>
                <span className={`text-xl md:text-2xl font-light ${
                  isSelected ? 'font-normal text-[#2C4875]' : 'text-[var(--foreground)]'
                }`}>
                  {d.dateNumber}
                </span>
                {d.isToday && (
                  <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-[#2C4875]' : 'bg-[var(--accent)]'}`} />
                )}
              </button>
            )
          })}
        </div>

        {/* ── Class Schedule Table ─────────────────────────────────────── */}
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Upcoming Classes Schedule">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-20 px-4">
              <p className="text-[var(--foreground-muted)] font-serif italic text-xl mb-2">
                {t('dayOfRest')}
              </p>
              <p className="text-xs tracking-widest uppercase text-[var(--foreground-muted)]/70">
                {searchQuery || selectedInstructor !== 'ALL' ? 'No matching classes found.' : t('noClasses')}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-black/5 text-xs text-[var(--foreground-muted)] font-normal">
                  <th className="py-4 pl-6 md:pl-8 font-normal">Time</th>
                  <th className="py-4 px-4 font-normal">Class</th>
                  <th className="py-4 px-4 font-normal">Instructor</th>
                  <th className="py-4 px-4 font-normal">Type</th>
                  <th className="py-4 px-4 font-normal">Status</th>
                  <th className="py-4 pr-6 md:pr-8 text-right font-normal">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-sm">
                {filteredClasses.map(cls => {
                  const isFull = cls.bookedCount >= cls.capacity
                  const isPast = isPastCutoff(cls.date)
                  const isTooFar = isTooFarInAdvance(cls.date)
                  const isBooked = bookedClassIds.includes(cls.id)
                  const spotsLeft = cls.capacity - cls.bookedCount

                  return (
                    <tr
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className="hover:bg-black/[0.02] transition-colors cursor-pointer"
                    >
                      {/* Time */}
                      <td className="py-4 pl-6 md:pl-8 text-sm font-normal text-[var(--foreground)]">
                        {cls.startTime} - {cls.endTime}
                      </td>

                      {/* Class Name */}
                      <td className="py-4 px-4 text-sm text-[var(--foreground)] font-normal">
                        <div className="max-w-[200px] md:max-w-xs truncate">
                          <ClassNameDisplay
                            name={cls.name}
                            nameTh={cls.classType?.nameTh}
                            classTypeName={cls.classType?.name}
                            classTypeNameTh={cls.classType?.nameTh}
                            size="sm"
                          />
                        </div>
                      </td>

                      {/* Instructor */}
                      <td className="py-4 px-4 text-sm font-normal text-[var(--foreground)]">
                        {cls.instructor ? cls.instructor.name : '—'}
                      </td>

                      {/* Type / Duration */}
                      <td className="py-4 px-4 text-sm font-normal text-[var(--foreground)]">
                        {cls.duration ? `${cls.duration} min` : '50 min'}
                      </td>

                      {/* Status - Clean typography, no colorful pills */}
                      <td className="py-4 px-4 text-sm font-normal">
                        {isPast ? (
                          <span className="text-[var(--foreground-muted)]/50">Past</span>
                        ) : isFull ? (
                          <span className="text-[var(--foreground-muted)]">Full</span>
                        ) : (
                          <span className="text-[var(--foreground)]">
                            {spotsLeft} {spotsLeft === 1 ? 'spot left' : 'spots left'}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 pr-6 md:pr-8 text-right" onClick={e => e.stopPropagation()}>
                        {isBooked ? (
                          <span className="text-xs uppercase tracking-wider text-[var(--foreground-muted)] font-medium">
                            {t('reserved')}
                          </span>
                        ) : (
                          <BookButton
                            classId={cls.id}
                            isLoggedIn={isLoggedIn}
                            isFull={isFull}
                            isPast={isPast}
                            isTooFarInAdvance={isTooFar}
                            userRole={userRole}
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

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
                <ClassNameDisplay name={selectedClass.name} nameTh={selectedClass.classType?.nameTh} classTypeName={selectedClass.classType?.name} classTypeNameTh={selectedClass.classType?.nameTh} size="lg" />
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="p-2 -mr-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
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
              <div className="grid grid-cols-3 gap-3 p-4 bg-white/40 rounded-2xl border border-[var(--border)] text-center">
                <div>
                  <p className="text-[9px] tracking-widest uppercase text-[var(--foreground-muted)] mb-1">{t('time')}</p>
                  <p className="text-base font-light text-[var(--foreground)]">{selectedClass.startTime}</p>
                  <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">{selectedClass.endTime}</p>
                </div>
                <div className="border-x border-[var(--border)]">
                  <p className="text-[9px] tracking-widest uppercase text-[var(--foreground-muted)] mb-1">{t('duration')}</p>
                  <p className="text-base font-light text-[var(--foreground)]">{selectedClass.duration || 50}</p>
                  <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">{t('min')}</p>
                </div>
                <div>
                  <p className="text-[9px] tracking-widest uppercase text-[var(--foreground-muted)] mb-1">{t('availability')}</p>
                  <p className="text-base font-light text-[var(--foreground)]">{selectedClass.capacity - selectedClass.bookedCount}</p>
                  <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">/ {selectedClass.capacity}</p>
                </div>
              </div>

              {/* Instructor card */}
              {selectedClass.instructor && (
                <div className="p-4 bg-white/40 rounded-2xl border border-[var(--border)] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-black/5 border border-black/10 flex items-center justify-center">
                    {selectedClass.instructor.imageUrl ? (
                      <img src={selectedClass.instructor.imageUrl} alt={selectedClass.instructor.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <span className="font-serif text-lg text-[var(--foreground-muted)] uppercase">
                        {selectedClass.instructor.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] tracking-widest uppercase text-[var(--foreground-muted)] mb-0.5">{t('instructor')}</p>
                    <p className="font-medium text-[var(--foreground)] truncate">{selectedClass.instructor.name}</p>
                    {selectedClass.instructor.bio && (
                      <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 mt-0.5">{selectedClass.instructor.bio}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {((locale === 'th' && selectedClass.classType?.descriptionTh) || selectedClass.classType?.description) && (
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mb-2">{t('aboutClass')}</p>
                  <p className="text-sm font-serif text-[var(--foreground-muted)] leading-relaxed">
                    {locale === 'th' && selectedClass.classType?.descriptionTh
                      ? selectedClass.classType.descriptionTh
                      : selectedClass.classType?.description}
                  </p>
                </div>
              )}

              {/* Class type link */}
              {selectedClass.classType?.id && (
                <div>
                  <Link
                    href={`/classes/${selectedClass.classType.id}`}
                    className="inline-block text-[10px] tracking-widest uppercase text-[var(--accent)] hover:underline font-medium"
                    onClick={() => setSelectedClass(null)}
                  >
                    {t('viewUpcomingSessions')} →
                  </Link>
                </div>
              )}

            </div>

            {/* Footer action */}
            <div className="p-8 border-t border-[var(--border)] bg-[var(--background)]">
              {bookedClassIds.includes(selectedClass.id) ? (
                <div className="text-center py-3 text-sm font-medium text-[var(--accent)] border border-[var(--accent)]/40 bg-[var(--accent)]/5 rounded-full">
                  {t('reserved')}
                </div>
              ) : (
                <div className="w-full">
                  <BookButton
                    classId={selectedClass.id}
                    isLoggedIn={isLoggedIn}
                    isFull={selectedClass.bookedCount >= selectedClass.capacity}
                    isPast={isPastCutoff(selectedClass.date)}
                    isTooFarInAdvance={isTooFarInAdvance(selectedClass.date)}
                    userRole={userRole}
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
