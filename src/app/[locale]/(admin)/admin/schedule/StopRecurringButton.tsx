
'use client'

import { useTransition, useState } from 'react'
import { stopRecurringClass } from '@/app/actions/templates'
import toast from 'react-hot-toast'
import Modal from '@/components/Modal'

export default function StopRecurringButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)

  const handleStop = () => {
    startTransition(async () => {
      try {
        await stopRecurringClass(id)
        toast.success('Recurring class stopped.')
        setShowModal(false)
      } catch (e: any) {
        toast.error(e?.message || 'Failed to stop.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-red-700 transition-colors disabled:opacity-40 cursor-pointer"
      >
        {isPending ? '...' : 'Stop'}
      </button>

      {showModal && (
        <Modal title="Stop Recurring Class" onClose={() => setShowModal(false)} maxWidth="max-w-md">
          <p className="text-[var(--foreground)] mb-6 text-sm">
            Are you sure you want to stop this recurring class? 
          </p>
          <p className="text-[var(--foreground-muted)] mb-8 text-sm">
            This will stop generating new classes, and will immediately <strong>delete all future classes</strong> that have zero bookings. Classes that already have bookings will be kept.
          </p>
          <div className="flex gap-4 justify-end">
            <button 
              onClick={() => setShowModal(false)}
              className="px-6 py-2 rounded-full text-xs uppercase tracking-widest text-[var(--foreground-muted)] hover:bg-black/5"
            >
              Cancel
            </button>
            <button 
              onClick={handleStop}
              disabled={isPending}
              className="px-6 py-2 rounded-full text-xs uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Stopping...' : 'Stop Class'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
