'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function createTemplate(data: { classTypeId: string, dayOfWeek: number, startTime: string, endTime: string, duration: number, capacity: number, instructorId?: string }) {
  const session = await auth()
  const user = session?.user as any
  if (user?.role !== 'ADMIN') throw new Error('Unauthorized')

  await prisma.weeklyScheduleTemplate.create({
    data: {
      ...data,
      instructorId: data.instructorId || null
    }
  })
  revalidatePath('/[locale]/(admin)/admin/schedule', 'page')
}

export async function deleteTemplate(id: string) {
  const session = await auth()
  const user = session?.user as any
  if (user?.role !== 'ADMIN') throw new Error('Unauthorized')

  await prisma.weeklyScheduleTemplate.delete({ where: { id } })
  revalidatePath('/[locale]/(admin)/admin/schedule', 'page')
}

export async function generateScheduleFromTemplates(weeksAhead: number = 4) {
  const session = await auth()
  const user = session?.user as any
  if (user?.role !== 'ADMIN') throw new Error('Unauthorized')

  const templates = await prisma.weeklyScheduleTemplate.findMany({
    where: { isActive: true },
    include: { classType: true }
  })

  // Start from tomorrow
  const startDate = new Date()
  startDate.setUTCHours(0, 0, 0, 0)
  startDate.setDate(startDate.getDate() + 1)

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + (weeksAhead * 7))

  let createdCount = 0

  // Iterate through every day between startDate and endDate
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getUTCDay() // 0 = Sunday
    
    // Find templates matching this day
    const dayTemplates = templates.filter(t => t.dayOfWeek === dayOfWeek)

    for (const t of dayTemplates) {
      // Create a Date object for the class start time on this day
      const [hours, minutes] = t.startTime.split(':').map(Number)
      const classDate = new Date(d)
      classDate.setUTCHours(hours, minutes, 0, 0) // UTC time (assuming input is UTC or pre-adjusted, actually we should assume the template time is local Bangkok time, but for now we store it as is and let the frontend format it). Actually, the manual create stores local time as UTC. Let's assume startTime is the display time and we just store the Date as UTC for comparison purposes.

      // Check if this exact class already exists to avoid duplicates
      const existing = await prisma.class.findFirst({
        where: {
          classTypeId: t.classTypeId,
          startTime: t.startTime,
          date: classDate
        }
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
            status: 'SCHEDULED'
          }
        })
        createdCount++
      }
    }
  }

  revalidatePath('/[locale]/(admin)/admin/schedule', 'page')
  revalidatePath('/[locale]/(public)', 'page')
  return createdCount
}
