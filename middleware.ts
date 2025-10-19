import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin role definitions
const ADMIN_ROLES = new Set(['school_admin', 'district_admin']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  try {
    // Check for session and role (adapt to your auth pattern)
    const sessionCookie = request.cookies.get('sb-access-token')?.value;
    const roleCookie = request.cookies.get('user-role')?.value;
    const orgCookie = request.cookies.get('user-org')?.value;

    // If no session, redirect to login
    if (!sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('redirect', pathname);
      url.searchParams.set('error', 'authentication_required');
      return NextResponse.redirect(url);
    }

    // If role not admin, deny access
    if (!roleCookie || !ADMIN_ROLES.has(roleCookie)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('error', 'admin_access_required');
      return NextResponse.redirect(url);
    }

    // Add headers for downstream components
    const response = NextResponse.next();
    response.headers.set('x-user-role', roleCookie);
    response.headers.set('x-user-org', orgCookie || '');
    
    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Fallback: redirect to home on any error
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('error', 'middleware_error');
    return NextResponse.redirect(url);
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/admin/:path*'
  ],
};