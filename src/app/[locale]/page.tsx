import type { Metadata } from 'next';
import { isValidLocale } from '@/i18n/config';
import { DEFAULT_LOCALE, SITE_URL } from '@/lib/constants';
import { fetchJerseys } from '@/lib/google-sheets';
import HomeClient from './home-client';
import type { Locale, Jersey } from '@/types';

export const revalidate = 300;

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
      canonical: `${SITE_URL}/${params.locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        he: `${SITE_URL}/he`,
      },
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = isValidLocale(params.locale) ? params.locale : DEFAULT_LOCALE;

  let jerseys: Jersey[] = [];
  try {
    jerseys = await fetchJerseys();
  } catch {
    jerseys = [];
  }

  // What's Hot — only drip jerseys, shuffled
  const hotJerseys = jerseys
    .filter((j) => j.type === 'drip')
    .sort(() => Math.random() - 0.5)
    .slice(0, 15);

  return <HomeClient locale={locale} hotJerseys={hotJerseys} />;
}
