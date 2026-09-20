'use client'

import { updateUserAccess } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useTransition, useRef } from 'react'

export default function UserRowForm({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSave = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateUserAccess(user.id, formData.get('role') as string)
        toast.success('User updated successfully!')
        formRef.current?.reset()
      } catch (e: any) {
        toast.error(e.message || 'Failed to update user.')
      }
    })
  }

  return (
    <div className="flex items-center justify-end gap-6 flex-wrap leading-none">
      <form ref={formRef} action={handleSave} className="flex items-center gap-4 m-0 p-0">
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

