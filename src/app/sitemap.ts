import type { MetadataRoute } from 'next';
import { fetchJerseys } from '@/lib/google-sheets';
import { CATEGORIES, SPECIAL_SECTIONS } from '@/lib/constants';

const SITE_URL = 'https://shopfootjersey.com';
const locales  = ['en', 'he'] as const;

export const revalidate = 3600; // rebuild sitemap hourly

type Freq = 'daily' | 'weekly' | 'monthly' | 'yearly';

function makeEntries(
  paths: string[],
  opts: { freq?: Freq; priority?: number } = {},
): MetadataRoute.Sitemap {
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: (opts.freq ?? 'weekly') as Freq,
      priority: opts.priority ?? 0.7,
    })),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Homepage ─────────────────────────────────────────────────────────────
  const homeEntries = makeEntries([''], { freq: 'daily', priority: 1 });

  // ── Core navigation pages ────────────────────────────────────────────────
  const coreEntries = makeEntries(
    ['/discover', '/search'],
    { freq: 'daily', priority: 0.9 },
  );

  // ── New trust & SEO pages ────────────────────────────────────────────────
  const trustEntries = makeEntries(
    [
      '/faq',
      '/about',
      '/size-guide',
      '/reviews',
      '/contact',
      '/shipping',
      '/mystery-box',
    ],
    { freq: 'monthly', priority: 0.85 },
  );

  // ── Editorial collection lookbooks ────────────────────────────────────────
  const collectionSlugs = ['retro', 'drip', 'world-cup-2026', 'stussy-edition'];
  const collectionEntries = makeEntries(
    collectionSlugs.map((s) => `/collections/${s}`),
    { freq: 'weekly', priority: 0.8 },
  );

  // ── Legal pages ──────────────────────────────────────────────────────────
  const legalEntries = makeEntries(
    ['/privacy', '/terms', '/refund'],
    { freq: 'yearly', priority: 0.4 },
  );

  // ── Category pages ────────────────────────────────────────────────────────
  const categorySlugs = [
    ...CATEGORIES.map((c) => c.slug),
    ...SPECIAL_SECTIONS.map((s) => s.slug),
  ];
  const categoryEntries = makeEntries(
    categorySlugs.map((s) => `/category/${s}`),
    { freq: 'weekly', priority: 0.7 },
  );

  // ── Product pages ─────────────────────────────────────────────────────────
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const jerseys = await fetchJerseys();
    productEntries = jerseys.flatMap((jersey) =>
      locales.map((locale) => ({
        url: `${SITE_URL}/${locale}/product/${jersey.id}`,
        lastModified: new Date(jersey.createdAt || Date.now()),
        changeFrequency: 'monthly' as Freq,
        priority: 0.6,
      })),
    );
  } catch {
    // If Sheets unavailable, skip product entries gracefully
  }

  return [
    ...homeEntries,
    ...coreEntries,
    ...trustEntries,
    ...collectionEntries,
    ...legalEntries,
    ...categoryEntries,
    ...productEntries,
  ];
}
