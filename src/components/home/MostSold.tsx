'use client';

import type { Jersey, Locale } from '@/types';
import type { Dictionary } from '@/i18n/dictionaries';

interface MostSoldProps {
  dict: Dictionary;
  locale: Locale;
  jerseys: Jersey[];
}

export function MostSold({ dict, locale, jerseys }: MostSoldProps) {
  return <div>MostSold Placeholder</div>;
}
