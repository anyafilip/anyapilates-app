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

  // Get locale from cookie or fallback to default
  const locale = req.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale

  if (requiresSessionCheck) {
    const session = req.auth
    const user = session?.user as any
    const isLoggedIn = !!user

    if (!isLoggedIn && !isAuthPage) {
      // Redirect to login, preserving the URL they wanted as callbackUrl
      const loginUrl = new URL(`/${locale}/login`, req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = user?.role || 'CLIENT'

    if (isAuthPage && isLoggedIn) {
      if (role === 'ADMIN') return NextResponse.redirect(new URL(`/${locale}/admin`, req.url))
      if (role === 'INSTRUCTOR') return NextResponse.redirect(new URL(`/${locale}/instructor`, req.url))
      return NextResponse.redirect(new URL(`/${locale}`, req.url))
    }

    if (isAdminPage && role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${locale}`, req.url))
    }

    if (isInstructorPage && role !== 'INSTRUCTOR' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${locale}`, req.url))
    }
  }

  return intlMiddleware(req)
})

export default middleware

export const config = {
  // Skip all paths that contain a dot (static files like .jpg, .png, .ico, etc)
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
