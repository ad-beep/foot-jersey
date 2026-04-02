'use client';

import { RefreshCw, Truck, MessageCircle, Shield } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import CountUp from '@/components/ui/CountUp';
import { useLocale } from '@/hooks/useLocale';

// ── Stats ──────────────────────────────────────────────────────────────────
const STATS = [
  { end: 999, suffix: '+', en: 'Jerseys We Sell',  he: 'חולצות שאנחנו מוכרים' },
  { end: 999, suffix: '+', en: 'Orders Delivered', he: 'הזמנות שנשלחו' },
  { end: 999, suffix: '+', en: 'Happy Customers',  he: 'לקוחות מרוצים' },
];

// ── Guarantee cards ────────────────────────────────────────────────────────
const GUARANTEES = [
  {
    icon: RefreshCw,
    en: 'Free Replacement',
    he: 'החלפה חינם',
    descEn: 'Damaged product? We\'ll replace it free',
    descHe: 'מוצר פגום? נחליף בחינם',
  },
  {
    icon: Truck,
    en: 'Free Shipping on 3+',
    he: 'משלוח חינם מ-3',
    descEn: 'Order 3+ jerseys for free delivery',
    descHe: 'הזמן 3+ חולצות למשלוח חינם',
  },
  {
    icon: MessageCircle,
    en: '24/7 Support',
    he: 'תמיכה 24/7',
    descEn: 'We\'re always here to help',
    descHe: 'אנחנו תמיד כאן בשבילך',
  },
  {
    icon: Shield,
    en: 'Secure Payment',
    he: 'תשלום מאובטח',
    descEn: 'Your payment info is safe with us',
    descHe: 'פרטי התשלום שלך מוגנים',
  },
];

// ── Social links ───────────────────────────────────────────────────────────
const SOCIALS = [
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@foot.jerseys4',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.53a8.25 8.25 0 0 0 4.83 1.56V6.64a4.84 4.84 0 0 1-1.07.05Z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/foot_jersey4',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect width={20} height={20} x={2} y={2} rx={5} />
        <circle cx={12} cy={12} r={5} />
        <circle cx={17.5} cy={6.5} r={1.5} fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/972584140508',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    ),
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export function AboutUs() {
  const { locale } = useLocale();
  const isHe = locale === 'he';

  return (
    <section
      id="about-us"
      className="snap-start flex flex-col justify-center py-16 md:py-24"
      style={{
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 w-full">
        {/* Section header */}
        <Reveal>
          <h2
            className="font-bold text-white text-3xl md:text-4xl text-center mb-10"
            style={{ letterSpacing: '-0.02em' }}
          >
            {isHe ? '?למה FootJersey' : 'Why FootJersey?'}
          </h2>
        </Reveal>

        {/* Stat counters */}
        <Reveal delay={100}>
          <div className="flex justify-center gap-8 md:gap-16 mb-14">
            {STATS.map((stat) => (
              <div key={stat.en} className="flex flex-col items-center text-center">
                <span
                  className="font-bold text-4xl md:text-5xl"
                  style={{ color: 'var(--accent)' }}
                >
                  <CountUp end={stat.end} suffix={stat.suffix} />
                </span>
                <span className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {isHe ? stat.he : stat.en}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Happy customers gallery */}
        <Reveal delay={200}>
          <div className="mb-14">
            <p
              className="text-center text-sm font-medium mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isHe ? 'הלקוחות שלנו אוהבים את זה' : 'Our customers love it'}
            </p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 justify-center">
              {/* Add customer screenshot images here as:
                  <img src="/customers/1.jpg" alt="Happy customer" className="w-48 md:w-56 rounded-xl object-cover aspect-[9/16] shrink-0" />
              */}
            </div>
          </div>
        </Reveal>

        {/* Guarantee cards — 2x2 grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-12 max-w-2xl mx-auto">
          {GUARANTEES.map((g, i) => {
            const Icon = g.icon;
            return (
              <Reveal key={g.en} delay={150 + i * 50}>
                <div
                  className="flex flex-col gap-3 p-5 md:p-6 rounded-xl"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {isHe ? g.he : g.en}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {isHe ? g.descHe : g.descEn}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Social links */}
        <Reveal delay={400}>
          <div className="flex items-center justify-center gap-4">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }}
                aria-label={s.label}
              >
                {s.svg}
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
