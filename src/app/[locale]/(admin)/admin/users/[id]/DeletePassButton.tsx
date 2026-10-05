'use client'

import { useTransition } from 'react'
import { deleteUserPass } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function DeletePassButton({ passId }: { passId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this pass? This action cannot be undone.')) return
    
    startTransition(async () => {
      try {
        await deleteUserPass(passId)
        toast.success('Pass deleted successfully.')
        router.refresh()
      } catch (e: any) {
        toast.error(e.message || 'Failed to delete pass.')
      }
    })
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="ml-4 text-[10px] tracking-widest uppercase text-red-800/60 hover:text-red-800 transition-colors disabled:opacity-50 shrink-0"
    >
      {isPending ? '...' : 'Delete'}
    </button>
  )
}
