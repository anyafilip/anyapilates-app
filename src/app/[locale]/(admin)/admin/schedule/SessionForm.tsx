'use client'

import { useRef, useState } from 'react'
import { createSession, createRecurringClass } from '@/app/actions/templates'
import { updateSession } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useRouter } from '@/i18n/routing'
import CustomDropdown from '@/components/CustomDropdown'

export default function SessionForm({
  classTypes,
  instructors,
  initialData,
}: {
  classTypes: any[]
  instructors: any[]
  initialData?: any
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>(initialData?.instructorId ?? '')
  const [repeat, setRepeat] = useState(false)

  async function handleAction(formData: FormData) {
    try {
      if (initialData) {
        await updateSession(formData)
        toast.success('Session updated!')
        router.push('/admin/schedule')
      } else if (repeat) {
        await createRecurringClass(formData)
        toast.success('Recurring class created — next 8 weeks scheduled!')
        formRef.current?.reset()
        setRepeat(false)
      } else {
        await createSession(formData)
        toast.success('Session added!')
        formRef.current?.reset()
      }
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong.')
    }
  }

  let dateStr = ''
  if (initialData?.date) {
    const d = new Date(initialData.date)
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - offset * 60 * 1000)
    dateStr = local.toISOString().split('T')[0]
  }

  return (
    <form ref={formRef} action={handleAction} className="space-y-6">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      {/* Row 1: Class Name + Class type + Instructor */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">
            Class Name (Optional)
          </label>
          <input
            name="name"
            type="text"
            placeholder="e.g. Body Lean"
            defaultValue={initialData?.name || ''}
            className="w-full border-b border-[var(--border)] px-3 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">
            Class Type *
          </label>
          <CustomDropdown
            name="classTypeId"
            defaultValue={initialData?.classTypeId || ''}
            required
            placeholder="Select class type..."
            options={classTypes.map(ct => ({ value: ct.id, label: ct.name }))}
          />
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">
            Instructor
          </label>
          <CustomDropdown
            name="instructorId"
            defaultValue={initialData?.instructorId || ''}
            placeholder="Unassigned"
            options={instructors.map(i => ({ value: i.id, label: i.name }))}
            onChange={(val) => setSelectedInstructorId(val)}
          />
          {/* Reactive availability note for the selected instructor only */}
          {(() => {
            const note = instructors.find(i => i.id === selectedInstructorId)?.availabilityNotes
            if (!note) return null
            return (
              <div className="mt-3 bg-white/40 border border-white/60 rounded-xl px-4 py-3">
                <p className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-1">Availability Note</p>
                <p className="text-xs font-light text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{note}</p>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Row 2: Day/Date + Start + End + Duration + Capacity */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
        <div className="col-span-2 sm:col-span-1">
          {repeat ? (
            <>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">
                Day *
              </label>
              <CustomDropdown
                name="dayOfWeek"
                required
                placeholder="Pick a day..."
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
            </>
          ) : (
            <>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">
                Date *
              </label>
              <input
                name="date"
                type="date"
                required
                defaultValue={dateStr}
                className="w-full border-b border-[var(--border)] px-3 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors"
              />
            </>
          )}
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">
            Start *
          </label>
          <input
            name="startTime"
            type="time"
            required
            defaultValue={initialData?.startTime || '09:00'}
            className="w-full border-b border-[var(--border)] px-3 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">
            End *
          </label>
          <input
            name="endTime"
            type="time"
            required
            defaultValue={initialData?.endTime || '09:50'}
            className="w-full border-b border-[var(--border)] px-3 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">
            Duration (min)
          </label>
          <input
            name="duration"
            type="number"
            min={15}
            defaultValue={initialData?.duration || 50}
            className="w-full border-b border-[var(--border)] px-3 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">
            Capacity *
          </label>
          <input
            name="capacity"
            type="number"
            required
            min={1}
            max={20}
            defaultValue={initialData?.capacity || 3}
            className="w-full border-b border-[var(--border)] px-3 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors"
          />
        </div>
      </div>

      {/* Row 3: Repeat toggle (only for new sessions, not edits) + submit */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-black/5">
        {!initialData ? (
          <label className="flex items-center gap-3 cursor-pointer group select-none">
            <div
              onClick={() => setRepeat(r => !r)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                repeat ? 'bg-[var(--foreground)]' : 'bg-black/15'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  repeat ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-sm font-light text-[var(--foreground)]">
              Repeat weekly
            </span>
          </label>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-4">
          {initialData && (
            <button
              type="button"
              onClick={() => router.push('/admin/schedule')}
              className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="bg-[var(--foreground)] text-[var(--background)] px-8 py-3.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm cursor-pointer"
          >
            {initialData ? 'Save Changes' : repeat ? 'Create Recurring Class' : 'Add Session'}
          </button>
        </div>
      </div>
    </form>
  )
}
