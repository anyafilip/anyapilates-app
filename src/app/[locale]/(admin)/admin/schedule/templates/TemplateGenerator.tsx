
'use client'

import { useState, useTransition } from 'react'
import { generateScheduleFromTemplates } from '@/app/actions/templates'
import toast from 'react-hot-toast'
import Modal from '@/components/Modal'

export default function TemplateGenerator() {
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  
  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const count = await generateScheduleFromTemplates(4)
        toast.success(`Generated ${count} new classes!`)
        setShowModal(false)
      } catch (e: any) {
        toast.error(e.message || 'Generation failed')
      }
    })
  }

  return (
    <>
      <button 
        disabled={isPending}
        onClick={() => setShowModal(true)}
        className="bg-[var(--foreground)] text-[var(--background)] px-6 py-3 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm disabled:opacity-50"
      >
        {isPending ? 'Generating...' : 'Generate 4 Weeks'}
      </button>

      {showModal && (
        <Modal title="Generate Schedule" onClose={() => setShowModal(false)} maxWidth="max-w-md">
          <p className="text-[var(--foreground)] mb-6 text-sm">
            Generate classes for the next 4 weeks?
          </p>
          <p className="text-[var(--foreground-muted)] mb-8 text-sm">
            This will scan your active templates and automatically create any missing classes up to 4 weeks ahead. Existing classes will not be affected.
          </p>
          <div className="flex gap-4 justify-end">
            <button 
              onClick={() => setShowModal(false)}
              className="px-6 py-2 rounded-full text-xs uppercase tracking-widest text-[var(--foreground-muted)] hover:bg-black/5"
            >
              Cancel
            </button>
            <button 
              onClick={handleGenerate}
              disabled={isPending}
              className="px-6 py-2 rounded-full text-xs uppercase tracking-widest bg-[var(--foreground)] text-[var(--background)] hover:bg-black disabled:opacity-50"
            >
              {isPending ? 'Generating...' : 'Confirm'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
