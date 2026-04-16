import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { fetchJerseys } from '@/lib/google-sheets';
import type { Jersey } from '@/types';
import { SearchPageClient } from './client';

export async function generateMetadata({
  searchParams,
}: {
  params: { locale: string };
  searchParams: { q?: string };
}): Promise<Metadata> {
  return {
    title: `${searchParams.q ? `Search: ${searchParams.q}` : 'Search'} | ${SITE_NAME}`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage() {
  let initialJerseys: Jersey[] = [];
  try {
    initialJerseys = await fetchJerseys();
  } catch {
    initialJerseys = [];
  }

  return (
    <Suspense>
      <SearchPageClient initialJerseys={initialJerseys} />
    </Suspense>
  );
}
