import { prisma } from '@/lib/prisma'
import TemplateForm from './TemplateForm'
import TemplateGenerator from './TemplateGenerator'
import Link from 'next/link'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function TemplatesPage() {
  const [templates, classTypes, instructors] = await Promise.all([
    prisma.weeklyScheduleTemplate.findMany({
      include: { classType: true, instructor: { select: { name: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    }),
    prisma.classType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { role: 'INSTRUCTOR' }, select: { id: true, name: true } })
  ])

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div>
          <Link href="/en/admin/schedule" className="text-[10px] tracking-widest uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-4 inline-block">
            ← Back to Schedule
          </Link>
          <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">Recurring Templates</h1>
          <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Manage Weekly Classes</p>
        </div>
        <TemplateGenerator />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1">
          <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 shadow-sm sticky top-12">
            <h2 className="font-serif text-2xl text-[var(--foreground)] mb-8">Add Template</h2>
            <TemplateForm classTypes={classTypes} instructors={instructors} />
          </div>
        </div>

        <div className="lg:col-span-2">
          {DAYS.map((dayName, dayIndex) => {
            const dayTemplates = templates.filter(t => t.dayOfWeek === dayIndex)
            if (dayTemplates.length === 0) return null

            return (
              <div key={dayIndex} className="mb-10 last:mb-0">
                <h3 className="text-lg font-serif text-[var(--foreground)] mb-4 border-b border-black/5 pb-2">{dayName}</h3>
                <div className="grid grid-cols-1 gap-4">
                  {dayTemplates.map(t => (
                    <div key={t.id} className="bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl p-5 flex justify-between items-center group shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{t.startTime} – {t.endTime}</p>
                        <p className="text-sm text-[var(--foreground-muted)] mt-1">{t.classType.name} • {t.instructor?.name || 'No Instructor'}</p>
                      </div>
                      <TemplateForm.DeleteButton id={t.id} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          
          {templates.length === 0 && (
            <div className="text-center py-20 text-[var(--foreground-muted)] font-light">
              No weekly templates found. Add one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
