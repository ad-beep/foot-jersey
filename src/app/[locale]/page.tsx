import { isValidLocale } from '@/i18n/config';
import { DEFAULT_LOCALE } from '@/lib/constants';
import HomeClient from './home-client';
import type { Locale, Jersey } from '@/types';

export const revalidate = 3600;

async function getHotJerseys(): Promise<Jersey[]> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res  = await fetch(`${base}/api/products`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const all: Jersey[] = json.data ?? [];
    const drip = all.filter((j) => j.type === 'drip');
    const shuffled = drip.sort(() => Math.random() - 0.5);
    return shuffled;
  } catch {
    return [];
  }
}

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = isValidLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const hotJerseys = await getHotJerseys();

  return <HomeClient locale={locale} hotJerseys={hotJerseys} />;
}
