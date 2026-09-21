'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { sendPasswordResetEmail } from '@/lib/email'

import { checkRateLimit } from '@/lib/rate-limit'

const ForgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export type ForgotState = {
  message?: string
  error?: string
}

export async function requestPasswordReset(prevState: ForgotState, formData: FormData): Promise<ForgotState> {
  // Rate limit: 3 password reset requests per 15 minutes per IP
  const allowed = await checkRateLimit('forgot_password', 3, 15 * 60 * 1000)
  if (!allowed) {
    return { error: 'Too many requests. Please try again later.' }
  }

  const email = formData.get('email') as string
  const parsed = ForgotSchema.safeParse({ email })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // Return success anyway to prevent email enumeration
    return { message: 'If an account exists, a reset link has been sent.' }
  }

  const token = crypto.randomUUID()
  const expires = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

  // Delete existing tokens for this email
  await prisma.passwordResetToken.deleteMany({ where: { email } })

  await prisma.passwordResetToken.create({
    data: { email, token, expires }
  })

  await sendPasswordResetEmail(email, token)

  return { message: 'If an account exists, a reset link has been sent.' }
}

const ResetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type ResetState = {
  message?: string
  error?: string
}

export async function resetPassword(token: string, prevState: ResetState, formData: FormData): Promise<ResetState> {
  // Rate limit: 5 resets per 15 minutes per IP
  const allowed = await checkRateLimit('reset_password', 5, 15 * 60 * 1000)
  if (!allowed) {
    return { error: 'Too many attempts. Please try again later.' }
  }

  const password = formData.get('password') as string
  const parsed = ResetSchema.safeParse({ password })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token }
  })

  if (!resetToken || resetToken.expires < new Date()) {
    return { error: 'Invalid or expired reset token.' }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { email: resetToken.email },
    data: { password: hashedPassword }
  })

  await prisma.passwordResetToken.delete({
    where: { id: resetToken.id }
  })

  return { message: 'Password has been reset successfully. You can now log in.' }
}
