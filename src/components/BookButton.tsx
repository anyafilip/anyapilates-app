'use client'

import { useTransition } from 'react'
import { bookClass } from '@/app/actions/booking'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  classId: string
  isLoggedIn: boolean
  isFull: boolean
  isPast: boolean
  userRole?: string
  fullWidth?: boolean
}

export default function BookButton({ classId, isLoggedIn, isFull, isPast, userRole, fullWidth }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (isPast) {
    return <span className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)] opacity-50">Passed</span>
  }

  if (isFull) {
    return <span className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)] opacity-50">Full</span>
  }


  const handleBook = () => {
    if (!isLoggedIn) {
      router.push('/en/login?callbackUrl=/')
      return
    }
    startTransition(async () => {
      const result = await bookClass(classId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <button
      onClick={handleBook}
      disabled={isPending}
      className={`btn-primary px-6 py-2 text-[11px] disabled:opacity-50 ${fullWidth ? 'w-full justify-center' : ''}`}
    >
      {isPending ? 'Reserving...' : isLoggedIn ? 'Reserve' : 'Sign in to Reserve'}
    </button>
  )
}
