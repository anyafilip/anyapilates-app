'use client'

import { useState, useTransition } from 'react'
import { updateInstructorProfile } from '@/app/actions/instructors'

export default function InstructorRow({ instructor }: { instructor: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState(instructor.bio || '')
  const [imageUrl, setImageUrl] = useState(instructor.imageUrl || '')
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateInstructorProfile(instructor.id, bio, imageUrl)
        setIsEditing(false)
      } catch (e: any) {
        alert(e.message || 'Failed to update')
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
    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 items-start text-stone-800">
      <div className="w-24 h-24 shrink-0 rounded-full overflow-hidden bg-stone-200 border border-stone-300 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={instructor.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-serif text-stone-500">{instructor.name?.[0]}</span>
        )}
      </div>

      <div className="flex-1 w-full font-sans">
        <h3 className="font-serif text-xl mb-1">{instructor.name}</h3>
        <p className="text-sm text-stone-500 mb-4">{instructor.email}</p>
        
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-stone-600 mb-1">Avatar Upload (Base64)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1">Bio</label>
              <textarea 
                className="w-full rounded-xl bg-white/50 border border-white p-3 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSave} 
                disabled={isPending}
                className="px-4 py-2 bg-stone-800 text-white rounded-full text-sm hover:bg-stone-700 transition disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="px-4 py-2 bg-stone-200 text-stone-700 rounded-full text-sm hover:bg-stone-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-600 mb-6 whitespace-pre-wrap">{instructor.bio || 'No bio provided.'}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(true)}
                disabled={isPending}
                className="px-4 py-2 bg-stone-200 text-stone-800 rounded-full text-sm hover:bg-stone-300 transition disabled:opacity-50"
              >
                Edit Profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
