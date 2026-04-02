import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { fetchJerseyById } from '@/lib/google-sheets';
import { DEFAULT_LOCALE, SITE_NAME, SITE_URL } from '@/lib/constants';
import { getImageUrl } from '@/lib/utils';
import type { Locale } from '@/types';
import { ProductPageClient } from './client';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { locale: string; id: string };
}): Promise<Metadata> {
  const jersey = await fetchJerseyById(params.id);
  if (!jersey) return { title: 'Not Found' };

  const leagueNames: Record<string, string> = {
    england: 'Premier League',
    spain: 'La Liga',
    italy: 'Serie A',
    germany: 'Bundesliga',
    france: 'Ligue 1',
    national_teams: 'International',
    rest_of_world: 'World Football',
  };
  const leagueName = leagueNames[jersey.league] || jersey.league;
  const jerseyTypeLabel = jersey.type === 'retro' ? 'Retro Classic' : jersey.type === 'special' ? 'Special Edition' : jersey.type === 'drip' ? 'Drip Style' : 'Official';

  const locale = params.locale;
  const isHe = locale === 'he';

  const title = isHe
    ? `חולצת ${jersey.teamName} ${jersey.season}`
    : `${jersey.teamName} ${jersey.season} ${jerseyTypeLabel} Jersey`;
  const description = isHe
    ? `קנו את חולצת ${jersey.teamName} ${jersey.season} מהדורת ${jerseyTypeLabel === 'Retro Classic' ? 'רטרו' : jerseyTypeLabel === 'Special Edition' ? 'מיוחדת' : 'רשמית'} — ${leagueName}. כל המידות ₪${jersey.price}+. משלוח לישראל. הדפסת שם ומספר.`
    : `Buy the ${jersey.teamName} ${jersey.season} ${jerseyTypeLabel.toLowerCase()} football jersey from ${leagueName}. Available in all sizes from ₪${jersey.price}. Fast shipping to Israel. Custom name & number printing available.`;
  const imageUrl = jersey.imageUrl ? `${SITE_URL}${getImageUrl(jersey.imageUrl)}` : `${SITE_URL}/og-image.jpg`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    keywords: [
      `${jersey.teamName} jersey`,
      `${jersey.teamName} ${jersey.season} jersey`,
      `${leagueName} jersey`,
      `football jersey Israel`,
      `buy ${jersey.teamName} jersey`,
      `חולצת ${jersey.teamName}`,
      `חולצות כדורגל`,
    ],
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 800, height: 800, alt: title }],
      url: `${SITE_URL}/${params.locale}/product/${params.id}`,
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/en/product/${params.id}`,
      languages: {
        'en': `${SITE_URL}/en/product/${params.id}`,
        'he': `${SITE_URL}/he/product/${params.id}`,
      },
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const jersey = await fetchJerseyById(params.id);
  if (!jersey) notFound();

  // Structured data for SEO
  const leagueNamesLd: Record<string, string> = {
    england: 'Premier League', spain: 'La Liga', italy: 'Serie A',
    germany: 'Bundesliga', france: 'Ligue 1', national_teams: 'International', rest_of_world: 'World Football',
  };
  const structuredData = jersey
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `${jersey.teamName} ${jersey.season} Jersey`,
        image: jersey.additionalImages?.length
          ? [getImageUrl(jersey.imageUrl), ...jersey.additionalImages.map(getImageUrl)].map((u) => `${SITE_URL}${u}`)
          : [`${SITE_URL}${getImageUrl(jersey.imageUrl)}`],
        description: `Official ${jersey.teamName} ${jersey.season} football jersey from ${leagueNamesLd[jersey.league] || jersey.league}. Available in S, M, L, XL, XXL. Custom name/number printing available.`,
        sku: jersey.id,
        brand: { '@type': 'Brand', name: jersey.teamName },
        category: 'Football Jerseys',
        offers: {
          '@type': 'Offer',
          price: jersey.price,
          priceCurrency: 'ILS',
          availability: jersey.availableSizes?.length > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: { '@type': 'Organization', name: 'FootJersey' },
          url: `${SITE_URL}/${params.locale}/product/${params.id}`,
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingRate: { '@type': 'MonetaryAmount', value: '15', currency: 'ILS' },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
              transitTime: { '@type': 'QuantitativeValue', minValue: 7, maxValue: 14, unitCode: 'DAY' },
            },
          },
        },
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
