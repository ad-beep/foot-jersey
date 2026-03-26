import { Montserrat, Heebo } from 'next/font/google';
import dynamic from 'next/dynamic';
import { isValidLocale, getDirection } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Dock } from '@/components/layout/Dock';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { ToastProvider } from '@/components/ui/toast';
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
        <link rel="preconnect" href="https://photo.yupoo.com" />
        <link rel="dns-prefetch" href="https://photo.yupoo.com" />
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
      </body>
    </html>
  );
}
