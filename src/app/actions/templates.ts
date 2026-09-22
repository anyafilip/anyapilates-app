'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth()
  const user = session?.user as any
  if (user?.role !== 'ADMIN') throw new Error('Unauthorized')
}

// ── Internal: fill gaps for all active templates up to N weeks ahead ──────────

export async function autoFillSchedule(weeksAhead: number = 8) {
  await requireAdmin()
  if (weeksAhead < 1 || weeksAhead > 26) throw new Error('weeksAhead must be between 1 and 26')

  const templates = await prisma.weeklyScheduleTemplate.findMany({
    where: { isActive: true },
    include: { classType: true },
  })

  if (templates.length === 0) return 0

  const startDate = new Date()
  startDate.setUTCHours(0, 0, 0, 0)

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + weeksAhead * 7)

  let createdCount = 0

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getUTCDay()
    const dayTemplates = templates.filter(t => t.dayOfWeek === dayOfWeek)

    for (const t of dayTemplates) {
      const [hours, minutes] = t.startTime.split(':').map(Number)
      const classDate = new Date(d)
      classDate.setUTCHours(hours - 7, minutes, 0, 0) // Bangkok UTC+7

      const existing = await prisma.class.findFirst({
        where: { classTypeId: t.classTypeId, startTime: t.startTime, date: classDate },
      })

      if (!existing) {
        await prisma.class.create({
          data: {
            classTypeId: t.classTypeId,
            name: t.classType.name,
            instructorId: t.instructorId,
            date: classDate,
            startTime: t.startTime,
            endTime: t.endTime,
            duration: t.duration,
            capacity: t.capacity,
            status: 'SCHEDULED',
          },
        })
        createdCount++
      }
    }
  }

  return createdCount
}

// ── Create a one-off session ──────────────────────────────────────────────────

export async function createSession(formData: FormData) {
  await requireAdmin()

  const dateStr = String(formData.get('date'))
  const startTime = String(formData.get('startTime'))
  const endTime = String(formData.get('endTime'))
  const classTypeId = formData.get('classTypeId') ? String(formData.get('classTypeId')) : null
  const instructorId = formData.get('instructorId') ? String(formData.get('instructorId')) : null

  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = startTime.split(':').map(Number)
  const dateUtc = new Date(Date.UTC(year, month - 1, day, hour - 7, minute))

  const classTypeName = classTypeId
    ? (await prisma.classType.findUnique({ where: { id: classTypeId } }))?.name ?? 'Class'
    : 'Class'

  await prisma.class.create({
    data: {
      name: classTypeName,
      classTypeId,
      instructorId,
      date: dateUtc,
      startTime,
      endTime,
      duration: Number(formData.get('duration') ?? 60),
      capacity: Number(formData.get('capacity') ?? 6),
    },
  })

  revalidatePath('/en/admin/schedule')
  revalidatePath('/')
}

// ── Create a recurring class (template + immediate generation) ────────────────

export async function createRecurringClass(formData: FormData) {
  await requireAdmin()

  const startTime = String(formData.get('startTime'))
  const endTime = String(formData.get('endTime'))
  const classTypeId = formData.get('classTypeId') ? String(formData.get('classTypeId')) : null
  const instructorId = formData.get('instructorId') ? String(formData.get('instructorId')) : null
  const duration = Number(formData.get('duration') ?? 60)
  const capacity = Number(formData.get('capacity') ?? 6)

  if (!classTypeId) throw new Error('Class type is required')

  // dayOfWeek comes directly from the day-picker (0=Sun … 6=Sat)
  const dayOfWeek = Number(formData.get('dayOfWeek'))

  // Save the template
  await prisma.weeklyScheduleTemplate.create({
    data: {
      classTypeId,
      instructorId,
      dayOfWeek,
      startTime,
      endTime,
      duration,
      capacity,
      isActive: true,
    },
  })

  // Immediately fill the next 8 weeks
  await autoFillSchedule(8)

  revalidatePath('/en/admin/schedule')
  revalidatePath('/')
}

// ── Stop a recurring class ────────────────────────────────────────────────────

export async function stopRecurringClass(templateId: string) {
  await requireAdmin()
  await prisma.weeklyScheduleTemplate.update({
    where: { id: templateId },
    data: { isActive: false },
  })
  revalidatePath('/en/admin/schedule')
}

// ── Legacy exports (keep for backward compat) ─────────────────────────────────

export async function createTemplate(data: { classTypeId: string, dayOfWeek: number, startTime: string, endTime: string, duration: number, capacity: number, instructorId?: string }) {
  await requireAdmin()
  await prisma.weeklyScheduleTemplate.create({
    data: { ...data, instructorId: data.instructorId || null }
  })
  revalidatePath('/en/admin/schedule')
}

export async function deleteTemplate(id: string) {
  await requireAdmin()
  await prisma.weeklyScheduleTemplate.delete({ where: { id } })
  revalidatePath('/en/admin/schedule')
}

export async function generateScheduleFromTemplates(weeksAhead: number = 4) {
  await requireAdmin()
  const count = await autoFillSchedule(weeksAhead)
  revalidatePath('/en/admin/schedule')
  revalidatePath('/')
  return count
}
