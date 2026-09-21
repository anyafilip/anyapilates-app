'use client'

import { updateUserAccess } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useTransition, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CustomDropdown from '@/components/CustomDropdown'

const roleOptions = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'INSTRUCTOR', label: 'Instructor' },
  { value: 'ADMIN', label: 'Admin' },
]

export default function UserRolePicker({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState(user.role)
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  useEffect(() => { setSelected(user.role) }, [user.role])

  const isDirty = selected !== user.role

  const handleSave = () => {
    if (!isDirty) return
    if (selected === 'ADMIN') {
      setConfirming(true)
      return
    }
    save(selected)
  }

  const save = (role: string) => {
    setConfirming(false)
    startTransition(async () => {
      try {
        await updateUserAccess(user.id, role)
        toast.success('Role updated.')
        router.refresh()
      } catch (e: any) {
        toast.error(e.message || 'Failed to update role.')
        setSelected(user.role)
      }
    })
  }

  const handleCancel = () => {
    setSelected(user.role)
    setConfirming(false)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Fixed-width dropdown wrapper so table layout never shifts */}
      <div className="w-[130px] shrink-0">
        <CustomDropdown
          value={selected}
          onChange={(v) => { setSelected(v); setConfirming(false) }}
          options={roleOptions}
          variant="minimal"
        />
      </div>

      {/* Save / Confirm / Cancel */}
      {confirming ? (
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-red-700 tracking-wide">Grant admin?</span>
          <button
            onClick={() => save(selected)}
            disabled={isPending}
            className="text-[10px] tracking-[0.2em] uppercase text-red-700 hover:text-red-900 transition-colors cursor-pointer disabled:opacity-40"
          >
            Confirm
          </button>
          <button
            onClick={handleCancel}
            className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : isDirty ? (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground)] hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-40"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  )
}
