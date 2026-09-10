'use client'

import { useRef, useEffect } from 'react'
import { createSession, updateSession } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function SessionForm({ classTypes, instructors, initialData }: { classTypes: any[], instructors: any[], initialData?: any }) {
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (initialData && formRef.current) {
      formRef.current.reset() // clear form so defaultValues apply cleanly, though react manages this slightly differently. We rely on key change or default values.
    }
  }, [initialData])

  async function handleAction(formData: FormData) {
    try {
      if (initialData) {
        await updateSession(formData)
        toast.success('Session updated successfully!')
        router.push('/en/admin/schedule')
      } else {
        await createSession(formData)
        toast.success('Session added successfully!')
        formRef.current?.reset()
      }
    } catch (e) {
      toast.error(initialData ? 'Failed to update session.' : 'Failed to add session.')
    }
  }

  // Format date for input type="date" (YYYY-MM-DD)
  let dateStr = ''
  if (initialData?.date) {
    const d = new Date(initialData.date)
    dateStr = d.toISOString().split('T')[0]
  }

  return (
    <div className="relative">
      <form ref={formRef} action={handleAction} className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
        {initialData && <input type="hidden" name="id" value={initialData.id} />}
        
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">Class Type</label>
          <select name="classTypeId" defaultValue={initialData?.classTypeId || ''} className="w-full appearance-none border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors cursor-pointer">
            <option value="">— Select —</option>
            {classTypes.map(ct => (
              <option key={ct.id} value={ct.id}>{ct.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">Date *</label>
          <input name="date" type="date" required defaultValue={dateStr} className="w-full border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors" />
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">Start *</label>
          <input name="startTime" type="time" required defaultValue={initialData?.startTime || '09:00'} className="w-full border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors" />
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">End *</label>
          <input name="endTime" type="time" required defaultValue={initialData?.endTime || '10:00'} className="w-full border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors" />
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">Capacity *</label>
          <input name="capacity" type="number" required min={1} max={20} defaultValue={initialData?.capacity || 6} className="w-full border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors" />
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">Duration (min)</label>
          <input name="duration" type="number" min={15} defaultValue={initialData?.duration || 60} className="w-full border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors" />
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">Instructor</label>
          <select name="instructorId" defaultValue={initialData?.instructorId || ''} className="w-full appearance-none border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors cursor-pointer">
            <option value="">— Unassigned —</option>
            {instructors.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 md:col-span-1 pb-1 flex flex-col gap-3">
          <button type="submit" className="w-full bg-[var(--foreground)] text-[var(--background)] py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm">
            {initialData ? 'Save Changes' : 'Add Session'}
          </button>
          {initialData && (
            <button type="button" onClick={() => router.push('/en/admin/schedule')} className="w-full text-[10px] tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] uppercase py-2 cursor-pointer transition-colors">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
