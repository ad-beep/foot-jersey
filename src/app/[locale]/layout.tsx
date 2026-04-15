import { Playfair_Display, Inter_Tight, JetBrains_Mono, Heebo } from 'next/font/google';
import dynamic from 'next/dynamic';
import { isValidLocale, getDirection } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { organizationSchema } from '@/lib/schema';
// WhatsApp + StickyMobileCTA are purely interactive — fine to skip SSR
const WhatsAppFloat = dynamic(
  () => import('@/components/layout/WhatsAppFloat').then(m => ({ default: m.WhatsAppFloat })),
  { ssr: false },
);
const StickyMobileCTA = dynamic(
  () => import('@/components/layout/StickyMobileCTA').then(m => ({ default: m.StickyMobileCTA })),
  { ssr: false },
);
import { Dock } from '@/components/layout/Dock';
import { ToastProvider } from '@/components/ui/toast';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Locale } from '@/types';

// Lazy-load heavy components that aren't needed for initial paint
const CartDrawer = dynamic(
  () => import('@/components/cart/CartDrawer').then(m => ({ default: m.CartDrawer })),
  { ssr: false },
);

// ── Editorial font stack ───────────────────────────────────────────────────
const playfair = Playfair_Display({
  subsets:  ['latin'],
  variable: '--font-playfair',
  display:  'swap',
  weight:   ['400', '500', '600', '700', '800', '900'],
  style:    ['normal', 'italic'],
});

const interTight = Inter_Tight({
  subsets:  ['latin'],
  variable: '--font-inter-tight',
  display:  'swap',
  weight:   ['400', '500', '600', '700'],
});

const jetbrains = JetBrains_Mono({
  subsets:  ['latin'],
  variable: '--font-jetbrains',
  display:  'swap',
  weight:   ['400', '500'],
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
      className={`${playfair.variable} ${interTight.variable} ${jetbrains.variable} ${heebo.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* DNS-prefetch for upstream image sources */}
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        {/* Hreflang alternates for bilingual SEO */}
        <link rel="alternate" hrefLang="en" href="https://shopfootjersey.com/en" />
        <link rel="alternate" hrefLang="he" href="https://shopfootjersey.com/he" />
        <link rel="alternate" hrefLang="x-default" href="https://shopfootjersey.com/en" />
        {/* Organization + WebSite + SearchAction schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
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
          <WhatsAppFloat />
          <StickyMobileCTA />
        </ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
