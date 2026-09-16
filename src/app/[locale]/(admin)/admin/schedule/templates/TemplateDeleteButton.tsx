'use client'

import { useTransition } from 'react'
import { deleteTemplate } from '@/app/actions/templates'
import toast from 'react-hot-toast'

export default function TemplateDeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  
  return (
    <button
      onClick={() => {
        if (!confirm('Delete this template?')) return
        startTransition(async () => {
          try {
            await deleteTemplate(id)
            toast.success('Template deleted')
          } catch (e: any) {
            toast.error(e.message)
          }
        })
      }}
      disabled={isPending}
      className="text-[10px] tracking-widest uppercase text-red-500/70 hover:text-red-700 transition-colors disabled:opacity-50"
    >
      {isPending ? '...' : 'Remove'}
    </button>
  )
}
