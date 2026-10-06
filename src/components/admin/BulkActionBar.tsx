'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Modal from '@/components/Modal'

interface BulkAction {
  label: string
  action: (ids: string[]) => Promise<void>
  confirmMessage?: string
  destructive?: boolean
}

interface BulkActionBarProps {
  selectedIds: string[]
  onClearSelection: () => void
  actions: BulkAction[]
}

export default function BulkActionBar({ selectedIds, onClearSelection, actions }: BulkActionBarProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [confirmingAction, setConfirmingAction] = useState<BulkAction | null>(null)

  if (selectedIds.length === 0) return null

  const executeAction = (act: BulkAction) => {
    startTransition(async () => {
      try {
        await act.action(selectedIds)
        toast.success('Bulk action completed')
        onClearSelection()
        setConfirmingAction(null)
        router.refresh()
      } catch (e: any) {
        toast.error(e.message || 'Action failed')
        setConfirmingAction(null)
      }
    })
  }

  return (
    <>
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
              if (act.confirmMessage) {
                setConfirmingAction(act)
              } else {
                executeAction(act)
              }
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

      {confirmingAction && (
        <Modal title="Confirm Action" onClose={() => setConfirmingAction(null)} maxWidth="max-w-md">
          <div className="text-center pt-4 pb-2 px-4">
            <p className="text-[var(--foreground)] font-light text-lg mb-10">
              {confirmingAction.confirmMessage}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => setConfirmingAction(null)} 
                disabled={isPending}
                className="btn-ghost text-xs px-6 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(confirmingAction)}
                disabled={isPending}
                className={`btn-primary text-xs px-6 py-2 disabled:opacity-50 ${
                  confirmingAction.destructive 
                    ? '!bg-red-800 hover:!bg-red-900 border !border-red-800' 
                    : ''
                }`}
              >
                {isPending ? 'Processing...' : confirmingAction.label}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
