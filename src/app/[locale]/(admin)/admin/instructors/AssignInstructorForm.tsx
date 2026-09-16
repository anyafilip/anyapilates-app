'use client'

import { useState, useTransition } from 'react'
import { assignInstructorRole } from '@/app/actions/instructors'

export default function AssignInstructorForm() {
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    startTransition(async () => {
      try {
        await assignInstructorRole(email)
        setEmail('')
        alert('Instructor role assigned successfully.')
      } catch (err: any) {
        alert(err.message || 'Failed to assign role.')
      }
    })
  }

  return (
    <form onSubmit={handleAssign} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 flex gap-4 items-end">
      <div className="flex-1">
        <label className="block text-sm text-stone-600 mb-2 font-sans">User Email</label>
        <input 
          type="email" 
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full rounded-xl bg-white/50 border border-white p-3 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 font-sans"
        />
      </div>
      <button 
        type="submit" 
        disabled={isPending}
        className="px-6 py-3 bg-stone-800 text-white rounded-xl text-sm font-sans hover:bg-stone-700 transition disabled:opacity-50 h-[46px]"
      >
        {isPending ? 'Assigning...' : 'Assign Role'}
      </button>
    </form>
  )
}
