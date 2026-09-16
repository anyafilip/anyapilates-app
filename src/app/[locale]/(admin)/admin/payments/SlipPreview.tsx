'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function SlipPreview({ url }: { url: string }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!url) return <span className="text-[var(--foreground-muted)]">—</span>

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-block hover:opacity-80 transition-opacity"
      >
        <img src={url} alt="Slip" className="w-12 h-12 object-cover rounded-lg border border-black/5" />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 animate-modal-overlay"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full flex justify-center">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm tracking-widest uppercase"
            >
              Close ✕
            </button>
            <img 
              src={url} 
              alt="Payment Slip Full" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
            />
          </div>
        </div>
      )}
    </>
  )
}
