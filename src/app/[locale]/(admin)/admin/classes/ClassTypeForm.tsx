'use client'

import { useState, useRef, useEffect } from 'react'
import { createClassType, updateClassType } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function ClassTypeForm({ initialData }: { initialData?: any }) {
  const [preview, setPreview] = useState<string | null>(initialData?.imageUrl || null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (initialData) {
      setPreview(initialData.imageUrl || null)
    }
  }, [initialData])

  async function handleAction(formData: FormData) {
    try {
      if (initialData) {
        await updateClassType(formData)
        toast.success('Class type updated successfully!')
        router.push('/en/admin/classes')
      } else {
        await createClassType(formData)
        toast.success('Class type added successfully!')
        setPreview(null)
        formRef.current?.reset()
      }
    } catch (e) {
      toast.error(initialData ? 'Failed to update class type.' : 'Failed to add class type.')
    }
  }
  
  return (
    <form ref={formRef} action={handleAction} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end relative">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      {/* Image Upload */}
      <div className="md:col-span-1 flex justify-center">
        <label className="relative cursor-pointer group flex-shrink-0">
          <div className="w-24 h-32 bg-white/40 border border-white flex items-center justify-center overflow-hidden shadow-sm transition-transform group-hover:scale-[1.02]">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[9px] tracking-widest text-[var(--foreground-muted)] uppercase">Upload</span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[var(--foreground)] text-[var(--background)] p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <input 
            type="file" 
            name="imageFile"
            accept="image/*"
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setPreview(URL.createObjectURL(file))
            }}
          />
        </label>
      </div>

      <div className="md:col-span-1">
        <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">Name *</label>
        <input name="name" defaultValue={initialData?.name} required placeholder="Group Reformer" className="w-full border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors placeholder:text-[var(--foreground-muted)]/50" />
      </div>
      
      <div className="md:col-span-1">
        <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">Description</label>
        <input name="description" defaultValue={initialData?.description} placeholder="Description..." className="w-full border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors placeholder:text-[var(--foreground-muted)]/50" />
      </div>

      <div className="md:col-span-1">
        <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3 pl-2">Credits</label>
        <input name="creditCost" defaultValue={initialData?.creditCost ?? 1} type="number" min="0" required className="w-full border-b border-[var(--border)] px-4 py-3 text-sm font-light text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors" />
      </div>

      <div className="md:col-span-1 pb-1 flex flex-col gap-3">
        <button type="submit" className="w-full bg-[var(--foreground)] text-[var(--background)] py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm">
          {initialData ? 'Save Changes' : 'Add Type'}
        </button>
        {initialData && (
          <button type="button" onClick={() => router.push('/en/admin/classes')} className="w-full text-[10px] tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] uppercase py-2 cursor-pointer transition-colors">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
