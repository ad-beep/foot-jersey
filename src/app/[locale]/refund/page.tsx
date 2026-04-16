import { isValidLocale } from '@/i18n/config';
import { DEFAULT_LOCALE, SITE_URL } from '@/lib/constants';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'מדיניות מוצרים פגומים — FootJersey' : 'Damage Replacement Policy — FootJersey',
    description: isHe ? 'מדיניות ההחלפה של FootJersey — החלפה חינמית למוצרים פגומים או שגויים.' : 'FootJersey replacement policy — free replacement for damaged or incorrect items.',
    alternates: {
      canonical: `${SITE_URL}/${params.locale}/refund`,
      languages: { en: `${SITE_URL}/en/refund`, he: `${SITE_URL}/he/refund` },
    },
  };
}

export default async function RefundPage({ params }: { params: { locale: string } }) {
  const locale = isValidLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const isHe = locale === 'he';
  const dir = isHe ? 'rtl' : 'ltr';

  const sections = isHe
    ? [
        {
          title: 'מה אנחנו מכסים',
          body: 'אנחנו מחליפים מוצרים פגומים, שגויים, או שאינם תואמים להזמנה — בחינם, ללא שאלות. אין מדיניות החזרה כללית; ההחלפה מוגבלת למקרים של פגם או שגיאה בלבד.',
        },
        {
          title: 'כיצד לתבוע החלפה',
          body: 'שלח לנו תמונה ברורה של המוצר הפגום ב-WhatsApp עם מספר ההזמנה שלך. נאשר את הבקשה ונשלח החלפה חינמית בהקדם. ללא טפסים, ללא עלויות נסתרות.',
        },
        {
          title: 'קופסאות הפתעה',
          body: 'קופסאות הפתעה אינן ניתנות להחלפה, למעט במקרה שהחולצה שקיבלת פגומה. הבחירה האקראית היא חלק מהחוויה.',
        },
        {
          title: 'חולצות מותאמות אישית',
          body: 'חולצות עם הדפסה אישית (שם, מספר, טלאי) אינן ניתנות להחלפה, למעט במקרה של פגם בייצור. ההדפסה מותאמת במיוחד עבורך.',
        },
      ]
    : [
        {
          title: 'What we cover',
          body: 'We replace items that arrive damaged, defective, or incorrect — for free, no questions asked. There is no general return policy; replacements are limited to damage or fulfillment errors only.',
        },
        {
          title: 'How to claim a replacement',
          body: 'Send us a clear photo of the damaged item on WhatsApp with your order number. We\'ll confirm the request and ship a free replacement as soon as possible. No forms, no hidden costs.',
        },
        {
          title: 'Mystery Boxes',
          body: 'Mystery Boxes are non-exchangeable, except when the jersey received is damaged. The random selection is intentional and part of the experience.',
        },
        {
          title: 'Customized Jerseys',
          body: 'Jerseys with custom printing (name, number, patch) are non-exchangeable, except in the case of a manufacturing defect. The print is made specifically for you.',
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
            fontSize: 'clamp(5rem, 18vw, 12rem)',
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
          {isHe ? 'החלפות' : 'Replacements'}
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
            {isHe ? 'מדיניות מוצרים פגומים' : 'Damage Replacement Policy'}
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

      {/* ── Guarantee banner ────────────────────────────────────────── */}
      <div
        className="border-b"
        style={{ borderColor: 'var(--border)', backgroundColor: 'rgba(200,162,75,0.04)' }}
      >
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-5">
          <div className={`flex items-center gap-4 ${isHe ? 'flex-row-reverse' : ''}`}>
            <div
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(200,162,75,0.12)', border: '1px solid rgba(200,162,75,0.25)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: 'var(--gold)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
              <strong className="text-white font-semibold">
                {isHe ? 'ערבות אפס סיכון — ' : 'Zero-risk guarantee — '}
              </strong>
              {isHe
                ? 'אם משהו לא בסדר עם ההזמנה שלך, אנחנו נטפל בזה. תמיד.'
                : "If anything is wrong with your order, we'll make it right. Always."}
            </p>
          </div>
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
            {isHe ? 'קיבלת מוצר פגום?' : 'Received a damaged item?'}
          </p>
          <p
            className="font-playfair font-bold text-white mb-1"
            style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', letterSpacing: '-0.02em' }}
          >
            {isHe ? 'שלח תמונה — נשלח החלפה' : 'Send a photo — we ship a replacement'}
          </p>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {isHe
              ? 'שלח לנו תמונה ב-WhatsApp עם מספר ההזמנה שלך ונטפל בהחלפה מיידית.'
              : "Send us a photo on WhatsApp with your order number and we'll arrange a free replacement immediately."}
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
