import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';
import { TrackOrderClient } from './client';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'מעקב הזמנה — FootJersey' : 'Track Your Order — FootJersey',
    description: isHe
      ? 'עקוב אחר ההזמנה שלך ב-FootJersey. הזן מספר הזמנה ואימייל.'
      : 'Track your FootJersey order. Enter your order number and email.',
    alternates: {
      canonical: `${SITE_URL}/${params.locale}/track-order`,
      languages: { en: `${SITE_URL}/en/track-order`, he: `${SITE_URL}/he/track-order` },
    },
  };
}

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
