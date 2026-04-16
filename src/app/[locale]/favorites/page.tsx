import type { Metadata } from 'next';
import { fetchJerseys } from '@/lib/google-sheets';
import type { Jersey } from '@/types';
import FavoritesClient from './client';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'חולצות שאהבתי — FootJersey' : 'Liked Jerseys — FootJersey',
    robots: { index: false, follow: false },
  };
}

export default async function FavoritesPage({ params: _params }: { params: { locale: string } }) {
  let allJerseys: Jersey[] = [];
  try {
    allJerseys = await fetchJerseys();
  } catch {
    allJerseys = [];
  }

  return <FavoritesClient allJerseys={allJerseys} />;
}
