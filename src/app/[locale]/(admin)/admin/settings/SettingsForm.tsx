'use client'

import { useState } from 'react'
import { saveStudioSettings } from '@/app/actions/admin'
import toast from 'react-hot-toast'

export default function SettingsForm({ initialQrUrl }: { initialQrUrl: string | null | undefined }) {
  const [loading, setLoading] = useState(false)
  const [qrUrl, setQrUrl] = useState(initialQrUrl || '')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_SIZE = 800
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
          setQrUrl(canvas.toDataURL('image/jpeg', 0.9))
        }
        img.src = reader.result
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await saveStudioSettings(qrUrl)
      toast.success('Settings saved successfully.')
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">PromptPay QR Code Image</label>
        
        {qrUrl ? (
          <div className="mb-4">
            <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain border border-black/5 rounded-xl bg-white shadow-sm" />
            <button 
              onClick={() => setQrUrl('')} 
              className="text-xs text-red-600 mt-2 hover:underline inline-block"
            >
              Remove QR Code
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-48 h-48 border-2 border-dashed border-black/10 rounded-xl hover:bg-black/5 transition-colors relative cursor-pointer">
            <span className="text-xs text-[var(--foreground-muted)]">Click to upload</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-black/5">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="btn-primary inline-flex items-center"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
