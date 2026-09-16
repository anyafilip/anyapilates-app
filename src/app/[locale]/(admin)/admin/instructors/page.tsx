import { prisma } from '@/lib/prisma'
import InstructorsTable from './InstructorsTable'

export default async function InstructorsPage() {
  const instructors = await prisma.user.findMany({
    where: { role: 'INSTRUCTOR' },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Instructors</h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Manage Profiles & Biographies</p>
      </div>

      <InstructorsTable instructors={instructors} />
    </div>
  )
}
