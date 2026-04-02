import { Montserrat, Heebo } from 'next/font/google';
import dynamic from 'next/dynamic';
import { isValidLocale, getDirection } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { Header } from '@/components/layout/Header';
// Footer is below-fold on every page — lazy-load to trim initial JS
const Footer = dynamic(
  () => import('@/components/layout/Footer').then(m => ({ default: m.Footer })),
  { ssr: false },
);
import { Dock } from '@/components/layout/Dock';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { ToastProvider } from '@/components/ui/toast';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Locale } from '@/types';

// Lazy-load heavy components that aren't needed for initial paint
const CartDrawer = dynamic(
  () => import('@/components/cart/CartDrawer').then(m => ({ default: m.CartDrawer })),
  { ssr: false },
);

const montserrat = Montserrat({
  subsets:  ['latin'],
  variable: '--font-montserrat',
  display:  'swap',
  weight:   ['400', '500', '600', '700'],
});

const heebo = Heebo({
  subsets:  ['hebrew'],
  variable: '--font-heebo',
  display:  'swap',
  weight:   ['400', '500', '600', '700'],
});

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'he' }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale: Locale = isValidLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const direction      = getDirection(locale);
  const dict           = await getDictionary(locale);

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${montserrat.variable} ${heebo.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* DNS-prefetch only — all images route through /_next/image (same origin)
            so the browser never opens a direct connection. Hints help Vercel's
            edge on cache-miss upstream fetches. */}
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        {/* next/font inlines fonts at build time — no runtime request to Google Fonts */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://shopfootjersey.com/#organization',
                  name: 'FootJersey',
                  url: 'https://shopfootjersey.com',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://shopfootjersey.com/favicon.svg',
                  },
                  contactPoint: {
                    '@type': 'ContactPoint',
                    contactType: 'customer service',
                    availableLanguage: ['Hebrew', 'English'],
                  },
                  areaServed: 'IL',
                  description: 'Premium football jerseys from every league worldwide, shipped to Israel.',
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://shopfootjersey.com/#website',
                  url: 'https://shopfootjersey.com',
                  name: 'FootJersey',
                  publisher: { '@id': 'https://shopfootjersey.com/#organization' },
                  inLanguage: ['en', 'he'],
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: `https://shopfootjersey.com/${locale}/search?q={search_term_string}`,
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={locale === 'he' ? 'font-heebo' : 'font-sans'}
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}
      >
        <ToastProvider>
          <Header dict={dict} />
          <main className="min-h-screen pt-16 pb-20">
            {children}
          </main>
          <Footer />
          <Dock />
          <CartDrawer dict={dict} />
          <WhatsAppButton />
        </ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
