'use client'

import { useState, useMemo, useTransition } from 'react'
import { deleteUserPass } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Modal from '@/components/Modal'


type Pass = {
  id: string
  originalCount: number
  remainingCount: number
  expiresAt: Date
  activatedAt: Date | null
  classType: { name: string }
}

export default function UserPassesTable({ initialPasses }: { initialPasses: Pass[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const pageSize = 10
  
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const processedPasses = useMemo(() => {
    return initialPasses.map(pass => {
      const isPast = new Date(pass.expiresAt) < new Date()
      const isActivated = !!pass.activatedAt
      const isEmpty = pass.remainingCount === 0

      let status = 'ACTIVE'
      if (isEmpty) status = 'EMPTY'
      else if (isPast) status = 'EXPIRED'
      else if (!isActivated) status = 'NOT_ACTIVATED'

      return { ...pass, status }
    })
  }, [initialPasses])

  const filteredPasses = useMemo(() => {
    return processedPasses.filter(pass => {
      if (filter !== 'ALL' && pass.status !== filter) return false
      if (search && !pass.classType.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [processedPasses, search, filter])

    const paginatedPasses = useMemo(() => {
    return filteredPasses.slice((page - 1) * pageSize, page * pageSize)
  }, [filteredPasses, page])

  const totalPages = Math.ceil(filteredPasses.length / pageSize)

  const handleDelete = (passId: string) => {
    startTransition(async () => {
      try {
        await deleteUserPass(passId)
        toast.success('Pass deleted successfully.')
        setDeletingId(null)
        router.refresh()
      } catch (e: any) {
        toast.error(e.message || 'Failed to delete pass.')
        setDeletingId(null)
      }
    })
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-serif text-[var(--foreground)]">Passes</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search passes..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="text-xs bg-white/50 border border-black/10 rounded-full px-4 py-2 focus:outline-none focus:border-[var(--accent)]"
          />
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(1); }}
            className="text-xs bg-white/50 border border-black/10 rounded-full px-4 py-2 focus:outline-none pr-8 cursor-pointer appearance-none"
          >
            <option value="ALL">All Passes</option>
            <option value="ACTIVE">Active</option>
            <option value="NOT_ACTIVATED">Not Activated (Auto-activates)</option>
            <option value="EMPTY">Empty (Used Up)</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
              <th className="font-medium py-3 px-4">Class Type</th>
              <th className="font-medium py-3 px-4">Credits</th>
              <th className="font-medium py-3 px-4">Status</th>
              <th className="font-medium py-3 px-4">Expiry / Activation</th>
              <th className="font-medium py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginatedPasses.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[var(--foreground-muted)] italic text-sm">
                  No passes found.
                </td>
              </tr>
            ) : (
              paginatedPasses.map((pass) => (
                <tr key={pass.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                  <td className="py-4 px-4 font-medium text-[var(--foreground)]">
                    {pass.classType.name}
                  </td>
                  <td className="py-4 px-4 text-[var(--foreground-muted)]">
                    {pass.remainingCount} / {pass.originalCount}
                  </td>
                  <td className="py-4 px-4">
                    {pass.status === 'ACTIVE' && <span className="text-[10px] tracking-widest uppercase bg-green-100 text-green-800 px-2.5 py-1 rounded-full">Active</span>}
                    {pass.status === 'NOT_ACTIVATED' && <span className="text-[10px] tracking-widest uppercase bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">Not Activated</span>}
                    {pass.status === 'EMPTY' && <span className="text-[10px] tracking-widest uppercase bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">Used Up</span>}
                    {pass.status === 'EXPIRED' && <span className="text-[10px] tracking-widest uppercase bg-red-100 text-red-800 px-2.5 py-1 rounded-full">Expired</span>}
                  </td>
                  <td className="py-4 px-4 text-[var(--foreground-muted)]">
                    <div className="text-[10px] tracking-widest uppercase mb-0.5">
                      {pass.status === 'NOT_ACTIVATED' ? 'Auto-activates' : 'Expires'}
                    </div>
                    {new Date(pass.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button onClick={() => setDeletingId(pass.id)} className="text-[10px] uppercase tracking-widest text-red-800/60 hover:text-red-800 font-medium transition-colors">
                      Delete
                    </button>

                    {deletingId === pass.id && (
                      <Modal title="Delete Pass" onClose={() => setDeletingId(null)} maxWidth="max-w-md">
                        <p className="text-sm text-[var(--foreground-muted)] mb-8 text-left whitespace-normal">
                          Are you sure you want to delete this <strong>{pass.classType.name}</strong> pass? This action cannot be undone, and the user will permanently lose these credits.
                        </p>
                        <div className="flex gap-4">
                          <button onClick={() => setDeletingId(null)} disabled={isPending} className="flex-1 bg-transparent border border-[var(--foreground)] text-[var(--foreground)] py-3 rounded-full text-[10px] tracking-widest uppercase font-medium hover:bg-black/5 transition-colors disabled:opacity-50 cursor-pointer text-center">
                            Cancel
                          </button>
                          <button onClick={() => handleDelete(pass.id)} disabled={isPending} className="flex-1 bg-red-900 text-white py-3 rounded-full text-[10px] tracking-widest uppercase font-medium hover:bg-red-950 transition-colors shadow-sm disabled:opacity-50 cursor-pointer text-center">
                            {isPending ? 'Deleting...' : 'Confirm Delete'}
                          </button>
                        </div>
                      </Modal>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-black/5 px-4 py-4">
          <p className="text-xs text-[var(--foreground-muted)]">
            Showing <span className="font-medium text-[var(--foreground)]">{(page - 1) * pageSize + 1}</span> to <span className="font-medium text-[var(--foreground)]">{Math.min(page * pageSize, filteredPasses.length)}</span> of <span className="font-medium text-[var(--foreground)]">{filteredPasses.length}</span> results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-[10px] tracking-widest uppercase border border-black/10 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-[10px] tracking-widest uppercase border border-black/10 rounded-full hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
