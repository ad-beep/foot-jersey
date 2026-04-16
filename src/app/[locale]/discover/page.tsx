import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { fetchJerseys } from '@/lib/google-sheets';
import type { Jersey } from '@/types';
import { DiscoverClient } from './client';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isHe = params.locale === 'he';
  const title = isHe ? `גלה חולצות | ${SITE_NAME}` : `Explore Jerseys | ${SITE_NAME}`;
  const description = isHe
    ? 'גלה את כל קולקציית חולצות הכדורגל שלנו — כל הליגות, כל הקולקציות.'
    : 'Browse our full football jersey collection — every league, every season, every style.';
  return {
    title,
    description,
    alternates: {
      canonical: `https://shopfootjersey.com/${params.locale}/discover`,
      languages: {
        en: 'https://shopfootjersey.com/en/discover',
        he: 'https://shopfootjersey.com/he/discover',
      },
    },
  };
}

export default async function DiscoverPage() {
  let initialJerseys: Jersey[] = [];
  try {
    initialJerseys = await fetchJerseys();
  } catch {
    initialJerseys = [];
  }

  return (
    <Suspense>
      <DiscoverClient initialJerseys={initialJerseys} />
    </Suspense>
  );
}
