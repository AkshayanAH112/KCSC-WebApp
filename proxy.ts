import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

// CORS for the mobile app lives in next.config.ts (static headers), not here:
// Vercel answers OPTIONS preflights at the routing layer before the proxy runs.

const intlMiddleware = createMiddleware({
  locales: ['en', 'ta'],
  defaultLocale: 'en'
});

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next();
  }

  const isPublicFile = pathname.includes('.');
  const isApiOrNext = pathname.startsWith('/api') || pathname.startsWith('/_next');

  if (!isPublicFile && !isApiOrNext) {
    return intlMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
