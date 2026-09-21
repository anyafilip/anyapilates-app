'use client'

import { useState } from 'react'
import { saveStudioSettings } from '@/app/actions/admin'
import toast from 'react-hot-toast'

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [loading, setLoading] = useState(false)
  const [qrUrl, setQrUrl] = useState(initialSettings?.qrCodeUrl || '')
  
  const [footer, setFooter] = useState({
    contactEmail: initialSettings?.contactEmail || '',
    contactPhone: initialSettings?.contactPhone || '',
    contactAddress: initialSettings?.contactAddress || '',
    hoursWeekday: initialSettings?.hoursWeekday || '',
    hoursSaturday: initialSettings?.hoursSaturday || '',
    hoursSunday: initialSettings?.hoursSunday || '',
    instagramUrl: initialSettings?.instagramUrl || '',
    facebookUrl: initialSettings?.facebookUrl || '',
    lineUrl: initialSettings?.lineUrl || '',
    whatsappUrl: initialSettings?.whatsappUrl || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFooter({ ...footer, [e.target.name]: e.target.value })
  }

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
      await saveStudioSettings({
        qrCodeUrl: qrUrl,
        ...footer
      })
      toast.success('Settings saved successfully.')
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-12">
      {/* Payment Settings */}
      <div>
        <h2 className="text-xl font-serif text-[var(--foreground)] border-b border-black/5 pb-2 mb-6">Payment Settings</h2>
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
      </div>

      {/* Footer Details */}
      <div>
        <h2 className="text-xl font-serif text-[var(--foreground)] border-b border-black/5 pb-2 mb-6">Website Footer Content</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] mb-4">Contact</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Email Address</label>
                <input name="contactEmail" value={footer.contactEmail} onChange={handleChange} placeholder="hello@anyapilatesstudio.com" className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Phone Number</label>
                <input name="contactPhone" value={footer.contactPhone} onChange={handleChange} placeholder="+66 80 123 4567" className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Address</label>
                <textarea name="contactAddress" value={footer.contactAddress} onChange={handleChange} placeholder="Bangkok, Thailand" rows={2} className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] mb-4">Opening Hours</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Monday - Friday</label>
                <input name="hoursWeekday" value={footer.hoursWeekday} onChange={handleChange} placeholder="07:00 – 21:00" className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Saturday</label>
                <input name="hoursSaturday" value={footer.hoursSaturday} onChange={handleChange} placeholder="09:00 – 15:00" className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Sunday</label>
                <input name="hoursSunday" value={footer.hoursSunday} onChange={handleChange} placeholder="Closed" className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] mb-4">Social Media Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Instagram URL</label>
              <input name="instagramUrl" value={footer.instagramUrl} onChange={handleChange} placeholder="https://instagram.com/..." className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Facebook URL</label>
              <input name="facebookUrl" value={footer.facebookUrl} onChange={handleChange} placeholder="https://facebook.com/..." className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">LINE URL</label>
              <input name="lineUrl" value={footer.lineUrl} onChange={handleChange} placeholder="https://line.me/..." className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">WhatsApp URL</label>
              <input name="whatsappUrl" value={footer.whatsappUrl} onChange={handleChange} placeholder="https://wa.me/..." className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-black/10">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="btn-primary inline-flex items-center text-sm px-10 py-4"
        >
          {loading ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
