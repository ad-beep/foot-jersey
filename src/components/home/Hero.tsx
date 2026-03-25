'use client';

import type { Locale } from '@/types';
import type { Dictionary } from '@/i18n/dictionaries';

interface HeroProps {
  dict: Dictionary;
  locale: Locale;
}

export function Hero({ dict, locale }: HeroProps) {
  return <div>Hero Placeholder</div>;
}
