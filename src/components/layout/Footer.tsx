'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { AGGREGATE_RATING } from '@/data/reviews';

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/foot_jersey4',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect width={20} height={20} x={2} y={2} rx={5} />
        <circle cx={12} cy={12} r={5} />
        <circle cx={17.5} cy={6.5} r={1.5} fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@foot.jerseys4',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.53a8.25 8.25 0 0 0 4.83 1.56V6.64a4.84 4.84 0 0 1-1.07.05Z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/972584140508',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    ),
  },
];

export function Footer() {
  const { locale } = useLocale();
  const isHe = locale === 'he';

  const nav = {
    shop: {
      en: 'Shop',
      he: 'חנות',
      links: [
        { en: 'All Jerseys',        he: 'כל החולצות',      href: `/${locale}/discover`           },
        { en: 'Premier League',     he: 'פרמיירליג',        href: `/${locale}/category/england`   },
        { en: 'La Liga',            he: 'לה ליגה',          href: `/${locale}/category/spain`     },
        { en: 'Retro Classics',     he: 'רטרו קלאסיק',     href: `/${locale}/category/retro`     },
        { en: 'World Cup 2026',     he: 'מונדיאל 2026',    href: `/${locale}/category/world-cup-2026` },
        { en: 'Mystery Box',        he: 'Mystery Box',      href: `/${locale}/mystery-box`        },
        { en: 'Kids Jerseys',       he: 'חולצות ילדים',    href: `/${locale}/category/kids`      },
      ],
    },
    info: {
      en: 'Info',
      he: 'מידע',
      links: [
        { en: 'About Us',           he: 'אודות',            href: `/${locale}/about`              },
        { en: 'FAQ',                he: 'שאלות נפוצות',    href: `/${locale}/faq`                },
        { en: 'Shipping',           he: 'משלוח',            href: `/${locale}/shipping`           },
        { en: 'Size Guide',         he: 'מדריך מידות',     href: `/${locale}/size-guide`         },
        { en: 'Reviews',            he: 'ביקורות',          href: `/${locale}/reviews`            },
        { en: 'Contact',            he: 'צור קשר',          href: `/${locale}/contact`            },
      ],
    },
    legal: {
      en: 'Legal',
      he: 'משפטי',
      links: [
        { en: 'Privacy Policy',     he: 'מדיניות פרטיות',  href: `/${locale}/privacy`            },
        { en: 'Terms of Service',   he: 'תנאי שימוש',       href: `/${locale}/terms`              },
        { en: 'Refund Policy',      he: 'מדיניות החזרות',  href: `/${locale}/refund`             },
      ],
    },
  };

  return (
    <footer style={{ backgroundColor: '#050506', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-14 pb-8">

        {/* Top: Brand + nav columns */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-10 mb-12 ${isHe ? 'text-right' : ''}`}>

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className={`flex items-center gap-2 mb-4 ${isHe ? 'flex-row-reverse' : ''}`}>
              <span className="font-playfair font-bold text-white text-xl tracking-tight">
                FootJersey
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] self-end mb-0.5" style={{ color: 'var(--gold)' }}>
                IL
              </span>
            </div>
            <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--muted)', maxWidth: '26ch' }}>
              {isHe
                ? 'חנות חולצות הכדורגל המובילה בישראל. איכות פרמיום, מחירים הוגנים, שירות אמיתי.'
                : "Israel's leading football jersey store. Premium quality, fair prices, real service."}
            </p>

            {/* Rating */}
            <div className={`flex items-center gap-2 mb-5 ${isHe ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" style={{ color: s <= Math.round(AGGREGATE_RATING.ratingValue) ? '#C8A24B' : '#2a2a2d' }}>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
                {AGGREGATE_RATING.ratingValue} ({AGGREGATE_RATING.reviewCount}+)
              </span>
            </div>

            {/* Social links */}
            <div className={`flex items-center gap-3 ${isHe ? 'flex-row-reverse' : ''}`}>
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--muted)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.12)';
                    (e.currentTarget as HTMLElement).style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
                  }}
                  aria-label={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {[nav.shop, nav.info, nav.legal].map((col) => (
            <div key={col.en}>
              <h4
                className="font-mono text-[9px] uppercase tracking-[0.25em] mb-4"
                style={{ color: 'var(--muted)' }}
              >
                {isHe ? col.he : col.en}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs transition-colors duration-200 hover:text-white"
                      style={{ color: 'var(--muted)' }}
                    >
                      {isHe ? link.he : link.en}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment badges + trust row */}
        <div
          className="border-t pt-6 mb-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className={`flex flex-wrap items-center gap-4 mb-4 ${isHe ? 'flex-row-reverse' : ''}`}>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
              {isHe ? 'תשלום מאובטח' : 'Secure Payment'}
            </span>
            {/* PayPal badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg viewBox="0 0 101 32" className="h-4" fill="currentColor" style={{ color: '#003087' }}>
                <path fill="#003087" d="M12.237 2.8H5.207c-.48 0-.89.35-.97.825L1.01 27.475c-.057.332.2.633.535.633H5.64c.48 0 .89-.35.97-.825l.81-5.136c.079-.476.49-.826.97-.826h2.265c4.719 0 7.44-2.283 8.153-6.806.32-1.977.013-3.53-.913-4.617-.999-1.187-2.77-1.815-4.658-1.815v-.282zm.827 6.702c-.391 2.565-2.352 2.565-4.25 2.565h-1.078l.757-4.797c.046-.28.29-.487.573-.487h.494c1.292 0 2.512 0 3.14.737.374.44.489 1.096.364 1.982z"/>
                <path fill="#009cde" d="M35.714 9.405h-4.1c-.284 0-.528.207-.573.487l-1.668 10.57-.166 1.051c-.058.332.198.632.535.632h3.667c.48 0 .89-.35.97-.826l1.669-10.578.168-1.068c.055-.331-.2-.631-.534-.631l-.168.363zm3.43 0h-4.098c-.284 0-.528.207-.573.487l-.094.595-.166 1.051-1.575 9.977-.168 1.068c-.057.332.2.633.535.633h3.667c.48 0 .89-.35.97-.826l1.67-10.578.168-1.068c.055-.331-.2-.631-.535-.631l-.168.292z"/>
              </svg>
              <span className="font-mono text-[9px] text-white" style={{ opacity: 0.7 }}>PayPal</span>
            </div>
            {/* BIT badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                style={{ backgroundColor: '#E94560' }}
              >
                B
              </div>
              <span className="font-mono text-[9px] text-white" style={{ opacity: 0.7 }}>BIT</span>
            </div>
            {/* SSL */}
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>SSL</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className={`flex flex-wrap items-center justify-between gap-4 ${isHe ? 'flex-row-reverse' : ''}`}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            © 2026 FootJersey.{' '}
            {isHe ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em]" style={{ color: 'var(--muted)', opacity: 0.5 }}>
            {isHe
              ? 'מאובטח · אמין · ישראל'
              : 'Secure · Trusted · Israel'}
          </p>
        </div>
      </div>
    </footer>
  );
}
