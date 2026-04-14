'use client';

import { useLocale } from '@/hooks/useLocale';
import { AGGREGATE_RATING } from '@/data/reviews';

// SVG icons — inline, zero deps
const Icons = {
  shield: (
    <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 shrink-0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2L3 5v5c0 4.418 3.134 7.456 7 8 3.866-.544 7-3.582 7-8V5L10 2z" />
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 shrink-0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3h11v10H1zM12 7h3l2 3v3h-5V7z" />
      <circle cx="5" cy="15" r="1.5" />
      <circle cx="15" cy="15" r="1.5" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 shrink-0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4a8 8 0 1 1 0 12" />
      <path d="M4 8V4H0" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0" fill="var(--gold)">
      <path d="M10 1l2.4 5 5.6.8-4 3.9.9 5.5L10 13.6l-4.9 2.6.9-5.5L2 6.8l5.6-.8z" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 shrink-0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 11.5A7.5 7.5 0 1 0 6 17l-3 1 1-3A7.5 7.5 0 0 0 17.5 11.5z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 shrink-0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="9" width="12" height="9" rx="2" />
      <path d="M7 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  ),
};

const ITEMS = {
  en: [
    { icon: Icons.lock,    label: 'PayPal Protected' },
    { icon: Icons.lock,    label: 'BIT Accepted' },
    { icon: Icons.truck,   label: 'Ships All of Israel' },
    { icon: Icons.refresh, label: '30-Day Returns' },
    { icon: Icons.star,    label: `${AGGREGATE_RATING.ratingValue}★ · ${AGGREGATE_RATING.reviewCount}+ Reviews` },
    { icon: Icons.chat,    label: 'WhatsApp · 2h Reply' },
    { icon: Icons.shield,  label: 'Secure Checkout' },
    { icon: Icons.truck,   label: 'Free Ship on 3+ Jerseys' },
  ],
  he: [
    { icon: Icons.lock,    label: 'PayPal מאובטח' },
    { icon: Icons.lock,    label: 'BIT מתקבל' },
    { icon: Icons.truck,   label: 'משלוח לכל ישראל' },
    { icon: Icons.refresh, label: 'החזרה 30 יום' },
    { icon: Icons.star,    label: `${AGGREGATE_RATING.ratingValue}★ · ${AGGREGATE_RATING.reviewCount}+ ביקורות` },
    { icon: Icons.chat,    label: 'WhatsApp · תגובה תוך 2 שעות' },
    { icon: Icons.shield,  label: 'תשלום מאובטח' },
    { icon: Icons.truck,   label: 'משלוח חינם מ-3 חולצות' },
  ],
};

// Separator dot between items
const Dot = () => (
  <span
    className="inline-block w-1 h-1 rounded-full shrink-0 mx-4"
    style={{ backgroundColor: 'rgba(200,162,75,0.3)' }}
    aria-hidden="true"
  />
);

export function TrustBar() {
  const { locale } = useLocale();
  const items = locale === 'he' ? ITEMS.he : ITEMS.en;

  // Duplicate for seamless loop
  const row = [...items, ...items];

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        backgroundColor: 'var(--steel)',
        borderBottom: '1px solid var(--border)',
        borderTop: '1px solid var(--border)',
      }}
      aria-label="Trust signals"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          animation: 'tickerScroll 36s linear infinite',
          direction: 'ltr',
          padding: '10px 0',
        }}
      >
        {row.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 shrink-0"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {item.icon}
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
            >
              {item.label}
            </span>
            <Dot />
          </span>
        ))}
      </div>
    </div>
  );
}
