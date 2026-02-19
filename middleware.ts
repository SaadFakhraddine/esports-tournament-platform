import { auth } from '@/server/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Define protected routes
  const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard')

  // Redirect to login if accessing protected route while not logged in
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing auth pages while logged in
  const isAuthPage = nextUrl.pathname === '/login' || nextUrl.pathname === '/register'
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
  }

  return NextResponse.next()
})

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (they have their own protection)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
