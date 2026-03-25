'use client';

import type { Jersey, Locale } from '@/types';
import type { Dictionary } from '@/i18n/dictionaries';

interface RetroClassicsProps {
  dict: Dictionary;
  locale: Locale;
  jerseys: Jersey[];
}

export function RetroClassics({ dict, locale, jerseys }: RetroClassicsProps) {
  return <div>RetroClassics Placeholder</div>;
}
