import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { z } from "zod"
import bcrypt from "bcrypt"
import { prisma } from "./lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // ── Google OAuth ───────────────────────────────────────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Always prompt account selection so users can switch accounts
      authorization: { params: { prompt: 'select_account' } },
    }),

    // ── Credentials (email + password) ────────────────────────────────────────
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (!parsed.success) return null

        const { email, password } = parsed.data
        const normalizedEmail = email.toLowerCase().trim()
        const user = await prisma.user.findFirst({
          where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
        })
        if (!user || !user.password) return null

        const passwordsMatch = await bcrypt.compare(password, user.password)
        if (!passwordsMatch) return null
        
        if (!user.emailVerified) {
          throw new Error('Please verify your email address to log in.')
        }

        return user as any
      },
    }),
  ],

  pages: {
    signIn: '/en/login',
  },

  callbacks: {
    // ── Fires on every sign-in attempt ────────────────────────────────────────
    async signIn({ account, profile }) {
      // For Google OAuth: find or create the user in our database
      if (account?.provider === 'google' && profile?.email) {
        const normalizedEmail = profile.email.toLowerCase().trim()
        const existing = await prisma.user.findFirst({
          where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
        })
        if (!existing) {
          await prisma.user.create({
            data: {
              email:         normalizedEmail,
              name:          (profile.name ?? normalizedEmail.split('@')[0]),
              password:      '', // No password for OAuth users
              role:          'CLIENT',
              emailVerified: (profile as any).email_verified ? new Date() : null,
            },
          })
        } else if (!existing.emailVerified && (profile as any).email_verified) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { emailVerified: new Date() }
          })
        }
      }
      return true
    },

    // ── Builds the JWT token — runs on every token verification ──────────────
    async jwt({ token, user, account }) {
      if (user) {
        if ((user as any).id) token.id = (user as any).id
        if ((user as any).role) token.role = (user as any).role
      }

      // Always sync live role and id from database so promotions (e.g. CLIENT -> INSTRUCTOR) take effect immediately!
      const lookupEmail = (token.email || (user as any)?.email) as string | undefined
      const lookupId = (token.id || (user as any)?.id) as string | undefined

      if (lookupId || lookupEmail) {
        const dbUser = await prisma.user.findFirst({
          where: lookupId 
            ? { id: lookupId } 
            : { email: { equals: lookupEmail, mode: 'insensitive' } },
          select: { id: true, role: true, email: true, name: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.email = dbUser.email
          if (dbUser.name) token.name = dbUser.name
        }
      }

      return token
    },

    // ── Exposes custom fields to the client session ───────────────────────────
    async session({ session, token }) {
      if (session.user) {
        session.user.id        = token.id as string
        ;(session.user as any).role = token.role as string
      }
      return session
    },
  },
})
