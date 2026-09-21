'use client'

import { useState } from 'react'
import { updateProfile } from '@/app/actions/profile'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function ProfileForm({ user }: { user: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(user.name || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [imageUrl, setImageUrl] = useState(user.imageUrl || '')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_SIZE = 500
          let width = img.width
          let height = img.height
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width)
              width = MAX_SIZE
            } else {
              width = Math.round((width * MAX_SIZE) / height)
              height = MAX_SIZE
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          setImageUrl(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.src = reader.result
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile({ name, phone, imageUrl })
      toast.success('Profile updated successfully.')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Profile Picture */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-black/5">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-black/5 flex items-center justify-center border-2 border-white/80 shadow-sm">
            {imageUrl ? (
              <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-black/20">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
          </div>
          <input 
            type="file" 
            id="profile-upload"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
        <div>
          <label htmlFor="profile-upload" className="inline-block px-4 py-2 border border-[var(--border)] rounded-full text-xs tracking-widest uppercase cursor-pointer hover:bg-white/50 transition-colors text-[var(--foreground)] mb-2">
            Change Picture
          </label>
          <p className="text-[10px] text-[var(--foreground-muted)] max-w-xs">JPG or PNG. Max size 5MB. Will be cropped to a circle.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-black/5">
        {/* Name */}
        <div>
          <label className="block text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mb-2">Full Name</label>
          <input 
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white/50 border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        
        {/* Phone */}
        <div>
          <label className="block text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mb-2">Phone Number</label>
          <input 
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+66 80 000 0000"
            className="w-full bg-white/50 border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      {/* Email (Read Only) */}
      <div className="pb-8 border-b border-black/5">
        <label className="block text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mb-2">Email Address</label>
        <input 
          type="email"
          value={user.email}
          disabled
          className="w-full md:w-1/2 bg-black/5 border border-transparent rounded-xl px-4 py-3 text-sm text-[var(--foreground-muted)] cursor-not-allowed"
        />
        <p className="text-[10px] text-[var(--foreground-muted)] mt-2">To change your email address, please contact support.</p>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary text-sm px-10 py-3"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
