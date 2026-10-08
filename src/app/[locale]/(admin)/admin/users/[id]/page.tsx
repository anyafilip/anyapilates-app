import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import GrantPackageForm from './GrantPackageForm'
import UserPassesTable from './UserPassesTable'
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
        {/* Passes Table */}
        <UserPassesTable initialPasses={user.userPasses} />

        {/* Grant Package — full width */}
        {user.role === 'CLIENT' ? (
          <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-serif text-[var(--foreground)]">Grant a Package</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                Use this to manually add a package for a client who has already paid outside the system.
              </p>
            </div>
            <GrantPackageForm userId={user.id} packages={allPackages} />
          </div>
        ) : (
          <div className="bg-black/5 rounded-[2rem] p-8 shadow-sm text-center">
            <p className="text-sm text-[var(--foreground-muted)] italic">
              Packages cannot be granted to Instructors or Admins.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

