import type { MetadataRoute } from 'next';
import { fetchJerseys } from '@/lib/google-sheets';
import { CATEGORIES, SPECIAL_SECTIONS } from '@/lib/constants';

const SITE_URL = 'https://shopfootjersey.com';

export const revalidate = 3600; // rebuild sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['en', 'he'];

  // Static pages
  const staticPaths = [
    '',
    '/discover',
    '/search',
    '/auth',
    '/favorites',
    '/cart',
    '/profile',
    '/privacy',
    '/terms',
    '/refund',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === '' ? 'daily' : 'weekly',
      priority: path === '' ? 1 : 0.8,
    }))
  );

  // Category pages
  const categoryEntries: MetadataRoute.Sitemap = [
    ...CATEGORIES.map((cat) => cat.slug),
    ...SPECIAL_SECTIONS.map((s) => s.slug),
  ].flatMap((slug) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/category/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  // Product pages
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const jerseys = await fetchJerseys();
    productEntries = jerseys.flatMap((jersey) =>
      locales.map((locale) => ({
        url: `${SITE_URL}/${locale}/product/${jersey.id}`,
        lastModified: new Date(jersey.createdAt || Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    );
  } catch {
    // If sheets unavailable, skip product entries
  }

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
