'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { Locale } from '@/types';
import { LOCALES } from '@/lib/constants';

export function useLocale() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const locale = (params.locale as Locale) || 'en';
  const config = LOCALES[locale];

  const switchLocale = useCallback(
    (newLocale: Locale) => {
      const segments = pathname.split('/');
      segments[1] = newLocale;
      router.push(segments.join('/'));
    },
    [pathname, router]
  );

  return {
    locale,
    direction: config.direction,
    isRtl: config.direction === 'rtl',
    fontClass: config.fontClass,
    switchLocale,
    config,
  };
}
