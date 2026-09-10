'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ModalProps {
  title: string
  children: React.ReactNode
  onCloseUrl: string
}

export default function Modal({ title, children, onCloseUrl }: ModalProps) {
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(onCloseUrl)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, onCloseUrl])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      router.push(onCloseUrl)
    }
  }

  return (
    <div 
      ref={overlayRef} 
      onClick={handleOverlayClick} 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/30 animate-modal-overlay"
    >
      <div className="relative w-full max-w-5xl bg-[var(--surface)]/90 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-[2.5rem] overflow-hidden animate-modal-content flex flex-col max-h-[90vh]">
        
        {/* Subtle gradient blob for premium feel */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 md:px-12 py-6 md:py-8 border-b border-black/5 bg-white/40 shrink-0 relative z-10">
          <h2 className="text-2xl md:text-3xl font-serif text-[var(--foreground)]">{title}</h2>
          <button 
            onClick={() => router.push(onCloseUrl)} 
            className="p-3 -mr-3 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors rounded-full hover:bg-black/5 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-8 md:p-12 overflow-y-auto overflow-x-hidden no-scrollbar relative z-10">
          {children}
        </div>

      </div>
    </div>
  )
}
