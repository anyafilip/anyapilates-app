'use client'

import { useTransition } from 'react'
import { bookClass } from '@/app/actions/booking'
import { useRouter } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import toast from 'react-hot-toast'

interface Props {
  classId: string
  isLoggedIn: boolean
  isFull: boolean
  isPast: boolean
  isTooFarInAdvance?: boolean
  userRole?: string
  fullWidth?: boolean
}

export default function BookButton({
  classId,
  isLoggedIn,
  isFull,
  isPast,
  isTooFarInAdvance,
  userRole,
  fullWidth,
}: Props) {
  const router = useRouter()
  const locale = useLocale()
  const isTh = locale === 'th'
  const [isPending, startTransition] = useTransition()

  if (isPast) {
    return <span className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)] opacity-50">Passed</span>
  }

  if (isTooFarInAdvance) {
    return (
      <span
        className={`text-[9px] md:text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] opacity-60 border border-[var(--border)] px-3 py-1.5 rounded-full inline-block text-center whitespace-nowrap ${
          fullWidth ? 'w-full' : ''
        }`}
        title={isTh ? 'เปิดให้จองล่วงหน้า 14 วันก่อนเริ่มคลาส' : 'Bookings open 14 days before class'}
      >
        {isTh ? 'เปิดล่วงหน้า 14 วัน' : 'Opens 14d prior'}
      </span>
    )
  }

  if (isFull) {
    return <span className="text-[11px] tracking-widest uppercase text-[var(--foreground-muted)] opacity-50">Full</span>
  }

  const handleBook = () => {
    if (!isLoggedIn) {
      router.push('/login?callbackUrl=/')
      return
    }
    if (userRole === 'ADMIN' || userRole === 'INSTRUCTOR') {
      toast.error('Admins and Instructors cannot book classes.')
      return
    }
    if (isTooFarInAdvance) {
      toast.error(isTh ? 'เปิดให้จองล่วงหน้า 14 วันเท่านั้น' : 'Bookings only open 14 days in advance.')
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
      className={`btn-primary px-4 py-2 md:px-6 md:py-2 text-[9px] md:text-[11px] disabled:opacity-50 ${fullWidth ? 'w-full justify-center' : ''}`}
    >
      {isPending ? 'Reserving...' : isLoggedIn ? 'Reserve' : 'Sign in'}
    </button>
  )
}
