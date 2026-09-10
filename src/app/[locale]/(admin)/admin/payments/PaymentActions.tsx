'use client'

import { useState, useTransition } from 'react'
import { confirmPayment, rejectPayment } from '@/app/actions/billing'
import toast from 'react-hot-toast'

export default function PaymentActions({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition()
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await confirmPayment(paymentId)
        toast.success('Payment confirmed.')
      } catch (e: any) {
        toast.error(e.message || 'Failed to confirm payment.')
      }
    })
  }

  const handleReject = () => {
    if (!note) {
      toast.error('Please provide a rejection note.')
      return
    }
    startTransition(async () => {
      try {
        await rejectPayment(paymentId, note)
        toast.success('Payment rejected.')
        setRejecting(false)
      } catch (e: any) {
        toast.error(e.message || 'Failed to reject payment.')
      }
    })
  }

  if (rejecting) {
    return (
      <div className="flex items-center gap-2">
        <input 
          type="text" 
          value={note} 
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason..." 
          className="w-32 bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[var(--foreground)] text-[11px] py-1 text-[var(--foreground)]"
        />
        <button 
          onClick={handleReject} 
          disabled={isPending}
          className="text-[10px] tracking-[0.2em] uppercase text-red-700 hover:text-red-900 transition-colors disabled:opacity-50"
        >
          {isPending ? '...' : 'Send'}
        </button>
        <button 
          onClick={() => setRejecting(false)} 
          disabled={isPending}
          className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6">
      <button 
        onClick={handleConfirm}
        disabled={isPending}
        className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-50"
      >
        {isPending ? 'Processing...' : 'Confirm'}
      </button>
      <button 
        onClick={() => setRejecting(true)}
        disabled={isPending}
        className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-red-800 transition-colors cursor-pointer disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  )
}
