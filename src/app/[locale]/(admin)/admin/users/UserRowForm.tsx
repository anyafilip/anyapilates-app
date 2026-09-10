'use client'

import { updateUserAccess } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useTransition } from 'react'

export default function UserRowForm({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition()

  const handleSave = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateUserAccess(user.id, formData.get('role') as string, parseInt(formData.get('credits') as string, 10))
        toast.success('User updated successfully!')
      } catch (e: any) {
        toast.error(e.message || 'Failed to update user.')
      }
    })
  }

  return (
    <form action={handleSave} className="flex items-center justify-end gap-6 m-0 p-0 leading-none">
      <div className="flex items-center gap-2">
        <input name="credits" type="number" min="0" defaultValue={user.credits} className="w-16 bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[var(--foreground)] text-center text-sm py-1" />
        <span className="text-[9px] uppercase tracking-widest text-[var(--foreground-muted)]">Cr</span>
      </div>

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
