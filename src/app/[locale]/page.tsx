import type { Metadata } from 'next';
import { isValidLocale } from '@/i18n/config';
import { DEFAULT_LOCALE, MYSTERY_BOX_OPTIONS } from '@/lib/constants';
import HomeClient from './home-client';
import type { Locale, Jersey } from '@/types';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe
      ? 'FootJersey — חולצות כדורגל פרימיום מכל ליגה'
      : 'FootJersey — Premium Football Jerseys from Every League',
    description: isHe
      ? 'קנו חולצות כדורגל פרימיום מהליגות המובילות בעולם. פרמייר ליג, לה ליגה, סרייה A, רטרו, מונדיאל 2026 ועוד. משלוח מהיר לישראל.'
      : 'Shop premium football jerseys from every league worldwide. Premier League, La Liga, Serie A, retro classics, World Cup 2026 and more. Fast shipping to Israel.',
    alternates: {
      canonical: `https://shopfootjersey.com/${params.locale}`,
      languages: { en: '/en', he: '/he' },
    },
  };
}

async function getHotJerseys(): Promise<Jersey[]> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res  = await fetch(`${base}/api/products`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const all: Jersey[] = json.data ?? [];
    const drip = all.filter((j) => j.type === 'drip');
    // Inject mystery box virtual products into hot jerseys
    const mysteryJerseys: Jersey[] = MYSTERY_BOX_OPTIONS.map((box) => ({
      id: box.slug,
      teamName: box.labelEn,
      league: 'rest_of_world' as const,
      season: '',
      type: 'special' as const,
      category: 'mystery-box',
      imageUrl: '',
      additionalImages: [],
      isWorldCup: false,
      internationalTeam: '',
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL'] as const,
      tags: ['mystery-box'],
      isLongSleeve: false,
      createdAt: new Date().toISOString(),
      price: box.price,
      slug: box.slug,
    }));
    const combined = [...drip, ...mysteryJerseys];
    const shuffled = combined.sort(() => Math.random() - 0.5);
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
