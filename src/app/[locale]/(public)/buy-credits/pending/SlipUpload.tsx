'use client'

import { useState, useTransition } from 'react'
import { submitPaymentSlip } from '@/app/actions/billing'
import toast from 'react-hot-toast'

export default function SlipUpload({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition()
  const [previewBase64, setPreviewBase64] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Compress to 80% quality JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)
        setPreviewBase64(compressedBase64)
      }
      img.src = event.target?.result as string
    }
    reader.onerror = () => {
      toast.error('Failed to read file.')
    }
    
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!previewBase64) return
    startTransition(async () => {
      try {
        await submitPaymentSlip(paymentId, previewBase64)
        toast.success('Slip submitted successfully.')
      } catch (err: any) {
        toast.error(err.message || 'Failed to submit slip.')
      }
    })
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      {!previewBase64 ? (
        <>
          <input 
            type="file" 
            id={`slip-upload-${paymentId}`} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
          <label 
            htmlFor={`slip-upload-${paymentId}`}
            className="w-full bg-[var(--foreground)] text-[var(--background)] py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm flex items-center justify-center cursor-pointer"
          >
            ↑ Upload Payment Slip
          </label>
        </>
      ) : (
        <div className="w-full flex flex-col items-center gap-4">
          <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">Slip Preview</p>
          <img src={previewBase64} alt="Slip Preview" className="w-48 h-48 object-cover rounded-xl border border-black/5 shadow-sm" />
          
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={() => setPreviewBase64(null)}
              disabled={isPending}
              className="flex-1 bg-transparent border border-[var(--foreground)] text-[var(--foreground)] py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black/5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Change
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 bg-[var(--foreground)] text-[var(--background)] py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isPending ? 'Submitting...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
