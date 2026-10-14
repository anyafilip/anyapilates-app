'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { createPortal } from 'react-dom'

interface ScheduleDatePickerProps {
  selectedDate?: string // YYYY-MM-DD
  dateParamName?: string
  pageParamName?: string
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function ScheduleDatePicker({
  selectedDate = '',
  dateParamName = 'date',
  pageParamName = 'page',
}: ScheduleDatePickerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})

  // Determine initial calendar view month/year
  const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date()
  const [viewYear, setViewYear] = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth())

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // If selectedDate prop changes, update view month
  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate + 'T00:00:00')
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [selectedDate])

  const openPopover = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const scrollY = window.scrollY
    const scrollX = window.scrollX
    const spaceBelow = window.innerHeight - rect.bottom
    const popoverHeight = 350

    if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
      setMenuStyle({
        position: 'absolute',
        top: rect.top + scrollY - popoverHeight - 6,
        left: Math.max(12, Math.min(rect.left + scrollX, window.innerWidth - 320)),
        width: 300,
        zIndex: 9999,
      })
    } else {
      setMenuStyle({
        position: 'absolute',
        top: rect.bottom + scrollY + 6,
        left: Math.max(12, Math.min(rect.left + scrollX, window.innerWidth - 320)),
        width: 300,
        zIndex: 9999,
      })
    }
    setIsOpen(true)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    function handleClose(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClose)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClose)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  const handleSelectDate = (dateString: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (dateString) {
      params.set(dateParamName, dateString)
    } else {
      params.delete(dateParamName)
    }
    params.delete(pageParamName) // Reset pagination
    router.push(`${pathname}?${params.toString()}`)
    setIsOpen(false)
  }

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  // Generate calendar days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const formatLocalDate = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  const todayStr = formatLocalDate(today.getFullYear(), today.getMonth(), today.getDate())
  const tomorrow = new Date(today.getTime() + 86400000)
  const tomorrowStr = formatLocalDate(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())

  // Trigger label display
  let triggerLabel = 'Pick Date'
  if (selectedDate) {
    const parsed = new Date(selectedDate + 'T00:00:00')
    triggerLabel = parsed.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const popover = mounted && isOpen ? createPortal(
    <div
      ref={popoverRef}
      style={menuStyle}
      className="bg-[#EDE8E2] backdrop-blur-2xl border border-white/80 rounded-3xl shadow-2xl p-5 text-stone-800 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Header: Month / Year + Prev/Next */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h4 className="font-serif text-base text-[var(--foreground)] font-normal tracking-wide">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 text-[var(--foreground-muted)] transition-colors"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 text-[var(--foreground-muted)] transition-colors"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {DAY_NAMES.map((day, i) => (
          <div key={i} className="text-[10px] tracking-widest uppercase font-medium text-[var(--foreground-muted)]/70 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Leading empty cells */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="w-8 h-8" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNumber = i + 1
          const dateStr = formatLocalDate(viewYear, viewMonth, dayNumber)
          const isSelected = selectedDate === dateStr
          const isToday = todayStr === dateStr

          return (
            <button
              key={dayNumber}
              type="button"
              onClick={() => handleSelectDate(dateStr)}
              className={`
                w-8 h-8 rounded-full text-xs flex flex-col items-center justify-center transition-all relative mx-auto
                ${isSelected
                  ? 'bg-[var(--foreground)] text-[var(--background)] font-medium shadow-md scale-105'
                  : 'hover:bg-white/80 text-[var(--foreground)] font-light'
                }
              `}
            >
              <span>{dayNumber}</span>
              {isToday && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-[var(--accent)] absolute bottom-1" />
              )}
            </button>
          )
        })}
      </div>

      {/* Quick shortcuts at bottom */}
      <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[11px] gap-2">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => handleSelectDate(todayStr)}
            className="px-2.5 py-1 rounded-full border border-black/10 bg-white/40 hover:bg-white/80 transition-colors uppercase tracking-wider text-[9px] text-[var(--foreground)]"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleSelectDate(tomorrowStr)}
            className="px-2.5 py-1 rounded-full border border-black/10 bg-white/40 hover:bg-white/80 transition-colors uppercase tracking-wider text-[9px] text-[var(--foreground)]"
          >
            Tomorrow
          </button>
        </div>

        {selectedDate && (
          <button
            type="button"
            onClick={() => handleSelectDate('')}
            className="text-[10px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] underline underline-offset-2 transition-colors uppercase tracking-wider"
          >
            Clear Date
          </button>
        )}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => isOpen ? setIsOpen(false) : openPopover()}
        className={`
          px-3 py-2 md:px-5 md:py-3 bg-white/60 backdrop-blur-md border border-white/80 rounded-full
          text-xs md:text-sm text-stone-800 flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-black/20
          cursor-pointer shadow-sm transition-colors hover:bg-white/80
          ${selectedDate ? 'border-[var(--foreground)]/40 bg-white/80 font-medium' : ''}
        `}
      >
        <svg
          className="w-4 h-4 text-[var(--foreground-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        <span className="truncate">{triggerLabel}</span>

        {selectedDate ? (
          <span
            onClick={(e) => {
              e.stopPropagation()
              handleSelectDate('')
            }}
            className="ml-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 text-stone-500 hover:text-stone-800 transition-colors"
            title="Clear date"
          >
            ×
          </span>
        ) : (
          <svg
            className={`w-3.5 h-3.5 text-[var(--foreground-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {popover}
    </div>
  )
}
