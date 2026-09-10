'use client'

import { useState } from 'react'
import { updateInstructorProfile } from '@/app/actions/instructor'
import toast from 'react-hot-toast'

export default function ProfileForm({ user }: { user: any }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.imageUrl)
  const [imageError, setImageError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setImageError(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      await updateInstructorProfile(formData)
      toast.success('Profile saved successfully!')
    } catch (err) {
      toast.error('Failed to save profile.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" encType="multipart/form-data">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="relative group shrink-0">
          <div className="w-32 h-32 bg-white/50 rounded-full overflow-hidden border border-white shadow-sm flex items-center justify-center transition-opacity group-hover:opacity-90">
            {previewUrl && !imageError ? (
              <img 
                src={previewUrl} 
                alt="" 
                className="w-full h-full object-cover text-transparent" 
                onError={() => setImageError(true)} 
              />
            ) : (
              <span className="text-4xl font-serif text-[var(--foreground-muted)]">{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          
          {/* Edit Pen Icon */}
          <div className="absolute bottom-0 right-2 w-9 h-9 bg-white border border-[var(--border)] rounded-full shadow-sm flex items-center justify-center text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] group-hover:border-[var(--foreground)] transition-all duration-300 pointer-events-none z-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            </svg>
          </div>

          {/* Hidden file input spanning the entire wrapper to be clickable */}
          <input type="file" name="imageFile" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" title="" />
          <input type="hidden" name="existingImageUrl" value={user.imageUrl ?? ''} />
        </div>
        
        <div className="flex-1 w-full space-y-6">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-2">Full Name</label>
            <input name="name" required defaultValue={user.name} className="w-full border-b border-[var(--border)] bg-transparent px-2 py-3 text-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-black/20" />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-2">Email (Read Only)</label>
            <input type="text" readOnly defaultValue={user.email} className="w-full border-b border-[var(--border)] bg-transparent px-2 py-3 text-lg text-[var(--foreground-muted)] outline-none cursor-not-allowed" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-2">Bio</label>
        <textarea name="bio" rows={5} defaultValue={user.bio ?? ''} placeholder="Tell your students a bit about your background and teaching style..." className="w-full border border-[var(--border)] rounded-xl px-4 py-4 text-sm text-[var(--foreground)] bg-white/50 focus:outline-none focus:border-[var(--accent)] resize-none leading-relaxed placeholder:text-black/20 transition-colors"></textarea>
      </div>

      <div className="pt-6 border-t border-[var(--border)]">
        <div className="mb-4">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--foreground)] mb-2">Schedule Notes</h2>
          <p className="text-xs text-[var(--foreground-muted)] font-light leading-relaxed">
            Use this space to let the Studio Admin know your regular working hours, upcoming time off, or any schedule changes.
          </p>
        </div>
        <textarea 
          name="availabilityNotes" 
          rows={4} 
          defaultValue={user.availabilityNotes ?? ''} 
          placeholder="e.g., Available Mon/Wed/Fri mornings (8am - 12pm). Taking time off Oct 12-15." 
          className="w-full border border-[var(--border)] rounded-xl px-4 py-4 text-sm text-[var(--foreground)] bg-white/50 focus:outline-none focus:border-[var(--accent)] resize-none leading-relaxed placeholder:text-black/20 transition-colors"
        ></textarea>
      </div>

      <div className="pt-6 flex justify-end">
        <button type="submit" disabled={isSubmitting} className="bg-[var(--foreground)] text-white px-8 py-3 rounded-full text-[10px] tracking-widest uppercase hover:bg-[var(--accent)] transition-colors shadow-sm disabled:opacity-50">
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}
