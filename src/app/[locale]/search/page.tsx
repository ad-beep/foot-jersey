import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
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

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
