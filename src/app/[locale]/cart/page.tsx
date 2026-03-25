import type { Metadata } from 'next';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { DEFAULT_LOCALE, SITE_NAME } from '@/lib/constants';
import type { Locale } from '@/types';
import { CartPageClient } from './client';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale: Locale = isValidLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const dict = await getDictionary(locale);

  return {
    title: `${dict.cart.title} | ${SITE_NAME}`,
  };
}

export default function CartPage() {
  return <CartPageClient />;
}
