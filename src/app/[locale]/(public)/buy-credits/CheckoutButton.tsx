'use client'

import { useState } from 'react'
import { requestPackagePurchase } from '@/app/actions/billing'
import toast from 'react-hot-toast'

export default function CheckoutButton({ packageId }: { packageId: string }) {
  const [loading, setLoading] = useState(false)

  return (
    <form action={async () => {
      setLoading(true)
      try {
        await requestPackagePurchase(packageId)
      } catch (e: any) {
        toast.error(e.message || 'Payment failed')
        setLoading(false)
      }
    }} className="flex flex-col gap-3">
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-[var(--foreground)] text-[var(--background)] py-5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center cursor-pointer"
      >
        {loading ? 'Processing...' : 'Pay with QR'}
      </button>
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-transparent border border-[var(--foreground)] text-[var(--foreground)] py-5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black/5 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
      >
        Pay at the Studio
      </button>
    </form>
  )
}
