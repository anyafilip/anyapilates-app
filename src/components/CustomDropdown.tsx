'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

export interface DropdownOption {
  value: string
  label: string
}

interface CustomDropdownProps {
  options: DropdownOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  name?: string
  placeholder?: string
  required?: boolean
  className?: string
  variant?: 'standard' | 'minimal' | 'filter'
}

export default function CustomDropdown({
  options,
  value: controlledValue,
  defaultValue = '',
  onChange,
  name,
  placeholder = 'Select an option...',
  required = false,
  className = '',
  variant = 'standard',
}: CustomDropdownProps) {
  const [internalValue, setInternalValue] = useState<string>(
    controlledValue !== undefined ? controlledValue : defaultValue
  )
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const [mounted, setMounted] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Keep internal state synced if controlled
  useEffect(() => {
    if (controlledValue !== undefined) setInternalValue(controlledValue)
  }, [controlledValue])

  const currentValue = controlledValue !== undefined ? controlledValue : internalValue
  const selectedOption = options.find(o => o.value === currentValue)

  // Compute portal position from trigger rect
  const openMenu = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const scrollY = window.scrollY
    const scrollX = window.scrollX
    const spaceBelow = window.innerHeight - rect.bottom
    const menuHeight = Math.min(options.length * 48 + 16, 280)

    if (spaceBelow < menuHeight && rect.top > menuHeight) {
      // Open upward
      setMenuStyle({
        position: 'absolute',
        top: rect.top + scrollY - menuHeight - 4,
        left: rect.left + scrollX,
        width: Math.max(rect.width, 220),
        zIndex: 9999,
      })
    } else {
      setMenuStyle({
        position: 'absolute',
        top: rect.bottom + scrollY + 4,
        left: rect.left + scrollX,
        width: Math.max(rect.width, 220),
        zIndex: 9999,
      })
    }
    setIsOpen(true)
  }, [options.length])

  // Close on outside click / scroll / escape
  useEffect(() => {
    if (!isOpen) return

    function handleClose(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
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

  const handleSelect = (val: string) => {
    setInternalValue(val)
    onChange?.(val)
    setIsOpen(false)
  }

  // Trigger styles per variant
  let triggerClasses = ''
  if (variant === 'standard') {
    triggerClasses = `w-full border-b border-[var(--border)] px-3 py-3.5 text-sm font-light bg-transparent flex items-center justify-between text-left focus:outline-none focus:border-[var(--foreground)] transition-colors cursor-pointer ${
      selectedOption ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]/50'
    }`
  } else if (variant === 'minimal') {
    triggerClasses = `w-full inline-flex items-center justify-between gap-2 border border-black/10 rounded-full px-4 py-2 text-[11px] tracking-[0.12em] uppercase font-medium text-[var(--foreground)] cursor-pointer focus:outline-none hover:border-black/25 hover:bg-black/[0.03] transition-all bg-white/60 shadow-sm`
  } else if (variant === 'filter') {
    triggerClasses = `w-full px-5 py-3 bg-white/60 backdrop-blur-md border border-white/80 rounded-full text-sm text-stone-800 flex items-center justify-center gap-2 focus:outline-none focus:ring-1 focus:ring-black/20 cursor-pointer shadow-sm transition-colors hover:bg-white/80`
  }

  const menu = mounted && isOpen ? createPortal(
    <div
      ref={menuRef}
      role="listbox"
      style={menuStyle}
      className="bg-[#EDE8E2] backdrop-blur-xl border border-white/80 rounded-2xl shadow-2xl py-2 overflow-y-auto max-h-[280px]"
    >
      {/* Placeholder / clear option */}
      {placeholder && variant !== 'minimal' && (
        <div
          role="option"
          aria-selected={!currentValue}
          onClick={() => handleSelect('')}
          className={`px-5 py-3.5 text-sm cursor-pointer flex items-center justify-between transition-colors hover:bg-black/5 ${
            !currentValue
              ? 'font-medium text-[var(--foreground)] bg-black/5'
              : 'text-[var(--foreground-muted)]'
          }`}
        >
          <span>{placeholder}</span>
          {!currentValue && <span className="text-[var(--foreground)] text-xs">✓</span>}
        </div>
      )}
      {options.map(option => {
        const isSelected = option.value === currentValue
        return (
          <div
            key={option.value}
            role="option"
            aria-selected={isSelected}
            onClick={() => handleSelect(option.value)}
            className={`px-5 py-3.5 text-sm cursor-pointer flex items-center justify-between transition-colors hover:bg-black/5 ${
              isSelected
                ? 'font-medium text-[var(--foreground)] bg-black/[0.07]'
                : 'text-[var(--foreground)]'
            }`}
          >
            <span>{option.label}</span>
            {isSelected && <span className="text-[var(--foreground)] text-xs ml-3">✓</span>}
          </div>
        )
      })}
    </div>,
    document.body
  ) : null

  return (
    <div className={`relative ${variant === 'minimal' ? 'w-full' : 'w-full'} ${className}`}>
      {/* Hidden input for form submission */}
      {name && (
        <input
          type="text"
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none -z-10"
          name={name}
          value={currentValue}
          onChange={() => {}}
          required={required}
          tabIndex={-1}
        />
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => isOpen ? setIsOpen(false) : openMenu()}
        className={triggerClasses}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          style={{ width: '14px', height: '14px', flexShrink: 0 }}
          className={`transition-transform duration-200 ml-2 text-[var(--foreground-muted)] ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {menu}
    </div>
  )
}
