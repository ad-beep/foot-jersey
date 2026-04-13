import type { Metadata } from 'next';
import { FAQPageClient } from './faq-client';
import { faqPageSchema } from '@/lib/schema';
import { getFaqsForSchema } from '@/data/faqs';
import type { Locale } from '@/types';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe
      ? 'שאלות נפוצות — FootJersey'
      : 'FAQ — Frequently Asked Questions | FootJersey',
    description: isHe
      ? 'תשובות לשאלות הנפוצות ביותר על FootJersey — משלוח, תשלום, איכות, החזרות ועוד.'
      : 'Answers to the most common questions about FootJersey — shipping, payment, quality, returns, and more.',
    alternates: {
      canonical: `https://shopfootjersey.com/${params.locale}/faq`,
      languages: {
        en: 'https://shopfootjersey.com/en/faq',
        he: 'https://shopfootjersey.com/he/faq',
      },
    },
  };
}

export default function FAQPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'he' ? 'he' : 'en') as Locale;
  const schema = faqPageSchema(
    getFaqsForSchema(locale),
    `https://shopfootjersey.com/${locale}/faq`,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <FAQPageClient locale={locale} />
    </>
  );
}
