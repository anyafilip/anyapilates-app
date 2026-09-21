'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: { name: string; phone?: string; imageUrl?: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      phone: data.phone || null,
      imageUrl: data.imageUrl || null
    }
  })

  revalidatePath('/en/account')
  revalidatePath('/en/account/settings')
  return { success: true }
}
