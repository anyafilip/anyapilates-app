'use client'

import { useState, useTransition } from 'react'
import { generateScheduleFromTemplates } from '@/app/actions/templates'
import toast from 'react-hot-toast'

export default function TemplateGenerator() {
  const [isPending, startTransition] = useTransition()
  
  return (
    <button 
      disabled={isPending}
      onClick={() => {
        if (!confirm('This will generate classes for the next 4 weeks based on your active templates. Proceed?')) return
        startTransition(async () => {
          try {
            const count = await generateScheduleFromTemplates(4)
            toast.success(`Generated ${count} new classes!`)
          } catch (e: any) {
            toast.error(e.message || 'Generation failed')
          }
        })
      }}
      className="bg-[var(--foreground)] text-[var(--background)] px-6 py-3 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm disabled:opacity-50"
    >
      {isPending ? 'Generating...' : 'Generate 4 Weeks'}
    </button>
  )
}
