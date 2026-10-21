import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin-only routes
    const adminRoutes = ['/settings', '/users', '/pricing']
    const isAdminRoute = adminRoutes.some(route => path.startsWith(route))

    if (isAdminRoute && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        
        // Allow public routes
        if (path === '/login' || path === '/forgot-password' || path.startsWith('/api/auth')) {
          return true
        }

        // Require authentication for everything else
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/drivers/:path*',
    '/allocations/:path*',
    '/payments/:path*',
    '/stock/:path*',
    '/pricing/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/users/:path*',
  ],
}