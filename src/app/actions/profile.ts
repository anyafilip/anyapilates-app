'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const MAX_IMAGE_LENGTH = 4_000_000
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp']

function validateImageBase64(value: string | undefined): string | null | undefined {
  if (!value || value === '') return null
  if (value.length > MAX_IMAGE_LENGTH) throw new Error('Profile picture is too large. Maximum size is 3 MB.')
  if (!value.startsWith('data:image/')) throw new Error('Invalid file type for profile picture.')
  const mimeMatch = value.match(/^data:(image\/[a-zA-Z+]+);base64,/)
  if (!mimeMatch || !ALLOWED_IMAGE_MIMES.includes(mimeMatch[1])) {
    throw new Error('Profile picture must be a JPEG, PNG, or WebP image.')
  }
  return value
}

const ProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  phone: z.string().max(20, 'Phone number is too long').optional(),
})

export async function updateProfile(data: { name: string; phone?: string; imageUrl?: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const parsed = ProfileSchema.safeParse({ name: data.name, phone: data.phone })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const imageUrl = validateImageBase64(data.imageUrl)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
  })

  revalidatePath('/en/account')
  revalidatePath('/en/account/settings')
  return { success: true }
}

export async function getProfile() {
  const session = await auth()
  if (!session?.user?.id) return null

  // Explicitly exclude password hash — never return it to the component layer
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      imageUrl: true,
      role: true,
      createdAt: true,
    },
  })
}
