import { prisma } from '@/lib/prisma'
import { cancelSession } from '@/app/actions/admin'
import { autoFillSchedule } from '@/app/actions/templates'
import SessionForm from './SessionForm'
import StopRecurringButton from './StopRecurringButton'
import CancelSessionForm from './CancelSessionForm'
import { Link } from '@/i18n/routing'
import Modal from '@/components/Modal'
import ClassNameDisplay from '@/components/ClassNameDisplay'
import { bulkCancelSessions } from '@/app/actions/admin'
import { bulkStopRecurringTemplates } from '@/app/actions/templates'
import { BulkSelectionProvider } from '@/components/admin/BulkSelectionContext'
import { BulkSelectionCheckbox, BulkSelectAllCheckbox } from '@/components/admin/BulkSelectionCheckbox'
import { BulkActionBarController } from '@/components/admin/BulkActionBarController'

import DataTableTools from '@/components/admin/DataTableTools'
import Pagination from '@/components/admin/Pagination'


const TZ_OFFSET = 7 // Bangkok
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ editSessionId?: string; cancelSessionId?: string, sq?: string, spage?: string, sfilter?: string, rq?: string, rpage?: string, rfilter?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const editSessionId = resolvedSearchParams.editSessionId
  const cancelSessionId = resolvedSearchParams.cancelSessionId
  
  const sq = resolvedSearchParams.sq || ''
  const spage = resolvedSearchParams.spage ? parseInt(resolvedSearchParams.spage, 10) : 1
  const sfilter = resolvedSearchParams.sfilter || ''
  
  const rq = resolvedSearchParams.rq || ''
  const rpage = resolvedSearchParams.rpage ? parseInt(resolvedSearchParams.rpage, 10) : 1
  const rfilter = resolvedSearchParams.rfilter || ''

  // Auto-fill the next 8 weeks from active recurring templates (gap-filling, idempotent)
  await autoFillSchedule(8)
  
  // Sessions filters
  const sWhere: any = {}
  if (sq) {
    sWhere.OR = [
      { name: { contains: sq, mode: 'insensitive' } },
      { instructor: { name: { contains: sq, mode: 'insensitive' } } },
      { classType: { name: { contains: sq, mode: 'insensitive' } } }
    ]
  }
  if (sfilter) {
    sWhere.status = sfilter
  } else {
    // Default show only scheduled or recent
    sWhere.date = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }
  
  // Recurring filters
  const rWhere: any = { isActive: true }
  if (rq) {
    rWhere.OR = [
      { classType: { name: { contains: rq, mode: 'insensitive' } } },
      { instructor: { name: { contains: rq, mode: 'insensitive' } } }
    ]
  }
  if (rfilter) {
    rWhere.dayOfWeek = parseInt(rfilter, 10)
  }

  const sTake = 20
  const sSkip = (spage - 1) * sTake
  
  const rTake = 10
  const rSkip = (rpage - 1) * rTake

  const [classTypes, instructors, sessions, sTotal, recurringTemplates, rTotal] = await Promise.all([
    prisma.classType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: { role: 'INSTRUCTOR' },
      select: { id: true, name: true, availabilityNotes: true },
    }),
    prisma.class.findMany({
      where: sWhere,
      include: { classType: true, instructor: { select: { name: true } } },
      orderBy: { date: 'asc' },
      take: sTake,
      skip: sSkip,
    }),
    prisma.class.count({ where: sWhere }),
    prisma.weeklyScheduleTemplate.findMany({
      where: rWhere,
      include: { classType: true, instructor: { select: { name: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      take: rTake,
      skip: rSkip,
    }),
    prisma.weeklyScheduleTemplate.count({ where: rWhere }),
  ])

  let editingSession = null
  if (editSessionId) {
    editingSession = sessions.find(s => s.id === editSessionId) || await prisma.class.findUnique({ where: { id: editSessionId }, include: { classType: true, instructor: true } })
  }
  let cancelingSession = null
  if (cancelSessionId) {
    cancelingSession = sessions.find(s => s.id === cancelSessionId) || await prisma.class.findUnique({ where: { id: cancelSessionId }, include: { classType: true, instructor: true } })
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Edit modal */}
      {editingSession && (
        <Modal title="Edit Session" onCloseUrl="/admin/schedule">
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
        <Modal title="Confirm Cancellation" onCloseUrl="/admin/schedule">
          <div className="text-center pt-4 pb-2">
            <p className="text-[var(--foreground)] font-light text-lg mb-10">
              Cancel{' '}
              <span className="font-medium">&ldquo;{cancelingSession.name}&rdquo;</span>?
            </p>
            <CancelSessionForm sessionId={cancelingSession.id} />
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
      </div>

      {/* ── Active Recurring Classes ── */}
      {recurringTemplates.length > 0 && (
        <BulkSelectionProvider>
        <div className="mb-12">
          <h2 className="text-xl font-serif text-[var(--foreground)] mb-6">Recurring Classes</h2>
          <DataTableTools 
            searchPlaceholder="Search templates..."
            searchParamName="rq"
            pageParamName="rpage"
            filterParamName="rfilter"
            filterPlaceholder="All Days"
            filterOptions={DAYS.map((day, idx) => ({ label: day, value: idx.toString() }))}
          />
          <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                    <th className="py-5 pl-8 w-12"><BulkSelectAllCheckbox ids={recurringTemplates.map(t => t.id)} /></th>
                    <th className="font-medium py-5 pl-2">Day</th>
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
                      <td className="py-4 pl-8"><BulkSelectionCheckbox id={t.id} /></td>
                      <td className="py-4 pl-2 font-medium">{DAYS[t.dayOfWeek]}</td>
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
          <Pagination totalCount={rTotal} pageSize={10} pageParam="rpage" />
          <BulkActionBarController actions={[{ label: "Stop Selected", action: bulkStopRecurringTemplates, confirmMessage: "Stop these recurring classes? (This will not delete existing scheduled sessions)", destructive: true }]} />
        </div>
        </BulkSelectionProvider>
      )}

      {/* ── All Sessions table ── */}
      <BulkSelectionProvider>
      <div>
        <h2 className="text-xl font-serif text-[var(--foreground)] mb-6">Upcoming Sessions</h2>
        <DataTableTools 
          searchPlaceholder="Search classes..."
          searchParamName="sq"
          pageParamName="spage"
          filterParamName="sfilter"
          filterPlaceholder="All Statuses"
          filterOptions={[
            { label: 'Scheduled', value: 'SCHEDULED' },
            { label: 'Cancelled', value: 'CANCELLED' }
          ]}
        />
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-black/5 text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                  <th className="py-6 pl-8 w-12"><BulkSelectAllCheckbox ids={sessions.map(s => s.id)} /></th>
                  <th className="font-medium py-6 pl-2">Class &amp; Date</th>
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
                      <td className="py-5 pl-8"><BulkSelectionCheckbox id={cls.id} /></td>
                      <td className="py-5 pl-2">
                        <ClassNameDisplay name={cls.name} classTypeName={cls.classType?.name} size="sm" />
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
                            href={`/admin/schedule?editSessionId=${cls.id}`}
                            scroll={true}
                            className="text-[10px] tracking-[0.2em] uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                          >
                            Edit
                          </Link>
                          {cls.status === 'SCHEDULED' ? (
                            <Link
                              href={`/admin/schedule?cancelSessionId=${cls.id}`}
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
        <Pagination totalCount={sTotal} pageSize={20} pageParam="spage" />
        <BulkActionBarController actions={[{ label: "Cancel Selected", action: bulkCancelSessions, confirmMessage: "Cancel these scheduled classes? Customers will be refunded and notified.", destructive: true }]} />
      </div>
      </BulkSelectionProvider>
    </div>
  )
}
