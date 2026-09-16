import { prisma } from '@/lib/prisma'
import InstructorRow from './InstructorRow'

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

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                <th className="font-medium py-6 pl-8 w-24">Photo</th>
                <th className="font-medium py-6">Instructor</th>
                <th className="font-medium py-6">Status</th>
                <th className="font-medium py-6 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light text-[var(--foreground)]">
              {instructors.map(instructor => (
                <InstructorRow key={instructor.id} instructor={instructor} />
              ))}
              {instructors.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm italic text-[var(--foreground-muted)]">
                    No instructors found. Change a user's role to Instructor on the Users page.
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
