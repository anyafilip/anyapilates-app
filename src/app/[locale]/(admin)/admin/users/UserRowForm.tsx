'use client'

import { updateUserAccess } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useTransition, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CustomDropdown from '@/components/CustomDropdown'

export default function UserRowForm({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState(user.role)
  const router = useRouter()

  useEffect(() => {
    setRole(user.role)
  }, [user.role])

  const roleOptions = [
    { value: 'CLIENT', label: 'Client' },
    { value: 'INSTRUCTOR', label: 'Instructor' },
    { value: 'ADMIN', label: 'Admin' },
  ]

  const handleSave = async (formData: FormData) => {
    const newRole = (formData.get('role') as string) || role
    startTransition(async () => {
      try {
        await updateUserAccess(user.id, newRole)
        setRole(newRole)
        toast.success('User updated successfully!')
        router.refresh()
      } catch (e: any) {
        toast.error(e.message || 'Failed to update user.')
        setRole(user.role) // Revert on failure
      }
    })
  }

  return (
    <div className="flex items-center justify-end gap-6 flex-wrap leading-none">
      <form action={handleSave} className="flex items-center gap-4 m-0 p-0">
        <CustomDropdown
          name="role"
          value={role}
          onChange={setRole}
          options={roleOptions}
          variant="minimal"
        />

        <button
          type="submit"
          disabled={isPending}
          className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
}
