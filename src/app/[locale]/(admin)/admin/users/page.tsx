import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import UserRowForm from './UserRowForm'
import Modal from '@/components/Modal'
import Link from 'next/link'

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ historyId?: string }> }) {
  const resolvedParams = await searchParams
  const historyId = resolvedParams.historyId

  const session = await auth()
  const currentUser = session?.user as any

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  let historyUser = null
  let ledger: any[] = []
  if (historyId) {
    historyUser = users.find(u => u.id === historyId)
    if (historyUser) {
      ledger = await prisma.creditLedger.findMany({
        where: { userId: historyId },
        orderBy: { createdAt: 'desc' }
      })
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Users</h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Manage Studio Members & Roles</p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                <th className="font-medium py-6 pl-8">Member</th>
                <th className="font-medium py-6">Credits</th>
                <th className="font-medium py-6">Role</th>
                <th className="font-medium py-6 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light text-[var(--foreground)]">
              {users.map(u => (
                <tr key={u.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                  <td className="py-4 pl-8">
                    <p className="font-medium text-[var(--foreground)]">{u.name}</p>
                    <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{u.email}</p>
                  </td>
                  
                  {u.id !== currentUser?.id ? (
                    <td colSpan={3} className="py-4 pr-8 text-right">
                      <UserRowForm user={u} />
                    </td>
                  ) : (
                    <>
                      <td className="py-4">{u.credits}</td>
                      <td className="py-4">{u.role}</td>
                      <td className="py-4 pr-8 text-right text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]/50">Current User</td>
                    </>
                  )}
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">No users found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {historyUser && (
        <Modal title={`Credit History: ${historyUser.name}`} onCloseUrl="/en/admin/users">
          <div className="bg-white/40 rounded-2xl border border-white/80 overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="sticky top-0 bg-[#f7f5f2] border-b border-black/5">
                  <tr className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                    <th className="font-medium py-4 pl-6">Date</th>
                    <th className="font-medium py-4">Type</th>
                    <th className="font-medium py-4 text-center">Δ</th>
                    <th className="font-medium py-4 text-center">Bal</th>
                    <th className="font-medium py-4 pr-6">Reason</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-light text-[var(--foreground)]">
                  {ledger.map(entry => (
                    <tr key={entry.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                      <td className="py-3 pl-6 text-[12px] text-[var(--foreground-muted)]">
                        {entry.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 text-[10px] tracking-widest uppercase">{entry.type}</td>
                      <td className={`py-3 text-center font-medium ${entry.delta > 0 ? 'text-green-700' : entry.delta < 0 ? 'text-red-700' : ''}`}>
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </td>
                      <td className="py-3 text-center font-medium">{entry.balanceAfter}</td>
                      <td className="py-3 pr-6 text-[12px] truncate max-w-[150px]" title={entry.reason}>{entry.reason}</td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[12px] italic text-[var(--foreground-muted)]">
                        No credit history.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

