import { Montserrat, Heebo } from 'next/font/google';
import { isValidLocale, getDirection } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Dock } from '@/components/layout/Dock';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { ToastProvider } from '@/components/ui/toast';
import { PayPalProvider } from '@/components/payment/PayPalProvider';
import type { Locale } from '@/types';

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
      <body
        className={locale === 'he' ? 'font-heebo' : 'font-sans'}
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}
      >
        <ToastProvider>
          <PayPalProvider>
            <Header dict={dict} />
            <main className="min-h-screen pt-16 pb-20">
              {children}
            </main>
            <Footer />
            <Dock />
            <CartDrawer dict={dict} />
            <WhatsAppButton />
          </PayPalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
