import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/constants';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the pathname starts with a supported locale
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Skip API routes, static files, etc.
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next();
  }

  // Detect locale from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || '';
  const detectedLocale = acceptLanguage.includes('he') ? 'he' : DEFAULT_LOCALE;

  // Redirect to locale-prefixed path
  const url = request.nextUrl.clone();
  url.pathname = `/${detectedLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
