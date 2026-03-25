import type { Locale } from '@/types';

// Dynamic imports for code splitting
const dictionaries = {
  en: () => import('@/i18n/locales/en.json').then((m) => m.default),
  he: () => import('@/i18n/locales/he.json').then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}

// Helper to access nested keys with dot notation
export function t(dict: Record<string, unknown>, key: string): string {
  const keys = key.split('.');
  let value: unknown = dict;
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  return typeof value === 'string' ? value : key;
}
