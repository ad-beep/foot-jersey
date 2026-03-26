import type { Metadata } from 'next';
import { isValidLocale } from '@/i18n/config';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { fetchJerseys } from '@/lib/google-sheets';
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

  // Select hot jerseys — first 10 shuffled for variety
  const hotJerseys = [...jerseys].sort(() => Math.random() - 0.5).slice(0, 10);

  return <HomeClient locale={locale} jerseys={jerseys} hotJerseys={hotJerseys} />;
}
