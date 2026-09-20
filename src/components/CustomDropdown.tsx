'use client'

import { useState, useRef, useEffect } from 'react'

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
  const [internalValue, setInternalValue] = useState<string>(controlledValue !== undefined ? controlledValue : defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Keep internal state synced if controlled
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const currentValue = controlledValue !== undefined ? controlledValue : internalValue
  const selectedOption = options.find(o => o.value === currentValue)

  const handleSelect = (val: string) => {
    setInternalValue(val)
    onChange?.(val)
    setIsOpen(false)
  }

  // Variant styles
  let triggerClasses = ''
  if (variant === 'standard') {
    triggerClasses = `w-full border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent flex items-center justify-between text-left focus:outline-none focus:border-[var(--foreground)] transition-colors cursor-pointer ${
      !selectedOption ? 'text-[var(--foreground-muted)]/50' : ''
    }`
  } else if (variant === 'minimal') {
    triggerClasses = `inline-flex items-center gap-2 border-b border-[var(--border)] text-[10px] tracking-widest uppercase py-1 text-[var(--foreground)] cursor-pointer focus:outline-none hover:border-[var(--foreground)] transition-colors`
  } else if (variant === 'filter') {
    triggerClasses = `w-full pl-4 pr-10 py-3 bg-white/60 backdrop-blur-md border border-white/80 rounded-full text-sm text-stone-800 flex items-center justify-between text-left focus:outline-none focus:ring-1 focus:ring-black/20 cursor-pointer shadow-sm`
  }

  return (
    <div ref={dropdownRef} className={`relative ${variant === 'minimal' ? 'inline-block' : 'w-full'} ${className}`}>
      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClasses}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-[var(--foreground-muted)] transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-[var(--foreground)]' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-[160px] bg-[#EDE8E2]/95 backdrop-blur-xl border border-white/80 rounded-2xl shadow-xl py-1.5 overflow-hidden max-h-60 overflow-y-auto"
        >
          {placeholder && variant !== 'minimal' && (
            <div
              role="option"
              aria-selected={!currentValue}
              onClick={() => handleSelect('')}
              className={`px-4 py-2.5 text-xs text-[var(--foreground-muted)] hover:bg-black/5 flex items-center justify-between cursor-pointer transition-colors ${
                !currentValue ? 'font-medium bg-[var(--foreground)]/5 text-[var(--foreground)]' : ''
              }`}
            >
              <span>{placeholder}</span>
              {!currentValue && <span className="text-[var(--accent-dark)] font-bold">✓</span>}
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
                className={`px-4 py-2.5 text-xs text-[var(--foreground)] hover:bg-black/5 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? 'font-medium bg-[var(--foreground)]/10' : ''
                }`}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <span className="text-[var(--accent-dark)] font-bold text-xs ml-2">✓</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
