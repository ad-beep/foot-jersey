'use client';

import type { Jersey, Locale } from '@/types';
import type { Dictionary } from '@/i18n/dictionaries';

interface TrendingJerseysProps {
  dict: Dictionary;
  locale: Locale;
  jerseys: Jersey[];
}

export function TrendingJerseys({ dict, locale, jerseys }: TrendingJerseysProps) {
  return <div>TrendingJerseys Placeholder</div>;
}
