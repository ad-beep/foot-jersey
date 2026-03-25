import { Montserrat, Heebo } from 'next/font/google';
import { isValidLocale, getDirection } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { Header } from '@/components/layout/Header';
import { Dock } from '@/components/layout/Dock';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ToastProvider } from '@/components/ui/toast';
import { PayPalProvider } from '@/components/payment/PayPalProvider';
import { StripeProvider } from '@/components/payment/StripeProvider';
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
            <StripeProvider>
              <Header dict={dict} />
              <main className="min-h-screen pt-16 pb-20">
                {children}
              </main>
              <Dock />
              <CartDrawer dict={dict} />
            </StripeProvider>
          </PayPalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
