import type { Locale } from '@/types';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/constants';

export function isValidLocale(locale: string): locale is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export function getLocaleFromPath(pathname: string): Locale {
  const segment = pathname.split('/')[1];
  return isValidLocale(segment) ? segment : DEFAULT_LOCALE;
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'he' ? 'rtl' : 'ltr';
}
