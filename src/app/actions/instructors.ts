'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function updateInstructorProfile(userId: string, bio: string, imageUrl: string, showOnFrontpage: boolean) {
  const session = await auth()
  const user = session?.user as any
  if (user?.role !== 'ADMIN') throw new Error('Unauthorized')

  await prisma.user.update({
    where: { id: userId },
    data: { bio, imageUrl, showOnFrontpage }
  })

  revalidatePath('/[locale]/(admin)/admin/instructors', 'page')
  revalidatePath('/[locale]/(public)', 'page')
}
