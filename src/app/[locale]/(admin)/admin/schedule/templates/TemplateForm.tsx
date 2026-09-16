'use client'

import { useState, useTransition } from 'react'
import { createTemplate } from '@/app/actions/templates'
import toast from 'react-hot-toast'

interface Props {
  classTypes: any[]
  instructors: any[]
}

export default function TemplateForm({ classTypes, instructors }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    const data = {
      classTypeId: fd.get('classTypeId') as string,
      instructorId: fd.get('instructorId') as string,
      dayOfWeek: parseInt(fd.get('dayOfWeek') as string),
      startTime: fd.get('startTime') as string,
      endTime: fd.get('endTime') as string,
      duration: parseInt(fd.get('duration') as string),
      capacity: parseInt(fd.get('capacity') as string)
    }

    startTransition(async () => {
      try {
        await createTemplate(data)
        toast.success('Template created')
        form.reset()
      } catch (e: any) {
        toast.error(e.message || 'Error creating template')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Day of Week</label>
        <select name="dayOfWeek" required className="studio-input w-full">
          <option value="1">Monday</option>
          <option value="2">Tuesday</option>
          <option value="3">Wednesday</option>
          <option value="4">Thursday</option>
          <option value="5">Friday</option>
          <option value="6">Saturday</option>
          <option value="0">Sunday</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Class Type</label>
        <select name="classTypeId" required className="studio-input w-full">
          {classTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Instructor</label>
        <select name="instructorId" className="studio-input w-full">
          <option value="">-- None --</option>
          {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Start Time</label>
          <input type="time" name="startTime" required className="studio-input w-full" defaultValue="09:00" />
        </div>
        <div>
          <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">End Time</label>
          <input type="time" name="endTime" required className="studio-input w-full" defaultValue="10:00" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Duration (mins)</label>
          <input type="number" name="duration" required min="1" className="studio-input w-full" defaultValue="60" />
        </div>
        <div>
          <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Capacity</label>
          <input type="number" name="capacity" required min="1" className="studio-input w-full" defaultValue="3" />
        </div>
      </div>

      <button type="submit" disabled={isPending} className="btn-primary w-full mt-4">
        {isPending ? 'Creating...' : 'Create Template'}
      </button>
    </form>
  )
}

