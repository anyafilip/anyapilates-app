import { prisma } from '@/lib/prisma'
import InstructorRow from './InstructorRow'
import AssignInstructorForm from './AssignInstructorForm'

export default async function InstructorsPage() {
  const instructors = await prisma.user.findMany({
    where: { role: 'INSTRUCTOR' },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-serif mb-2 text-stone-800">Instructors</h1>
        <p className="text-stone-600 font-sans">Manage instructor profiles and roles.</p>
      </div>

      <section>
        <h2 className="text-2xl font-serif mb-6 text-stone-800">Assign New Instructor</h2>
        <AssignInstructorForm />
      </section>

      <section>
        <h2 className="text-2xl font-serif mb-6 text-stone-800">Current Instructors</h2>
        {instructors.length === 0 ? (
          <p className="text-stone-500 italic">No instructors found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {instructors.map(instructor => (
              <InstructorRow key={instructor.id} instructor={instructor} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
