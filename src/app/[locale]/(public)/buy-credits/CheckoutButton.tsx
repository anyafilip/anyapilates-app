'use client'

import { useState } from 'react'
import { requestPackagePurchase } from '@/app/actions/billing'
import toast from 'react-hot-toast'

export default function CheckoutButton({ packageId }: { packageId: string }) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handlePurchase = async (method: 'QR' | 'COUNTER') => {
    setLoading(true)
    try {
      await requestPackagePurchase(packageId, method)
    } catch (e: any) {
      if (e?.message === 'NEXT_REDIRECT' || e?.digest?.includes('NEXT_REDIRECT')) {
        throw e // Re-throw so Next.js handles the redirect correctly
      }
      toast.error(e.message || 'Payment failed')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => handlePurchase('QR')}
          disabled={loading}
          className="w-full bg-[var(--foreground)] text-[var(--background)] py-5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center cursor-pointer"
        >
          {loading ? 'Processing...' : 'Pay with QR'}
        </button>
        
        <button 
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="w-full bg-transparent border border-[var(--foreground)] text-[var(--foreground)] py-5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black/5 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
        >
          Pay at the Studio
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 transition-opacity">
          <div className="bg-[#EDE8E2] border border-white/60 rounded-[2rem] p-8 shadow-2xl max-w-sm w-full text-center">
            <h3 className="font-serif text-2xl text-[var(--foreground)] mb-3">Pay at the Studio</h3>
            <p className="text-sm font-light text-[var(--foreground)] mb-8">
              By confirming, your order will be created. You must complete the payment at the front desk before you can book classes.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  setShowConfirm(false)
                  handlePurchase('COUNTER')
                }}
                disabled={loading}
                className="w-full bg-[var(--foreground)] text-[var(--background)] py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Processing...' : 'Confirm Order'}
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="w-full bg-transparent border border-[var(--foreground)] text-[var(--foreground)] py-4 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-black/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
