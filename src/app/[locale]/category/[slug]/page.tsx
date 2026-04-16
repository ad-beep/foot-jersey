import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { CATEGORIES, SPECIAL_SECTIONS, DEFAULT_LOCALE, SITE_NAME, SITE_URL } from '@/lib/constants';
import { fetchJerseys, fetchJerseysByLeague } from '@/lib/google-sheets';
import type { Locale, Jersey } from '@/types';
import { CategoryPageClient } from './client';

export const revalidate = 300;

const CATEGORY_NAMES: Record<string, { en: string; he: string }> = {
  england:        { en: 'Premier League', he: 'פרמייר ליג' },
  spain:          { en: 'LaLiga',         he: 'לה ליגה' },
  italy:          { en: 'Serie A',        he: 'סרייה A' },
  germany:        { en: 'Bundesliga',     he: 'בונדסליגה' },
  france:         { en: 'Ligue 1',        he: 'ליג 1' },
  rest_of_world:  { en: 'Rest of World',  he: 'שאר העולם' },
  national_teams: { en: 'International',  he: 'נבחרות' },
  israeli_league: { en: 'Israeli League', he: 'ליגת העל' },
};

function isKnownSlug(slug: string): boolean {
  return CATEGORIES.some((c) => c.slug === slug) || SPECIAL_SECTIONS.some((s) => s.slug === slug);
}

export function generateStaticParams() {
  const leagueSlugs = CATEGORIES.map((cat) => ({ slug: cat.slug }));
  const sectionSlugs = SPECIAL_SECTIONS.map((s) => ({ slug: s.slug }));
  return [...leagueSlugs, ...sectionSlugs];
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale: Locale = isValidLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const { slug } = params;

  if (!isKnownSlug(slug)) return { title: 'Not Found' };

  const cat = CATEGORIES.find((c) => c.slug === slug);
  const section = SPECIAL_SECTIONS.find((s) => s.slug === slug);
  const names = cat
    ? CATEGORY_NAMES[cat.slug] ?? { en: cat.labelEn, he: cat.labelHe }
    : section
      ? { en: section.labelEn, he: section.labelHe }
      : { en: slug, he: slug };

  const name = locale === 'he' ? names.he : names.en;
  const description = locale === 'he'
    ? `קנו חולצות ${names.he} כדורגל ב-${SITE_NAME}. כל המידות, משלוח לישראל.`
    : `Shop ${names.en} football jerseys at ${SITE_NAME}. All sizes, fast shipping to Israel.`;
  return {
    title: `${name} | ${SITE_NAME}`,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/category/${slug}`,
      languages: {
        en: `${SITE_URL}/en/category/${slug}`,
        he: `${SITE_URL}/he/category/${slug}`,
      },
    },
  };
}

function isLeagueSlug(slug: string): boolean {
  return CATEGORIES.some((c) => c.slug === slug);
}

export default async function CategoryPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isKnownSlug(params.slug)) notFound();

  const { slug } = params;
  let initialJerseys: Jersey[] = [];
  try {
    initialJerseys = isLeagueSlug(slug)
      ? await fetchJerseysByLeague(slug)
      : await fetchJerseys();
  } catch {
    initialJerseys = [];
  }

  return (
    <Suspense>
      <CategoryPageClient slug={slug} initialJerseys={initialJerseys} />
    </Suspense>
  );
}
