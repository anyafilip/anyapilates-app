'use client'

import { useState, useTransition } from 'react'
import { cancelBooking } from '@/app/actions/booking'
import toast from 'react-hot-toast'

export default function CancelBookingButton({ bookingId, isLateCancel }: { bookingId: string, isLateCancel: boolean }) {
  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const res = await cancelBooking(bookingId)
        if (res.success) {
          toast.success(res.message)
          setShowModal(false)
        } else {
          toast.error(res.message)
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to cancel booking.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-[11px] tracking-widest uppercase font-light text-[var(--foreground-muted)] hover:text-red-700 transition-colors cursor-pointer"
        title="Cancel booking"
      >
        Cancel
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-modal-overlay">
          <div className="w-full max-w-md bg-[var(--surface)]/95 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-3xl overflow-hidden p-8 text-center relative">
            <h3 className="text-2xl font-serif text-[var(--foreground)] mb-4">Cancel Booking</h3>
            
            {isLateCancel ? (
              <p className="text-sm text-[var(--foreground)] leading-relaxed mb-8">
                This class starts in less than 12 hours.<br/>
                <span className="font-medium text-red-700">Your credit will not be refunded</span> if you cancel now.
              </p>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)] mb-8">
                Are you sure you want to cancel this booking? Your credit will be returned to your account.
              </p>
            )}

            <div className="flex items-center gap-4 justify-center">
              <button 
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="btn-ghost px-6 py-3 text-[10px]"
              >
                Keep Booking
              </button>
              <button 
                onClick={handleConfirm}
                disabled={isPending}
                className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-full text-[10px] tracking-[0.2em] uppercase transition-colors disabled:opacity-50"
              >
                {isPending ? 'Cancelling...' : (isLateCancel ? 'Cancel Anyway' : 'Confirm Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
