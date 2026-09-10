'use client'

import { useState, useTransition } from 'react'
import { submitPaymentSlip } from '@/app/actions/billing'
import toast from 'react-hot-toast'

export default function SlipUpload({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)

    // Convert file to base64
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64String = event.target?.result as string
      
      startTransition(async () => {
        try {
          await submitPaymentSlip(paymentId, base64String)
          toast.success('Slip submitted successfully.')
        } catch (err: any) {
          toast.error(err.message || 'Failed to submit slip.')
        } finally {
          setLoading(false)
        }
      })
    }
    reader.onerror = () => {
      toast.error('Failed to read file.')
      setLoading(false)
    }
    
    reader.readAsDataURL(file)
  }

  const isBusy = isPending || loading

  return (
    <div className="mt-8 flex justify-center">
      <input 
        type="file" 
        id={`slip-upload-${paymentId}`} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange}
        disabled={isBusy}
      />
      <label 
        htmlFor={`slip-upload-${paymentId}`}
        className={`w-full bg-[var(--foreground)] text-[var(--background)] py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm flex items-center justify-center cursor-pointer ${isBusy ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {isBusy ? 'Uploading...' : '↑ Upload Payment Slip'}
      </label>
    </div>
  )
}
