import type { Metadata } from 'next';
import { isValidLocale } from '@/i18n/config';
import { DEFAULT_LOCALE } from '@/lib/constants';
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
      canonical: `https://shopfootjersey.com/${params.locale}`,
      languages: {
        en: 'https://shopfootjersey.com/en',
        he: 'https://shopfootjersey.com/he',
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

  // Preload the first 2 marquee images so the browser starts the download
  // before client JS finishes parsing (LandingHero is ssr: false).
  // Preload via Next.js built-in image optimizer (CDN edge, AVIF/WebP, cached)
  const preloadImages = jerseys
    .filter((j) => j.imageUrl && j.type === 'special')
    .slice(0, 2)
    .map((j) => `/_next/image?url=${encodeURIComponent(j.imageUrl)}&w=256&q=60`);

  return (
    <>
      {preloadImages.map((href) => (
        <link key={href} rel="preload" as="image" href={href} />
      ))}
      <HomeClient locale={locale} jerseys={jerseys} hotJerseys={hotJerseys} />
    </>
  );
}
