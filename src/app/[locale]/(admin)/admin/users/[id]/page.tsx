import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import GrantPackageForm from './GrantPackageForm'
import DeletePassButton from './DeletePassButton'
import { autoActivatePasses } from '@/lib/passes'

export default async function UserDetailPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const session = await auth()
  const admin = session?.user as any
  if (admin?.role !== 'ADMIN') redirect('/en/login')

  const resolvedParams = await params
  const userId = resolvedParams.id

  // Ensure passes are up to date before rendering
  await autoActivatePasses(userId)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userPasses: {
        include: { classType: true },
        orderBy: { expiresAt: 'asc' }
      }
    }
  })

  if (!user) return notFound()

  const allPackages = await prisma.package.findMany({
    where: { isActive: true },
    include: { classType: true },
    orderBy: { price: 'asc' }
  })

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Link href="/en/admin/users" className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors mb-4 inline-block">
          &larr; Back to Users
        </Link>
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">{user.name}</h1>
        <p className="text-sm text-[var(--foreground-muted)]">{user.email} {user.phone ? `• ${user.phone}` : ''}</p>
      </div>

      <div className="space-y-8">
        {/* Active Passes */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 shadow-sm">
          <h2 className="text-xl font-serif text-[var(--foreground)] mb-6">Passes</h2>
          {user.userPasses.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] italic">No passes found for this user.</p>
          ) : (
            <div className="space-y-3">
              {user.userPasses.map(pass => {
                const isActive = pass.remainingCount > 0 && new Date(pass.expiresAt) > new Date()
                return (
                  <div key={pass.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${isActive ? 'bg-white/40 border-[var(--border)]' : 'bg-black/[0.02] border-black/5 opacity-50'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--foreground)] text-sm">{pass.classType.name}</p>
                      <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] mt-0.5">
                        {pass.remainingCount} / {pass.originalCount} Credits
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)]">
                        {pass.activatedAt ? 'Expires' : 'Auto-activates'}
                      </p>
                      <p className="text-xs font-medium text-[var(--foreground)] mt-0.5">
                        {new Date(pass.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <DeletePassButton passId={pass.id} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Grant Package — full width */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-serif text-[var(--foreground)]">Grant a Package</h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Use this to manually add a package for a client who has already paid outside the system.
            </p>
          </div>
          <GrantPackageForm userId={user.id} packages={allPackages} />
        </div>
      </div>
    </div>
  )
}

