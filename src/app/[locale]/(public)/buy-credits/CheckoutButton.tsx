'use client'

import { useState } from 'react'
import { purchasePackage } from '@/app/actions/billing'
import toast from 'react-hot-toast'

export default function CheckoutButton({ packageId }: { packageId: string }) {
  const [loading, setLoading] = useState(false)

  return (
    <form action={async () => {
      setLoading(true)
      try {
        await purchasePackage(packageId)
      } catch (e: any) {
        toast.error(e.message || 'Payment failed')
        setLoading(false)
      }
    }}>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-[var(--foreground)] text-[var(--background)] py-5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[var(--background)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : 'Confirm Purchase'}
      </button>
    </form>
  )
}
