'use client'

import { useState, useTransition } from 'react'
import { updateInstructorProfile } from '@/app/actions/instructors'
import toast from 'react-hot-toast'

export default function InstructorRow({ instructor }: { instructor: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState(instructor.bio || '')
  const [imageUrl, setImageUrl] = useState(instructor.imageUrl || '')
  const [showOnFrontpage, setShowOnFrontpage] = useState(instructor.showOnFrontpage ?? true)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateInstructorProfile(instructor.id, bio, imageUrl, showOnFrontpage)
        toast.success('Instructor updated')
        setIsEditing(false)
      } catch (e: any) {
        toast.error(e.message || 'Failed to update')
      }
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <tr className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
        <td className="py-4 pl-8">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-black/5 flex items-center justify-center border border-black/5">
            {imageUrl ? (
              <img src={imageUrl} alt={instructor.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-serif text-[var(--foreground-muted)]">{instructor.name?.[0]}</span>
            )}
          </div>
        </td>
        <td className="py-4">
          <p className="font-medium text-[var(--foreground)]">{instructor.name}</p>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{instructor.email}</p>
        </td>
        <td className="py-4">
          <span className={`text-[9px] tracking-[0.2em] uppercase ${showOnFrontpage ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}`}>
            {showOnFrontpage ? 'Public' : 'Hidden'}
          </span>
        </td>
        <td className="py-4 pr-8 text-right">
          <button 
            onClick={() => setIsEditing(true)}
            className="text-[10px] tracking-widest uppercase border border-[var(--foreground-muted)] text-[var(--foreground-muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] px-4 py-2 rounded-full transition-colors"
          >
            Edit Profile
          </button>
        </td>
      </tr>

      {isEditing && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditing(false)
          }}
        >
          <div className="relative w-full max-w-lg bg-[var(--surface)]/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2.5rem] overflow-hidden animate-modal-content">
            <div className="flex items-center justify-between px-8 py-6 border-b border-black/5 bg-white/40">
              <h2 className="text-2xl font-serif text-[var(--foreground)]">Edit {instructor.name}</h2>
              <button 
                onClick={() => setIsEditing(false)} 
                className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                Close ✕
              </button>
            </div>
            <div className="p-8">
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-black/5 flex items-center justify-center border border-black/5 relative group cursor-pointer">
                  {imageUrl ? (
                    <img src={imageUrl} alt={instructor.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-serif text-[var(--foreground-muted)]">{instructor.name?.[0]}</span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                     <span className="text-white text-[10px] tracking-widest uppercase">Upload</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

            <div className="mb-5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${showOnFrontpage ? 'bg-[var(--foreground)] border-[var(--foreground)]' : 'border-black/20 group-hover:border-black/40'}`}>
                  {showOnFrontpage && (
                    <svg className="w-3 h-3 text-[var(--background)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-light text-[var(--foreground)]">Display on front page</span>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={showOnFrontpage} 
                  onChange={(e) => setShowOnFrontpage(e.target.checked)} 
                />
              </label>
            </div>

            <div className="mb-8">
              <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Biography</label>
              <textarea 
                className="w-full rounded-2xl bg-white/50 border border-black/10 p-4 text-sm font-light focus:outline-none focus:border-black/20 transition-colors resize-none"
                rows={5}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Pilates Instructor..."
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(false)} 
                className="flex-1 py-4 text-[10px] tracking-widest uppercase border border-[var(--foreground-muted)] text-[var(--foreground-muted)] rounded-full hover:bg-black/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={isPending}
                className="flex-1 py-4 text-[10px] tracking-widest uppercase bg-[var(--foreground)] text-[var(--background)] rounded-full hover:bg-black transition-colors disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}
    </>
  )
}
