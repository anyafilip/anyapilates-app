import { prisma } from '@/lib/prisma'
import { cancelSession } from '@/app/actions/admin'
import { autoFillSchedule } from '@/app/actions/templates'
import SessionForm from './SessionForm'
import StopRecurringButton from './StopRecurringButton'
import Link from 'next/link'
import Modal from '@/components/Modal'

const TZ_OFFSET = 7 // Bangkok
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ editSessionId?: string; cancelSessionId?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const editSessionId = resolvedSearchParams.editSessionId
  const cancelSessionId = resolvedSearchParams.cancelSessionId

  // Auto-fill the next 8 weeks from active recurring templates (gap-filling, idempotent)
  await autoFillSchedule(8)

  const [classTypes, instructors, sessions, recurringTemplates] = await Promise.all([
    prisma.classType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: { role: 'INSTRUCTOR' },
      select: { id: true, name: true, availabilityNotes: true },
    }),
    prisma.class.findMany({
      where: { date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      include: { classType: true, instructor: { select: { name: true } } },
      orderBy: { date: 'asc' },
      take: 60,
    }),
    prisma.weeklyScheduleTemplate.findMany({
      where: { isActive: true },
      include: {
        classType: true,
        instructor: { select: { name: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
  ])

  const editingSession = editSessionId ? sessions.find(s => s.id === editSessionId) ?? null : null
  const cancelingSession = cancelSessionId ? sessions.find(s => s.id === cancelSessionId) ?? null : null

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Edit modal */}
      {editingSession && (
        <Modal title="Edit Session" onCloseUrl="/en/admin/schedule">
          <SessionForm
            key={editingSession.id}
            classTypes={classTypes}
            instructors={instructors}
            initialData={editingSession}
          />
        </Modal>
      )}

      {/* Cancel confirmation modal */}
      {cancelingSession && (
        <Modal title="Confirm Cancellation" onCloseUrl="/en/admin/schedule">
          <div className="text-center pt-4 pb-2">
            <p className="text-[var(--foreground)] font-light text-lg mb-10">
              Cancel{' '}
              <span className="font-medium">&ldquo;{cancelingSession.name}&rdquo;</span>?
            </p>
            <form
              action={cancelSession.bind(null, cancelingSession.id)}
              className="flex items-center justify-center gap-4"
            >
              <Link href="/en/admin/schedule" className="btn-ghost">
                Close
              </Link>
              <button
                type="submit"
                className="btn-primary !bg-red-800 hover:!bg-red-900 border !border-red-800"
              >
                Confirm Cancel
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-[var(--foreground)] mb-2">
          Schedule
        </h1>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
          Manage Classes &amp; Instructors
        </p>
      </div>

      {/* ── Unified Add Session form ── */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 mb-12 shadow-sm">
        <h2 className="text-xl font-serif text-[var(--foreground)] mb-2">Add Class</h2>
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-8">
          Toggle &ldquo;Repeat weekly&rdquo; to make it recurring
        </p>
        <SessionForm key="new" classTypes={classTypes} instructors={instructors} />

        {/* Instructor availability notes */}
        {instructors.some(i => i.availabilityNotes) && (
          <div className="mt-8 pt-6 border-t border-black/5">
            <h3 className="text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] mb-4">
              Instructor Availability Notes
            </h3>
            <div className="flex flex-wrap gap-4">
              {instructors
                .filter(i => i.availabilityNotes)
                .map(i => (
                  <div
                    key={i.id}
                    className="bg-white/40 px-5 py-4 rounded-2xl border border-white/60 max-w-sm"
                  >
                    <p className="text-xs font-medium text-[var(--foreground)] uppercase tracking-widest mb-2">
                      {i.name}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] font-light leading-relaxed whitespace-pre-wrap">
                      {i.availabilityNotes}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Active Recurring Classes ── */}
      {recurringTemplates.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-serif text-[var(--foreground)] mb-6">Recurring Classes</h2>
          <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                    <th className="font-medium py-5 pl-8">Day</th>
                    <th className="font-medium py-5">Class Type</th>
                    <th className="font-medium py-5">Time</th>
                    <th className="font-medium py-5">Instructor</th>
                    <th className="font-medium py-5">Capacity</th>
                    <th className="font-medium py-5 pr-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-light text-[var(--foreground)]">
                  {recurringTemplates.map(t => (
                    <tr
                      key={t.id}
                      className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors"
                    >
                      <td className="py-4 pl-8 font-medium">{DAYS[t.dayOfWeek]}</td>
                      <td className="py-4">{t.classType.name}</td>
                      <td className="py-4 text-[var(--foreground-muted)] text-xs">
                        {t.startTime} – {t.endTime}
                      </td>
                      <td className="py-4">{t.instructor?.name ?? '—'}</td>
                      <td className="py-4">{t.capacity}</td>
                      <td className="py-4 pr-8 text-right">
                        <StopRecurringButton id={t.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── All Sessions table ── */}
      <div>
        <h2 className="text-xl font-serif text-[var(--foreground)] mb-6">Upcoming Sessions</h2>
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                  <th className="font-medium py-6 pl-8">Class &amp; Date</th>
                  <th className="font-medium py-6">Instructor</th>
                  <th className="font-medium py-6">Bookings</th>
                  <th className="font-medium py-6">Status</th>
                  <th className="font-medium py-6 pr-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-light text-[var(--foreground)]">
                {sessions.map(cls => {
                  const localDate = new Date(cls.date.getTime() + TZ_OFFSET * 60 * 60 * 1000)
                  const dateStr = localDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC',
                  })
                  return (
                    <tr
                      key={cls.id}
                      className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors"
                    >
                      <td className="py-5 pl-8">
                        <p className="font-medium text-[var(--foreground)]">{cls.name}</p>
                        <p className="text-[11px] text-[var(--foreground-muted)] mt-1">
                          {dateStr} · {cls.startTime} – {cls.endTime}
                        </p>
                      </td>
                      <td className="py-5">{cls.instructor?.name ?? '—'}</td>
                      <td className="py-5">
                        {cls.bookedCount} / {cls.capacity}
                      </td>
                      <td className="py-5">
                        <span
                          className={
                            cls.status === 'SCHEDULED'
                              ? 'text-[var(--foreground)]'
                              : 'text-[var(--foreground-muted)]'
                          }
                        >
                          {cls.status === 'SCHEDULED' ? 'Active' : 'Cancelled'}
                        </span>
                      </td>
                      <td className="py-5 pr-8 text-right">
                        <div className="flex items-center justify-end gap-6 leading-none">
                          <Link
                            href={`/en/admin/schedule?editSessionId=${cls.id}`}
                            scroll={true}
                            className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                          >
                            Edit
                          </Link>
                          {cls.status === 'SCHEDULED' ? (
                            <Link
                              href={`/en/admin/schedule?cancelSessionId=${cls.id}`}
                              scroll={false}
                              className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-red-700 transition-colors"
                            >
                              Cancel
                            </Link>
                          ) : (
                            <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]/40">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <p className="text-[var(--foreground-muted)] font-serif italic text-lg">
                        No sessions scheduled yet.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
