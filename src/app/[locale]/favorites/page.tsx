import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { fetchJerseys } from '@/lib/google-sheets';
import type { Jersey } from '@/types';
import FavoritesClient from './client';

export const metadata: Metadata = {
  title: `Liked Jerseys | ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  let allJerseys: Jersey[] = [];
  try {
    allJerseys = await fetchJerseys();
  } catch {
    allJerseys = [];
  }

  return <FavoritesClient allJerseys={allJerseys} />;
}
