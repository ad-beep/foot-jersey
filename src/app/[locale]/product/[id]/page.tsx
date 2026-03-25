import type { Metadata } from 'next';
import { isValidLocale } from '@/i18n/config';
import { fetchJerseyById } from '@/lib/google-sheets';
import { DEFAULT_LOCALE, SITE_NAME, SITE_URL } from '@/lib/constants';
import { getImageUrl } from '@/lib/utils';
import type { Locale } from '@/types';
import { ProductPageClient } from './client';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { locale: string; id: string };
}): Promise<Metadata> {
  const jersey = await fetchJerseyById(params.id);
  if (!jersey) return { title: 'Not Found' };

  const title = `${jersey.teamName} ${jersey.season} Jersey`;
  const description = `Shop the ${jersey.teamName} ${jersey.season} ${jersey.type} football jersey. Starting at ${jersey.price}₪.`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    openGraph: {
      title,
      description,
      images: jersey.imageUrl ? [{ url: `${SITE_URL}${getImageUrl(jersey.imageUrl)}`, width: 800, height: 800 }] : [],
      url: `${SITE_URL}/${params.locale}/product/${params.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: jersey.imageUrl ? [`${SITE_URL}${getImageUrl(jersey.imageUrl)}`] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const jersey = await fetchJerseyById(params.id);

  // Structured data for SEO
  const structuredData = jersey
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `${jersey.teamName} ${jersey.season} Jersey`,
        image: `${SITE_URL}${getImageUrl(jersey.imageUrl)}`,
        description: `${jersey.teamName} ${jersey.season} ${jersey.type} football jersey`,
        offers: {
          '@type': 'Offer',
          price: jersey.price,
          priceCurrency: 'ILS',
          availability: 'https://schema.org/InStock',
        },
        brand: { '@type': 'Brand', name: jersey.teamName },
      }
    : null;

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <ProductPageClient productId={params.id} />
    </>
  );
}
