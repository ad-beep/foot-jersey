import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SUPPORTED_LOCALES } from '@/lib/constants';

// Fallback locale for visitors without Hebrew browser preference.
// DEFAULT_LOCALE in constants is 'he' (primary market), but for international
// visitors without an explicit preference we serve English.
const FALLBACK_LOCALE = 'en';
const LOCALE_COOKIE = 'preferred-locale';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Skip static / system paths ───────────────────────────────────────────
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.svg' ||
    pathname === '/og-default.jpg' ||
    (pathname.includes('.') && !pathname.startsWith('/.'))
  ) {
    return NextResponse.next();
  }

  // ── Already has a valid locale prefix ────────────────────────────────────
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // Persist the locale the user is viewing as a cookie
    const currentLocale = pathname.split('/')[1] as (typeof SUPPORTED_LOCALES)[number];
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, currentLocale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
    });
    return response;
  }

  // ── Detect preferred locale (cookie → Accept-Language → fallback) ────────
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const isValidCookieLocale =
    cookieLocale && (SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale);

  let detectedLocale: string;
  if (isValidCookieLocale) {
    detectedLocale = cookieLocale!;
  } else {
    const acceptLanguage = request.headers.get('accept-language') || '';
    detectedLocale = acceptLanguage.toLowerCase().includes('he') ? 'he' : FALLBACK_LOCALE;
  }

  // ── Redirect to locale-prefixed path ────────────────────────────────────
  const url = request.nextUrl.clone();
  url.pathname = `/${detectedLocale}${pathname === '/' ? '' : pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, detectedLocale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  });
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - api routes
     * - admin panel
     * - _next (Next.js internals)
     * - static files with extensions
     * - favicon.ico / favicon.svg
     */
    '/((?!api|admin|_next/static|_next/image|favicon\\.ico|favicon\\.svg|og-default\\.jpg|images|sitemap\\.xml|robots\\.txt).*)',
  ],
};
