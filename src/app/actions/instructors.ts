'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function updateInstructorProfile(userId: string, bio: string, imageUrl: string) {
  const session = await auth()
  const user = session?.user as any
  if (user?.role !== 'ADMIN') throw new Error('Unauthorized')

  await prisma.user.update({
    where: { id: userId },
    data: { bio, imageUrl }
  })

  revalidatePath('/[locale]/(admin)/admin/instructors', 'page')
  revalidatePath('/[locale]/(public)', 'page')
}

export async function assignInstructorRole(email: string) {
  const session = await auth()
  const user = session?.user as any
  if (user?.role !== 'ADMIN') throw new Error('Unauthorized')

  await prisma.user.update({
    where: { email },
    data: { role: 'INSTRUCTOR' }
  })
  
  revalidatePath('/[locale]/(admin)/admin/instructors', 'page')
}

export async function removeInstructorRole(userId: string) {
  const session = await auth()
  const user = session?.user as any
  if (user?.role !== 'ADMIN') throw new Error('Unauthorized')

  await prisma.user.update({
    where: { id: userId },
    data: { role: 'CLIENT' }
  })
  
  revalidatePath('/[locale]/(admin)/admin/instructors', 'page')
}
