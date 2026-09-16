import { prisma } from '@/lib/prisma'
import InstructorsTable from './InstructorsTable'
import DataTableTools from '@/components/admin/DataTableTools'
import Pagination from '@/components/admin/Pagination'

export default async function InstructorsPage({ searchParams }: { searchParams: Promise<{ q?: string, page?: string }> }) {
  const resolvedParams = await searchParams
  const q = resolvedParams.q || ''
  const page = parseInt(resolvedParams.page || '1')

  const where: any = { role: 'INSTRUCTOR' }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } }
    ]
  }

  const skip = (page - 1) * 20
  const take = 20

  const totalCount = await prisma.user.count({ where })

  const instructors = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take
  })

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Instructors</h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Manage Profiles & Biographies</p>
      </div>

      <DataTableTools searchPlaceholder="Search instructors by name or email..." />

      <InstructorsTable instructors={instructors} />
      <Pagination totalCount={totalCount} pageSize={20} />
    </div>
  )
}
