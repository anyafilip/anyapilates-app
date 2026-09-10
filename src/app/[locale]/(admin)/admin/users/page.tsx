import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import UserRowForm from './UserRowForm'

export default async function AdminUsersPage() {
  const session = await auth()
  const currentUser = session?.user as any

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

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
    </div>
  )
}
