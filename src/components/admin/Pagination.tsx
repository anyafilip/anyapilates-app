'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface PaginationProps {
  totalCount: number
  pageSize: number
}

export default function Pagination({ totalCount, pageSize }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPage = Number(searchParams.get('page')) || 1
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  if (totalPages <= 1) return null

  const handlePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page > 1) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-black/5 bg-white/40 rounded-b-[2rem]">
      <p className="text-[11px] tracking-widest text-[var(--foreground-muted)] uppercase">
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
      </p>
      
      <div className="flex gap-2">
        <button
          onClick={() => handlePage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-[10px] tracking-widest uppercase border border-black/10 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => handlePage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 text-[10px] tracking-widest uppercase border border-black/10 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
