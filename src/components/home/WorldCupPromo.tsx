'use client';

import type { Locale } from '@/types';
import type { Dictionary } from '@/i18n/dictionaries';

interface WorldCupPromoProps {
  dict: Dictionary;
  locale: Locale;
}

export function WorldCupPromo({ dict, locale }: WorldCupPromoProps) {
  return <div>WorldCupPromo Placeholder</div>;
}
