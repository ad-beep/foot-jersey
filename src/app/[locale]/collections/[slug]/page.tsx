import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCollection, COLLECTIONS } from '@/data/collections';
import { SITE_URL } from '@/lib/constants';

export async function generateStaticParams() {
  return COLLECTIONS.flatMap((col) => [
    { locale: 'en', slug: col.slug },
    { locale: 'he', slug: col.slug },
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const col = getCollection(params.slug);
  if (!col) return { title: 'Not Found' };
  const isHe = params.locale === 'he';
  const c = isHe ? col.he : col.en;
  return {
    title: `${c.name} — FootJersey`,
    description: c.description,
    alternates: {
      canonical: `${SITE_URL}/${params.locale}/collections/${params.slug}`,
      languages: {
        en: `${SITE_URL}/en/collections/${params.slug}`,
        he: `${SITE_URL}/he/collections/${params.slug}`,
      },
    },
  };
}

export default function CollectionPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const col = getCollection(params.slug);
  if (!col) notFound();
  redirect(`/${params.locale}/discover?collections=${col!.categorySlug}`);
}
