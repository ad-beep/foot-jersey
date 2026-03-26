import { isValidLocale } from '@/i18n/config';
import { DEFAULT_LOCALE } from '@/lib/constants';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'מדיניות החזרים — FootJersey' : 'Refund Policy — FootJersey',
    description: isHe ? 'מדיניות ההחזרים וההחלפות של FootJersey' : 'FootJersey refund and exchange policy.',
  };
}

export default async function RefundPage({ params }: { params: { locale: string } }) {
  const locale = isValidLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const isHe = locale === 'he';

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-bold text-white mb-8">
          {isHe ? 'מדיניות החזרים' : 'Refund Policy'}
        </h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-6" style={{ color: 'var(--text-secondary)' }}>
          <p>{isHe ? 'עדכון אחרון: מרץ 2026' : 'Last updated: March 2026'}</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'מוצרים פגומים' : 'Damaged Products'}</h2>
          <p>{isHe
            ? 'אם קיבלת מוצר פגום, אנו נספק לך החלפה חינם. צור איתנו קשר תוך 7 ימים מקבלת ההזמנה עם תמונות של הפגם.'
            : 'If you receive a damaged product, we will provide a free replacement. Contact us within 7 days of receiving your order with photos of the defect.'
          }</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'קופסאות הפתעה' : 'Mystery Boxes'}</h2>
          <p>{isHe
            ? 'קופסאות הפתעה אינן ניתנות להחזרה או להחלפה, למעט במקרה של מוצר פגום.'
            : 'Mystery boxes are non-refundable and non-exchangeable, except in case of a damaged product.'
          }</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'תהליך ההחזר' : 'Refund Process'}</h2>
          <p>{isHe
            ? 'החזרים יעובדו תוך 5-7 ימי עסקים לאחר אישור הבקשה. ההחזר יתבצע לאמצעי התשלום המקורי.'
            : 'Refunds will be processed within 5-7 business days after the request is approved. Refunds are issued to the original payment method.'
          }</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'צור קשר' : 'Contact'}</h2>
          <p>{isHe
            ? 'לבקשות החזר, פנו אלינו בוואטסאפ: 058-414-0508'
            : 'For refund requests, contact us via WhatsApp: 058-414-0508'
          }</p>
        </div>
      </div>
    </div>
  );
}
