'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'

interface DataTableToolsProps {
  searchPlaceholder?: string
  filterOptions?: { label: string, value: string }[]
  filterPlaceholder?: string
  filterParamName?: string
}

export default function DataTableTools({ 
  searchPlaceholder = 'Search...', 
  filterOptions, 
  filterPlaceholder = 'All',
  filterParamName = 'filter'
}: DataTableToolsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialSearch = searchParams.get('q') || ''
  const [searchTerm, setSearchTerm] = useState(initialSearch)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      params.delete('page') // Reset page on filter/search
      return params.toString()
    },
    [searchParams]
  )

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== (searchParams.get('q') || '')) {
        router.push(pathname + '?' + createQueryString('q', searchTerm))
      }
    }, 400)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, pathname, router, createQueryString, searchParams])

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1 max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-black/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-md border border-white/80 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black/20 text-stone-800 placeholder-stone-400"
        />
      </div>

      {filterOptions && filterOptions.length > 0 && (
        <div className="relative min-w-[160px]">
          <select
            value={searchParams.get(filterParamName) || ''}
            onChange={(e) => router.push(pathname + '?' + createQueryString(filterParamName, e.target.value))}
            className="w-full appearance-none pl-4 pr-10 py-3 bg-white/60 backdrop-blur-md border border-white/80 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black/20 text-stone-800 cursor-pointer"
          >
            <option value="">{filterPlaceholder}</option>
            {filterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
