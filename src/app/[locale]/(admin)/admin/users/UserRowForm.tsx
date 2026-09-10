'use client'

import { updateUserAccess } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useTransition } from 'react'

export default function UserRowForm({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition()

  const handleSave = async (formData: FormData) => {
    const delta = parseInt(formData.get('delta') as string, 10) || 0
    const reason = formData.get('reason') as string
    if (delta !== 0 && !reason?.trim()) {
      toast.error('Please enter a reason for the credit adjustment.')
      return
    }
    startTransition(async () => {
      try {
        await updateUserAccess(user.id, formData.get('role') as string, delta, reason)
        toast.success('User updated successfully!')
      } catch (e: any) {
        toast.error(e.message || 'Failed to update user.')
      }
    })
  }

  return (
    <form action={handleSave} className="flex items-center justify-end gap-4 m-0 p-0 leading-none flex-wrap">
      {/* Credit delta input */}
      <div className="flex items-center gap-1.5" title="Enter +N to add credits or -N to deduct">
        <input
          name="delta"
          type="number"
          defaultValue={0}
          placeholder="+0"
          className="w-14 bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[var(--foreground)] text-center text-sm py-1"
        />
        <span className="text-[9px] uppercase tracking-widest text-[var(--foreground-muted)]">Δ Cr</span>
      </div>

      {/* Reason input */}
      <input
        name="reason"
        type="text"
        placeholder="Reason…"
        className="w-28 bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[var(--foreground)] text-[11px] py-1 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
      />

      {/* Role selector */}
      <select name="role" defaultValue={user.role} className="appearance-none bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[var(--foreground)] text-[10px] tracking-widest uppercase py-1 cursor-pointer">
        <option value="CLIENT">Client</option>
        <option value="INSTRUCTOR">Instructor</option>
        <option value="ADMIN">Admin</option>
      </select>

      <button type="submit" disabled={isPending} className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-50">
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
