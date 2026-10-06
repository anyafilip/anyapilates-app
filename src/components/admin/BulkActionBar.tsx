'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface BulkActionBarProps {
  selectedIds: string[]
  onClearSelection: () => void
  actions: {
    label: string
    action: (ids: string[]) => Promise<void>
    confirmMessage?: string
    destructive?: boolean
  }[]
}

export default function BulkActionBar({ selectedIds, onClearSelection, actions }: BulkActionBarProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (selectedIds.length === 0) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-black/90 backdrop-blur-md rounded-full shadow-2xl border border-white/20 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <span className="text-white text-xs tracking-widest uppercase font-medium">
        {selectedIds.length} Selected
      </span>
      <div className="w-px h-4 bg-white/20 mx-2"></div>
      
      {actions.map((act, idx) => (
        <button
          key={idx}
          disabled={isPending}
          onClick={() => {
            if (act.confirmMessage && !window.confirm(act.confirmMessage)) return
            
            startTransition(async () => {
              try {
                await act.action(selectedIds)
                toast.success('Bulk action completed')
                onClearSelection()
                router.refresh()
              } catch (e: any) {
                toast.error(e.message || 'Action failed')
              }
            })
          }}
          className={`text-xs tracking-widest uppercase transition-colors disabled:opacity-50 ${act.destructive ? 'text-red-400 hover:text-red-300' : 'text-white hover:text-white/70'}`}
        >
          {act.label}
        </button>
      ))}

      <button 
        onClick={onClearSelection}
        className="ml-4 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 hover:text-white transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  )
}
