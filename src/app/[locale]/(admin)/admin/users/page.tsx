import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import UserRow from './UserRow'
import Modal from '@/components/Modal'
import Link from 'next/link'
import DataTableTools from '@/components/admin/DataTableTools'
import Pagination from '@/components/admin/Pagination'

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ historyId?: string, q?: string, page?: string, filter?: string }> }) {
  const resolvedParams = await searchParams
  const historyId = resolvedParams.historyId
  const q = resolvedParams.q || ''
  const page = parseInt(resolvedParams.page || '1')
  const role = resolvedParams.filter

  const session = await auth()
  const currentUser = session?.user as any
  const now = new Date()

  const where: any = {}
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } }
    ]
  }
  if (role === 'ACTIVE_PASS') {
    where.role = 'CLIENT'
    where.userPasses = {
      some: {
        remainingCount: { gt: 0 },
        expiresAt: { gte: now }
      }
    }
  } else if (role === 'NO_PASS') {
    where.role = 'CLIENT'
    where.userPasses = {
      none: {
        remainingCount: { gt: 0 },
        expiresAt: { gte: now }
      }
    }
  } else if (role) {
    where.role = role
  }

  const skip = (page - 1) * 20
  const take = 20

  const [users, totalCount, totalClientsCount, activeClientsCount] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        userPasses: {
          where: { remainingCount: { gt: 0 }, expiresAt: { gte: now } },
          select: { remainingCount: true, expiresAt: true, classType: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.userPass.findMany({
      where: { remainingCount: { gt: 0 }, expiresAt: { gte: now }, user: { role: 'CLIENT' } },
      select: { userId: true },
      distinct: ['userId']
    }).then(res => res.length)
  ])

  let historyUser = null
  let ledger: any[] = []

  // If we wanted to fetch pass history, we would query UserPass/Bookings here
  // For now, leave ledger empty.
  if (historyId) {
    historyUser = await prisma.user.findUnique({ where: { id: historyId }, select: { name: true } })
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Users</h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
          Manage Studio Members · <strong className="text-[var(--foreground)] font-semibold">{activeClientsCount} Active Clients</strong> (with valid passes) · {totalClientsCount} Total Registered Clients
        </p>
      </div>

      <DataTableTools 
        searchPlaceholder="Search users by name or email..." 
        filterOptions={[
          { label: 'Active Pass Holders', value: 'ACTIVE_PASS' },
          { label: 'No Active Pass', value: 'NO_PASS' },
          { label: 'Clients Only', value: 'CLIENT' },
          { label: 'Instructors', value: 'INSTRUCTOR' },
          { label: 'Admins', value: 'ADMIN' },
        ]}
      />

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm">
        <div className="overflow-x-auto rounded-[2rem]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                <th className="font-medium py-6 pl-8 w-[30%]">Member</th>
                <th className="font-medium py-6 w-[15%]">Phone</th>
                <th className="font-medium py-6 w-[20%]">Credits / Pass</th>
                <th className="font-medium py-6 w-[20%]">Role</th>
                <th className="font-medium py-6 pr-8 text-right w-[15%]">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light text-[var(--foreground)]">
              {users.map(u => (
                <UserRow key={u.id} user={u} isCurrentUser={u.id === currentUser?.id} />
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <p className="text-[var(--foreground-muted)] font-serif italic text-lg mb-2">No users found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination totalCount={totalCount} pageSize={20} />
      </div>

      {historyUser && (
        <Modal title={`Credit History: ${historyUser.name}`} onCloseUrl="/admin/users">
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

