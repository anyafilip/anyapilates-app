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
        const user = await prisma.user.findUnique({ where: { email } })
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
        const existing = await prisma.user.findUnique({ where: { email: profile.email } })
        if (!existing) {
          await prisma.user.create({
            data: {
              email:         profile.email,
              name:          (profile.name ?? profile.email.split('@')[0]),
              password:      '', // No password for OAuth users
              role:          'CLIENT',
              emailVerified: (profile as any).email_verified ? new Date() : null,
            },
          })
        }
      }
      return true
    },

    // ── Builds the JWT token — runs ONCE on sign-in, then token is cached ─────
    async jwt({ token, user, account }) {
      if (user) {
        // Credentials: authorize() returns the full DB user — grab id + role directly
        if ((user as any).id && (user as any).role) {
          token.id   = (user as any).id
          token.role = (user as any).role
        } else if (user.email) {
          // Google OAuth: fetch our DB record by email (was just created in signIn callback)
          const dbUser = await prisma.user.findUnique({
            where:  { email: user.email },
            select: { id: true, role: true },
          })
          if (dbUser) {
            token.id   = dbUser.id
            token.role = dbUser.role
          }
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
