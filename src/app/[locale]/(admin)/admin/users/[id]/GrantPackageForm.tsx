'use client'

import { useState, useTransition } from 'react'
import { manuallyGrantPackage } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function GrantPackageForm({ userId, packages }: { userId: string, packages: any[] }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleGrant = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const packageId = formData.get('packageId') as string
    if (!packageId) return

    startTransition(async () => {
      try {
        await manuallyGrantPackage(userId, packageId)
        toast.success('Package granted successfully.')
        router.refresh()
      } catch (e: any) {
        toast.error(e.message || 'Failed to grant package.')
      }
    })
  }

  return (
    <form onSubmit={handleGrant} className="flex flex-col gap-6">
      <div>
        <label className="block text-[10px] tracking-[0.2em] uppercase text-white/50 mb-3">Select Package</label>
        <select 
          name="packageId" 
          required 
          className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/50 appearance-none"
        >
          <option value="" className="text-black">-- Choose a Package --</option>
          {packages.map(pkg => (
            <option key={pkg.id} value={pkg.id} className="text-black">
              {pkg.name} ({pkg.classCount} credits)
            </option>
          ))}
        </select>
      </div>
      
      <button 
        type="submit" 
        disabled={isPending}
        className="bg-white text-black px-6 py-3 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Granting...' : 'Grant Package'}
      </button>
    </form>
  )
}
