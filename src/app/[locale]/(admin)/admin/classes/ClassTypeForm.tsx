'use client'

import { useState, useRef, useEffect } from 'react'
import { createClassType, updateClassType } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useRouter } from '@/i18n/routing'

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
        router.push('/admin/classes')
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
    <form
      ref={formRef}
      action={handleAction}
      className="flex flex-col md:flex-row relative overflow-hidden rounded-[2rem] border border-black/5 shadow-sm"
    >
      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      {/* Left — full-height image panel */}
      <label className="relative cursor-pointer group md:w-64 flex-shrink-0 min-h-[180px] md:min-h-0 bg-white/50 flex items-center justify-center overflow-hidden hover:bg-white/70 transition-colors border-b md:border-b-0 md:border-r border-black/5">
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            {/* hover overlay */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[9px] tracking-[0.25em] uppercase font-medium">Change</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center select-none">
            <svg className="w-7 h-7 text-[var(--foreground-muted)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[9px] tracking-[0.2em] text-[var(--foreground-muted)]/50 uppercase leading-relaxed">
              Upload<br />Image
            </span>
          </div>
        )}
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

      {/* Right — form fields */}
      <div className="flex-1 flex flex-col gap-6 p-8">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">
            Class Name *
          </label>
          <input
            name="name"
            defaultValue={initialData?.name}
            required
            placeholder="e.g. Group Reformer"
            className="w-full border-b border-[var(--border)] pb-3 text-xl font-serif text-[var(--foreground)] bg-transparent focus:outline-none focus:border-[var(--foreground)] transition-colors placeholder:text-[var(--foreground-muted)]/40"
          />
        </div>

        <div className="flex-1">
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-3">
            Description
          </label>
          <textarea
            name="description"
            defaultValue={initialData?.description ?? undefined}
            placeholder="Write a short description for this class type..."
            rows={4}
            className="w-full bg-black/[0.025] hover:bg-black/[0.04] focus:bg-white rounded-2xl px-5 py-4 text-sm font-light text-[var(--foreground)] focus:outline-none transition-all placeholder:text-[var(--foreground-muted)]/40 resize-none"
          />
        </div>

        {initialData && (
          <div className="flex items-center gap-3">
            <label htmlFor="isActive" className="text-[10px] tracking-widest uppercase text-[var(--foreground)] cursor-pointer">
              Active
            </label>
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              defaultChecked={initialData.isActive}
              className="accent-[var(--foreground)]"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-6 pt-4 border-t border-black/5">
          {initialData && (
            <button
              type="button"
              onClick={() => router.push('/admin/classes')}
              className="text-[10px] tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] uppercase cursor-pointer transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="bg-[var(--foreground)] text-[var(--background)] px-10 py-3.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm cursor-pointer"
          >
            {initialData ? 'Save Changes' : 'Add Class Type'}
          </button>
        </div>
      </div>
    </form>
  )
}
