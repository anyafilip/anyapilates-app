'use client'

import { updateUserAccess } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomDropdown from '@/components/CustomDropdown'
import Modal from '@/components/Modal'

const roleOptions = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'INSTRUCTOR', label: 'Instructor' },
  { value: 'ADMIN', label: 'Admin' },
]

export default function UserRow({ user, isCurrentUser }: { user: any, isCurrentUser: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [selectedRole, setSelectedRole] = useState(user.role)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const isDirty = selectedRole !== user.role

  const handleSave = () => {
    if (!isDirty) return
    setShowConfirm(true)
  }

  const save = (role: string) => {
    setShowConfirm(false)
    startTransition(async () => {
      try {
        await updateUserAccess(user.id, role)
        toast.success('Role updated successfully.')
        router.refresh()
      } catch (e: any) {
        toast.error(e.message || 'Failed to update role.')
        setSelectedRole(user.role)
      }
    })
  }

  const handleCancel = () => {
    setSelectedRole(user.role)
    setShowConfirm(false)
  }
  
  const roleLabel = roleOptions.find(r => r.value === selectedRole)?.label || selectedRole

  return (
    <>
      <tr className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
        <td className="py-4 pl-8">
          <p className="font-medium text-[var(--foreground)]">{user.name}</p>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{user.email}</p>
        </td>
        <td className="py-4 text-[13px] text-[var(--foreground-muted)]">
          {user.phone || '—'}
        </td>
        <td className="py-4">
          {isCurrentUser ? (
            <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--foreground-muted)]/50">{user.role}</span>
          ) : (
            <div className="w-full max-w-[140px]">
              <CustomDropdown
                value={selectedRole}
                onChange={setSelectedRole}
                options={roleOptions}
                variant="standard"
              />
            </div>
          )}
        </td>
        <td className="py-4 pr-8 text-right">
          {isCurrentUser ? (
            <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]/40">You</span>
          ) : isDirty ? (
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={handleCancel}
                className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground)] hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-40"
              >
                {isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]/30">Up to date</span>
          )}
        </td>
      </tr>

      {showConfirm && (
        <Modal title="Confirm Role Change" onClose={() => setShowConfirm(false)} maxWidth="max-w-xl">
          <div className="text-center pt-4 pb-2">
            <p className="text-[var(--foreground)] font-light text-lg mb-8">
              Change role to <span className="font-medium">{roleLabel}</span> for <span className="font-medium">&ldquo;{user.name}&rdquo;</span>?
              {selectedRole === 'ADMIN' && (
                <>
                  <br /><br />
                  <span className="text-sm text-red-600 font-medium">Warning: They will have full access to manage classes, packages, and other users.</span>
                </>
              )}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setShowConfirm(false)} className="btn-ghost cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => save(selectedRole)}
                className="btn-primary !bg-[var(--foreground)] hover:!bg-black cursor-pointer"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
