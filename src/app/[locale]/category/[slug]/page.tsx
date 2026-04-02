import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { CATEGORIES, SPECIAL_SECTIONS, DEFAULT_LOCALE, SITE_NAME } from '@/lib/constants';
import type { Locale } from '@/types';
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
  };
}

export default function CategoryPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isKnownSlug(params.slug)) notFound();

  return (
    <Suspense>
      <CategoryPageClient slug={params.slug} />
    </Suspense>
  );
}
