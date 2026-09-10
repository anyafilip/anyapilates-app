'use client'

import { useRef } from 'react'
import { createPackage, updatePackage } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function PackageForm({ initialData }: { initialData?: any }) {
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleAction(formData: FormData) {
    try {
      if (initialData) {
        await updatePackage(formData)
        toast.success('Package updated successfully!')
        router.push('/en/admin/packages')
      } else {
        await createPackage(formData)
        toast.success('Package added successfully!')
        formRef.current?.reset()
      }
    } catch (e) {
      toast.error(initialData ? 'Failed to update package.' : 'Failed to add package.')
    }
  }
  
  return (
    <form ref={formRef} action={handleAction} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      <div className="md:col-span-1">
        <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">Package Name *</label>
        <input name="name" defaultValue={initialData?.name} required placeholder="Starter Pack" className="w-full border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors placeholder:text-[var(--foreground-muted)]/50" />
      </div>
      
      <div className="md:col-span-1">
        <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">Credits Included *</label>
        <input name="credits" defaultValue={initialData?.credits} type="number" min="1" required className="w-full border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors" />
      </div>

      <div className="md:col-span-1">
        <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">Price (THB) *</label>
        <input name="price" defaultValue={initialData ? initialData.price / 100 : ''} placeholder="500" type="number" min="0" step="0.01" required className="w-full border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors placeholder:text-[var(--foreground-muted)]/50" />
      </div>

      <div className="md:col-span-1 pb-1 flex flex-col gap-3">
        {initialData && (
          <div className="flex items-center gap-3 mb-2 px-2">
            <input type="checkbox" name="isActive" id="isActive" defaultChecked={initialData.isActive} className="accent-[var(--foreground)]" />
            <label htmlFor="isActive" className="text-[10px] tracking-widest uppercase text-[var(--foreground)] cursor-pointer">Active Package</label>
          </div>
        )}
        <button type="submit" className="w-full bg-[var(--foreground)] text-[var(--background)] py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm cursor-pointer">
          {initialData ? 'Save Changes' : 'Add Package'}
        </button>
        {initialData && (
          <button type="button" onClick={() => router.push('/en/admin/packages')} className="w-full text-[10px] tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] uppercase py-2 cursor-pointer transition-colors">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
