import { isValidLocale } from '@/i18n/config';
import { DEFAULT_LOCALE } from '@/lib/constants';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'תנאי שימוש — FootJersey' : 'Terms of Service — FootJersey',
    description: isHe ? 'תנאי השימוש של FootJersey' : 'FootJersey terms of service.',
  };
}

export default async function TermsPage({ params }: { params: { locale: string } }) {
  const locale = isValidLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const isHe = locale === 'he';

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-bold text-white mb-8">
          {isHe ? 'תנאי שימוש' : 'Terms of Service'}
        </h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-6" style={{ color: 'var(--text-secondary)' }}>
          <p>{isHe ? 'עדכון אחרון: מרץ 2026' : 'Last updated: March 2026'}</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'קבלת התנאים' : 'Acceptance of Terms'}</h2>
          <p>{isHe
            ? 'בשימוש באתר shopfootjersey.com, אתה מסכים לתנאי שימוש אלה. אם אינך מסכים, אנא אל תשתמש באתר.'
            : 'By using shopfootjersey.com, you agree to these terms of service. If you do not agree, please do not use the site.'
          }</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'הזמנות ותשלומים' : 'Orders & Payments'}</h2>
          <p>{isHe
            ? 'כל המחירים מוצגים בשקלים חדשים (₪). התשלום מתבצע דרך PayPal. לאחר אישור ההזמנה, היא תעובד ותישלח בהתאם למדיניות המשלוח שלנו.'
            : 'All prices are displayed in Israeli New Shekels (₪). Payment is processed through PayPal. Once an order is confirmed, it will be processed and shipped according to our shipping policy.'
          }</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'משלוח' : 'Shipping'}</h2>
          <p>{isHe
            ? 'משלוח לוקח 2-4 שבועות. עלות משלוח: ₪15. משלוח חינם בהזמנת 3 פריטים ומעלה. אנו לא אחראים לעיכובים הנגרמים על ידי המכס או שירות הדואר.'
            : 'Shipping takes 2-4 weeks. Shipping cost: ₪15. Free shipping on orders of 3+ items. We are not responsible for delays caused by customs or postal services.'
          }</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'דיוק המוצרים' : 'Product Accuracy'}</h2>
          <p>{isHe
            ? 'אנו עושים כמיטב יכולתנו להציג את המוצרים בצורה מדויקת. צבעים עשויים להשתנות מעט בין המסכים השונים.'
            : 'We do our best to display products accurately. Colors may vary slightly between different screens.'
          }</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'הגבלת אחריות' : 'Limitation of Liability'}</h2>
          <p>{isHe
            ? 'FootJersey אינה אחראית לנזקים עקיפים הנובעים משימוש באתר. האחריות שלנו מוגבלת לסכום ההזמנה ששולם.'
            : 'FootJersey is not liable for indirect damages arising from use of the site. Our liability is limited to the order amount paid.'
          }</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'צור קשר' : 'Contact'}</h2>
          <p>{isHe
            ? 'לשאלות, פנו אלינו בוואטסאפ: 058-414-0508'
            : 'For questions, contact us via WhatsApp: 058-414-0508'
          }</p>
        </div>
      </div>
    </div>
  );
}
