'use client'

import { useTransition } from 'react'
import { stopRecurringClass } from '@/app/actions/templates'
import toast from 'react-hot-toast'

export default function StopRecurringButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        if (!confirm('Stop this recurring class? Existing scheduled sessions will remain, but no new ones will be generated.')) return
        startTransition(async () => {
          try {
            await stopRecurringClass(id)
            toast.success('Recurring class stopped.')
          } catch (e: any) {
            toast.error(e?.message || 'Failed to stop.')
          }
        })
      }}
      disabled={isPending}
      className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-red-700 transition-colors disabled:opacity-40 cursor-pointer"
    >
      {isPending ? '...' : 'Stop'}
    </button>
  )
}
