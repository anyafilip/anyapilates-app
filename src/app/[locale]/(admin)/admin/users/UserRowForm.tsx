'use client'

import { updateUserAccess } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useTransition, useRef } from 'react'

export default function UserRowForm({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

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
        formRef.current?.reset()
      } catch (e: any) {
        toast.error(e.message || 'Failed to update user.')
      }
    })
  }

  return (
    <div className="flex items-center justify-end gap-6 flex-wrap leading-none">
      <div className="flex items-center gap-3 pr-4 border-r border-black/5">
        <span className="text-sm text-[var(--foreground)]">{user.credits} <span className="text-[9px] uppercase tracking-widest text-[var(--foreground-muted)]">Cr</span></span>
        <Link href={`/en/admin/users?historyId=${user.id}`} scroll={false} className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors underline decoration-black/10 underline-offset-4">
          History
        </Link>
      </div>

      <form ref={formRef} action={handleSave} className="flex items-center gap-4 m-0 p-0">
        <div className="flex items-center gap-1.5" title="Enter +N to add credits or -N to deduct">
          <input
            name="delta"
            type="number"
            defaultValue={0}
            placeholder="+0"
            className="w-12 bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[var(--foreground)] text-center text-sm py-1"
          />
          <span className="text-[9px] uppercase tracking-widest text-[var(--foreground-muted)]">Δ Cr</span>
        </div>

        <input
          name="reason"
          type="text"
          placeholder="Reason…"
          className="w-24 bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[var(--foreground)] text-[11px] py-1 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
        />

        <select name="role" defaultValue={user.role} className="appearance-none bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[var(--foreground)] text-[10px] tracking-widest uppercase py-1 cursor-pointer">
          <option value="CLIENT">Client</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="ADMIN">Admin</option>
        </select>

        <button type="submit" disabled={isPending} className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-50">
          {isPending ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
}

