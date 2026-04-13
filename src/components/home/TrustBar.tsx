'use client';

import { useLocale } from '@/hooks/useLocale';
import { AGGREGATE_RATING } from '@/data/reviews';

const ITEMS = {
  en: [
    { icon: '🔒', label: 'PayPal Protected' },
    { icon: '📱', label: 'BIT Accepted' },
    { icon: '✈️', label: 'Ships to All Israel' },
    { icon: '↩️', label: '30-Day Returns' },
    { icon: '⭐', label: `${AGGREGATE_RATING.ratingValue} Rating · ${AGGREGATE_RATING.reviewCount}+ Reviews` },
    { icon: '💬', label: 'WhatsApp Support' },
  ],
  he: [
    { icon: '🔒', label: 'PayPal מאובטח' },
    { icon: '📱', label: 'BIT מתקבל' },
    { icon: '✈️', label: 'משלוח לכל ישראל' },
    { icon: '↩️', label: 'החזרה תוך 30 יום' },
    { icon: '⭐', label: `דירוג ${AGGREGATE_RATING.ratingValue} · +${AGGREGATE_RATING.reviewCount} ביקורות` },
    { icon: '💬', label: 'תמיכה ב-WhatsApp' },
  ],
};

export function TrustBar() {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const items = isHe ? ITEMS.he : ITEMS.en;

  return (
    <div
      className="w-full overflow-x-auto scrollbar-hide"
      style={{ backgroundColor: 'var(--steel)', borderBottom: '1px solid var(--border)' }}
    >
      <div
        className="flex items-center min-w-max md:justify-center mx-auto"
        style={{ direction: 'ltr' }} // always LTR for trust bar
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-5 py-3 shrink-0"
            style={{
              borderRight: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span className="text-sm" aria-hidden="true">{item.icon}</span>
            <span
              className="font-mono text-[11px] uppercase tracking-wide whitespace-nowrap"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
