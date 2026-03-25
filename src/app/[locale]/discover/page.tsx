import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { DiscoverClient } from './client';

export const metadata: Metadata = { title: `Explore | ${SITE_NAME}` };

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverClient />
    </Suspense>
  );
}
