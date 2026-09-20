'use client'

import { useState, useTransition } from 'react'
import { createTemplate } from '@/app/actions/templates'
import toast from 'react-hot-toast'
import CustomDropdown from '@/components/CustomDropdown'

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
        <CustomDropdown
          name="dayOfWeek"
          required
          defaultValue="1"
          options={[
            { value: '1', label: 'Monday' },
            { value: '2', label: 'Tuesday' },
            { value: '3', label: 'Wednesday' },
            { value: '4', label: 'Thursday' },
            { value: '5', label: 'Friday' },
            { value: '6', label: 'Saturday' },
            { value: '0', label: 'Sunday' },
          ]}
        />
      </div>

      <div>
        <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Class Type</label>
        <CustomDropdown
          name="classTypeId"
          required
          placeholder="Select a class type..."
          defaultValue={classTypes[0]?.id || ''}
          options={classTypes.map(ct => ({ value: ct.id, label: ct.name }))}
        />
      </div>

      <div>
        <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Instructor</label>
        <CustomDropdown
          name="instructorId"
          placeholder="-- None --"
          defaultValue=""
          options={instructors.map(i => ({ value: i.id, label: i.name }))}
        />
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

