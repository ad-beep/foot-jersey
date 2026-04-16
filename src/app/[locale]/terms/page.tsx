import { isValidLocale } from '@/i18n/config';
import { DEFAULT_LOCALE, SITE_URL } from '@/lib/constants';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'תנאי שימוש — FootJersey' : 'Terms of Service — FootJersey',
    description: isHe ? 'תנאי השימוש של FootJersey' : 'FootJersey terms of service.',
    alternates: {
      canonical: `${SITE_URL}/${params.locale}/terms`,
      languages: { en: `${SITE_URL}/en/terms`, he: `${SITE_URL}/he/terms` },
    },
  };
}

export default async function TermsPage({ params }: { params: { locale: string } }) {
  const locale = isValidLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const isHe = locale === 'he';
  const dir = isHe ? 'rtl' : 'ltr';

  const sections = isHe
    ? [
        {
          title: 'קבלת התנאים',
          body: 'בשימוש באתר shopfootjersey.com, אתה מסכים לתנאי שימוש אלה. אם אינך מסכים, אנא אל תשתמש באתר. אנחנו שומרים את הזכות לעדכן תנאים אלה בכל עת.',
        },
        {
          title: 'הזמנות ותשלומים',
          body: 'כל המחירים מוצגים בשקלים חדשים (₪). תשלום מתבצע דרך PayPal או BIT. לאחר אישור הזמנה, היא תעובד ותישלח לפי מדיניות המשלוח שלנו. אנחנו שומרים את הזכות לבטל הזמנות חשודות.',
        },
        {
          title: 'משלוח',
          body: 'משלוח לוקח 2-4 שבועות. עלות: ₪15 ל-1-2 פריטים. משלוח חינם בהזמנת 3 פריטים ומעלה. אנחנו לא אחראים לעיכובים של חברות השילוח, מכס, או גורמים חיצוניים אחרים.',
        },
        {
          title: 'דיוק המוצרים',
          body: 'אנחנו עושים כמיטב יכולתנו להציג מוצרים בצורה מדויקת. צבעים עשויים להשתנות מעט בין מסכים שונים. תמונות המוצרים הן לצורכי המחשה.',
        },
        {
          title: 'הגבלת אחריות',
          body: 'FootJersey אינה אחראית לנזקים עקיפים הנובעים משימוש באתר. האחריות שלנו מוגבלת לסכום ההזמנה ששולם. תנאים אלה כפופים לחוקי מדינת ישראל.',
        },
        {
          title: 'קניין רוחני',
          body: 'כל התוכן באתר — לוגו, תמונות, טקסט ועיצוב — שייך ל-FootJersey. אין להעתיק, להפיץ, או לעשות שימוש מסחרי בתוכן ללא אישור מפורש בכתב.',
        },
      ]
    : [
        {
          title: 'Acceptance of Terms',
          body: 'By using shopfootjersey.com, you agree to these terms of service. If you do not agree, please do not use the site. We reserve the right to update these terms at any time.',
        },
        {
          title: 'Orders & Payments',
          body: 'All prices are displayed in Israeli New Shekels (₪). Payment is processed through PayPal or BIT. Once an order is confirmed, it will be processed and shipped per our shipping policy. We reserve the right to cancel suspicious orders.',
        },
        {
          title: 'Shipping',
          body: 'Shipping takes 2–4 weeks. Cost: ₪15 for 1–2 items. Free shipping on 3+ items. We are not responsible for delays caused by shipping carriers, customs, or other external factors.',
        },
        {
          title: 'Product Accuracy',
          body: 'We do our best to display products accurately. Colors may vary slightly between different screens. Product images are for illustrative purposes.',
        },
        {
          title: 'Limitation of Liability',
          body: 'FootJersey is not liable for indirect damages arising from use of the site. Our liability is limited to the order amount paid. These terms are governed by the laws of Israel.',
        },
        {
          title: 'Intellectual Property',
          body: 'All site content — logo, images, text, and design — belongs to FootJersey. You may not copy, distribute, or make commercial use of any content without explicit written permission.',
        },
      ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }} dir={dir}>

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
        {/* Ghost watermark */}
        <div
          className="absolute pointer-events-none select-none"
          style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 900,
            fontSize: 'clamp(6rem, 20vw, 14rem)',
            color: 'rgba(200,162,75,0.04)',
            letterSpacing: '-0.06em',
            lineHeight: 1,
            top: '50%',
            left: isHe ? 'auto' : '-0.02em',
            right: isHe ? '-0.02em' : 'auto',
            transform: 'translateY(-50%)',
            userSelect: 'none',
          }}
          aria-hidden="true"
        >
          {isHe ? 'תנאים' : 'Terms'}
        </div>

        {/* Gold hairline */}
        <div
          className="absolute bottom-0 pointer-events-none"
          style={{
            left: isHe ? 'auto' : 0,
            right: isHe ? 0 : 'auto',
            width: '35%',
            height: '1px',
            background: isHe
              ? 'linear-gradient(to left, var(--gold), transparent)'
              : 'linear-gradient(to right, var(--gold), transparent)',
          }}
        />

        <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-20 relative">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--gold)' }}
          >
            {isHe ? 'FootJersey · מסמך משפטי' : 'FootJersey · Legal'}
          </p>
          <h1
            className="font-playfair font-bold text-white mb-4"
            style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', letterSpacing: '-0.04em', lineHeight: 0.95 }}
          >
            {isHe ? 'תנאי שימוש' : 'Terms of Service'}
          </h1>
          <span
            className="inline-flex items-center gap-2 font-mono text-[11px] px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: 'rgba(200,162,75,0.08)',
              border: '1px solid rgba(200,162,75,0.18)',
              color: 'rgba(200,162,75,0.7)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--gold)' }}
            />
            {isHe ? 'עדכון אחרון: מרץ 2026' : 'Last updated: March 2026'}
          </span>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="space-y-8">
          {sections.map((s, i) => (
            <div
              key={i}
              className="flex gap-5"
              style={{ flexDirection: isHe ? 'row-reverse' : 'row' }}
            >
              <div
                className="shrink-0 w-px mt-1"
                style={{
                  background: 'linear-gradient(to bottom, rgba(200,162,75,0.6), rgba(200,162,75,0.08))',
                  alignSelf: 'stretch',
                  minHeight: '100%',
                }}
              />
              <div className={isHe ? 'text-right' : ''}>
                <h2
                  className="font-playfair font-bold text-white mb-2"
                  style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', letterSpacing: '-0.02em' }}
                >
                  {s.title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Contact CTA ───────────────────────────────────────────── */}
        <div
          className="mt-14 rounded-2xl p-6 md:p-8"
          style={{
            backgroundColor: 'rgba(200,162,75,0.05)',
            border: '1px solid rgba(200,162,75,0.15)',
          }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: 'var(--gold)' }}>
            {isHe ? 'שאלות?' : 'Questions?'}
          </p>
          <p
            className="font-playfair font-bold text-white mb-1"
            style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', letterSpacing: '-0.02em' }}
          >
            {isHe ? 'אנחנו כאן לעזור' : "We're here to help"}
          </p>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {isHe
              ? 'לשאלות על תנאי השימוש, פנו אלינו ישירות בוואטסאפ.'
              : 'For questions about these terms, contact us directly on WhatsApp.'}
          </p>
          <a
            href="https://wa.me/972584140508"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] px-5 py-3 rounded-xl transition-all duration-200"
            style={{
              backgroundColor: 'rgba(200,162,75,0.12)',
              border: '1px solid rgba(200,162,75,0.35)',
              color: 'var(--gold)',
            }}
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.118 1.528 5.849L.055 23.454a.5.5 0 0 0 .608.608l5.606-1.473A11.957 11.957 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.892 0-3.668-.512-5.193-1.405l-.374-.222-3.878 1.018 1.018-3.878-.222-.374A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            058-414-0508
          </a>
        </div>
      </div>
    </div>
  );
}
