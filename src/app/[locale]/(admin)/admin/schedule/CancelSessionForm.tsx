'use client'

import { useTransition } from 'react'
import { cancelSession } from '@/app/actions/admin'
import { useRouter } from '@/i18n/routing'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function CancelSessionForm({ sessionId }: { sessionId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await cancelSession(sessionId)
        toast.success('Session cancelled and clients notified.')
        router.push('/admin/schedule')
      } catch (e: any) {
        toast.error(e.message || 'Failed to cancel session.')
      }
    })
  }

  return (
    <form onSubmit={handleCancel} className="flex items-center justify-center gap-4">
      <button 
        type="button" 
        onClick={() => router.push('/admin/schedule')}
        className="btn-ghost text-xs px-6 py-2"
        disabled={isPending}
      >
        Close
      </button>
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary !bg-red-800 hover:!bg-red-900 border !border-red-800 text-xs px-6 py-2 disabled:opacity-50"
      >
        {isPending ? 'Cancelling...' : 'Confirm Cancel'}
      </button>
    </form>
  )
}
