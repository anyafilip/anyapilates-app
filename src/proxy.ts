import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Create an Edge-compatible auth instance without Node.js dependencies (Prisma, bcrypt)
const { auth } = NextAuth({
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role as string
      }
      return session
    }
  }
})

export const middleware = auth((req) => {
  const pathname = req.nextUrl.pathname

  const isAccountPage    = pathname.includes('/account')
  const isAdminPage      = pathname.includes('/admin')
  const isInstructorPage = pathname.includes('/instructor')
  const isAuthPage       = pathname.includes('/login') || pathname.includes('/register')
  
  const requiresSessionCheck = isAccountPage || isAdminPage || isInstructorPage || isAuthPage

  if (requiresSessionCheck) {
    const session = req.auth
    const user = session?.user as any
    const isLoggedIn = !!user

    if (!isLoggedIn && !isAuthPage) {
      // Redirect to login, preserving the URL they wanted as callbackUrl
      const loginUrl = new URL('/en/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = user?.role || 'CLIENT'

    if (isAuthPage && isLoggedIn) {
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/en/admin', req.url))
      if (role === 'INSTRUCTOR') return NextResponse.redirect(new URL('/en/instructor', req.url))
      return NextResponse.redirect(new URL('/en', req.url))
    }

    if (isAdminPage && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/en', req.url))
    }

    if (isInstructorPage && role !== 'INSTRUCTOR' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/en', req.url))
    }
  }

  return intlMiddleware(req)
})

export default middleware

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
