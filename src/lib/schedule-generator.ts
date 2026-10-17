import { prisma } from '@/lib/prisma'

/**
 * Pure generator function to fill schedule gaps up to N weeks ahead.
 * Safe, idempotent, can be called by Server Actions or background cron jobs.
 */
export async function runScheduleSync(weeksAhead: number = 8): Promise<number> {
  if (weeksAhead < 1 || weeksAhead > 26) {
    throw new Error('weeksAhead must be between 1 and 26')
  }

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

      if (classDate.getTime() < Date.now()) {
        continue
      }

      const existing = await prisma.class.findFirst({
        where: {
          startTime: t.startTime,
          date: classDate,
          classTypeId: t.classTypeId,
          ...(t.instructorId ? { instructorId: t.instructorId } : {}),
        },
      })

      if (!existing) {
        await prisma.class.create({
          data: {
            classTypeId: t.classTypeId,
            name: t.name || t.classType.name,
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
      } else if (existing.status === 'CANCELLED' && existing.bookedCount === 0) {
        // If an old cancelled session exists in this slot with no bookings, overwrite/reactivate it with the new template
        await prisma.class.update({
          where: { id: existing.id },
          data: {
            classTypeId: t.classTypeId,
            name: t.name || t.classType.name,
            instructorId: t.instructorId,
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
