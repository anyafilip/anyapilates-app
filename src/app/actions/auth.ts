'use server'

import { z } from 'zod'
import bcrypt from 'bcrypt'
import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AuthError } from 'next-auth'

// ── Register ──────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type RegisterState = {
  errors?: { name?: string[]; email?: string[]; password?: string[] }
  message?: string
}

export async function register(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { name, email, phone, password } = parsed.data

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { message: 'An account with this email already exists.' }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { name, email, phone, password: hashedPassword },
  })

  // Auto-login after registration
  await signIn('credentials', { email, password, redirectTo: '/en/account' })

  return { message: 'Account created successfully!' }
}

// ── Login ─────────────────────────────────────────────────────────────────────

export type LoginState = {
  message?: string
}

export async function login(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string
  
  // Find user to determine role-based redirect
  const user = await prisma.user.findUnique({ where: { email } })
  const role = user?.role || 'CLIENT'
  
  let redirectUrl = '/en/account'
  if (role === 'ADMIN') redirectUrl = '/en/admin'
  if (role === 'INSTRUCTOR') redirectUrl = '/en/instructor'

  try {
    await signIn('credentials', {
      email,
      password: formData.get('password'),
      redirectTo: redirectUrl,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Invalid email or password.' }
        default:
          return { message: 'Something went wrong. Please try again.' }
      }
    }
    // NEXT_REDIRECT is not an error, re-throw it so Next.js can handle the redirect
    throw error
  }

  return {}
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout() {
  await signOut({ redirectTo: '/en/login' })
}

