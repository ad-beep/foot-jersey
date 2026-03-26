import { getDictionary } from '@/i18n/dictionaries';
import { isValidLocale } from '@/i18n/config';
import { DEFAULT_LOCALE } from '@/lib/constants';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'מדיניות פרטיות — FootJersey' : 'Privacy Policy — FootJersey',
    description: isHe ? 'מדיניות הפרטיות של FootJersey' : 'FootJersey privacy policy — how we handle your data.',
  };
}

export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  const locale = isValidLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const isHe = locale === 'he';

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-bold text-white mb-8">
          {isHe ? 'מדיניות פרטיות' : 'Privacy Policy'}
        </h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-6" style={{ color: 'var(--text-secondary)' }}>
          <p>{isHe ? 'עדכון אחרון: מרץ 2026' : 'Last updated: March 2026'}</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'מידע שאנו אוספים' : 'Information We Collect'}</h2>
          <p>{isHe
            ? 'אנו אוספים מידע שאתה מספק לנו ישירות בעת ביצוע הזמנה: שם, כתובת דוא"ל, מספר טלפון, כתובת למשלוח וכתובת לחיוב. אנו אוספים גם נתוני שימוש אנונימיים כדי לשפר את האתר.'
            : 'We collect information you provide directly when placing an order: name, email address, phone number, shipping address, and billing address. We also collect anonymous usage data to improve the site.'
          }</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'כיצד אנו משתמשים במידע' : 'How We Use Information'}</h2>
          <p>{isHe
            ? 'אנו משתמשים במידע שלך כדי: לעבד ולמלא הזמנות, לתקשר איתך לגבי ההזמנה שלך, לשפר את השירותים שלנו ולשלוח עדכונים על מוצרים חדשים (רק אם הסכמת).'
            : 'We use your information to: process and fulfill orders, communicate with you about your order, improve our services, and send updates about new products (only if you opted in).'
          }</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'אבטחת מידע' : 'Data Security'}</h2>
          <p>{isHe
            ? 'אנו מיישמים אמצעי אבטחה סטנדרטיים בתעשייה כדי להגן על המידע האישי שלך. תשלומים מעובדים באופן מאובטח דרך PayPal ואנחנו לא שומרים פרטי כרטיס אשראי.'
            : 'We implement industry-standard security measures to protect your personal information. Payments are securely processed through PayPal and we do not store credit card details.'
          }</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'עוגיות' : 'Cookies'}</h2>
          <p>{isHe
            ? 'אנו משתמשים בעוגיות חיוניות לתפקוד האתר (עגלת קניות, העדפות שפה). אין לנו עוגיות מעקב של צד שלישי.'
            : 'We use essential cookies for site functionality (shopping cart, language preferences). We do not use third-party tracking cookies.'
          }</p>

          <h2 className="text-lg font-semibold text-white">{isHe ? 'צור קשר' : 'Contact Us'}</h2>
          <p>{isHe
            ? 'לשאלות בנושא פרטיות, פנו אלינו בוואטסאפ: 058-414-0508'
            : 'For privacy questions, contact us via WhatsApp: 058-414-0508'
          }</p>
        </div>
      </div>
    </div>
  );
}
