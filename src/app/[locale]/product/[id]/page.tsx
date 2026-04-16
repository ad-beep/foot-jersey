import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchJerseyById, fetchJerseys } from '@/lib/google-sheets';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { getImageUrl } from '@/lib/utils';
import { productSchema, breadcrumbSchema } from '@/lib/schema';
import { AGGREGATE_RATING } from '@/data/reviews';
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
  const imageUrl = jersey.imageUrl ? `${SITE_URL}${getImageUrl(jersey.imageUrl)}` : `${SITE_URL}/opengraph-image`;

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
  const [jersey, allJerseys] = await Promise.all([
    fetchJerseyById(params.id),
    fetchJerseys(),
  ]);
  if (!jersey) notFound();

  const locale = params.locale;
  const productUrl = `${SITE_URL}/${locale}/product/${params.id}`;

  const leagueNamesLd: Record<string, string> = {
    england: 'Premier League', spain: 'La Liga', italy: 'Serie A',
    germany: 'Bundesliga', france: 'Ligue 1', national_teams: 'International', rest_of_world: 'World Football',
  };

  const structuredData = productSchema({
    id: jersey.id,
    name: `${jersey.teamName} ${jersey.season} Jersey`,
    description: `Official ${jersey.teamName} ${jersey.season} football jersey from ${leagueNamesLd[jersey.league] || jersey.league}. Available in S, M, L, XL, XXL. Ships to Israel.`,
    imageUrl: `${SITE_URL}${getImageUrl(jersey.imageUrl)}`,
    additionalImages: jersey.additionalImages?.map((u) => `${SITE_URL}${getImageUrl(u)}`),
    price: jersey.price,
    sku: jersey.id,
    inStock: jersey.availableSizes?.length > 0,
    league: leagueNamesLd[jersey.league] || jersey.league,
    type: jersey.type,
    season: jersey.season,
    brand: jersey.teamName,
    reviewCount: AGGREGATE_RATING.reviewCount,
    ratingValue: AGGREGATE_RATING.ratingValue,
    url: productUrl,
  });

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', href: `${SITE_URL}/${locale}` },
    { name: leagueNamesLd[jersey.league] || jersey.league, href: `${SITE_URL}/${locale}/category/${jersey.league}` },
    { name: `${jersey.teamName} ${jersey.season}`, href: productUrl },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <ProductPageClient productId={params.id} initialJersey={jersey} initialJerseys={allJerseys} />
    </>
  );
}
