import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const role = (session?.user as any)?.role

  // ── Protect /admin routes ────────────────────────────────────────────────
  if (pathname.includes('/admin')) {
    if (!session || role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/en/login', req.url))
    }
  }

  // ── Protect /instructor routes ───────────────────────────────────────────
  if (pathname.includes('/instructor')) {
    if (!session || (role !== 'INSTRUCTOR' && role !== 'ADMIN')) {
      return NextResponse.redirect(new URL('/en/login', req.url))
    }
  }

  // ── Protect /account routes ──────────────────────────────────────────────
  if (pathname.includes('/account')) {
    if (!session) {
      return NextResponse.redirect(new URL('/en/login', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  // Run middleware on all app pages but skip static files, API routes, and Next.js internals
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
