'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { Truck } from 'lucide-react';
import { AGGREGATE_RATING } from '@/data/reviews';

const TICKER_EN = 'PREMIER LEAGUE · LA LIGA · SERIE A · BUNDESLIGA · LIGUE 1 · WORLD CUP 2026 · RETRO CLASSICS · DRIP · STUSSY EDITION · MYSTERY BOX · SPECIAL EDITION · ISRAELI LEAGUE · 25/26 SEASON · ';
const TICKER_HE = 'פרמייר ליג · לה ליגה · סרייה A · בונדסליגה · ליג 1 · מונדיאל 2026 · רטרו קלאסיק · דריפ · מהדורת סטוסי · קופסת הפתעה · מהדורה מיוחדת · ליגת העל · עונת 25/26 · ';

export default function LandingHero() {
  const { locale } = useLocale();
  const router = useRouter();
  const isHe = locale === 'he';

  const ticker = isHe ? TICKER_HE : TICKER_EN;

  const goToCollections = () => {
    const el = document.getElementById('collections-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else router.push(`/${locale}/#collections-section`);
  };

  return (
    <section
      className="relative overflow-hidden flex flex-col"
      style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--ink)' }}
    >
      {/* ── Centred hero ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10"
        style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 32%, rgba(200,162,75,0.10) 0%, transparent 70%)' }}
      >
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(200,162,75,0.05) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
          aria-hidden="true"
        />

        {/* Jersey centrepiece */}
        <div
          className="relative z-10 flex flex-col items-center mb-6"
          style={{ opacity: 0, animation: 'heroFadeUp 0.9s ease 0.2s forwards' }}
          aria-hidden="true"
        >
          <div
            className="absolute pointer-events-none"
            style={{ width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,162,75,0.18) 0%, transparent 70%)', filter: 'blur(20px)' }}
          />
          <svg
            viewBox="-130 -100 260 215"
            className="relative z-10"
            style={{
              width: 'clamp(150px, 34vw, 220px)',
              height: 'auto',
              filter: 'drop-shadow(0 6px 30px rgba(200,162,75,0.4)) drop-shadow(0 0 8px rgba(200,162,75,0.2))',
              animation: 'heroFloat 4.5s ease-in-out infinite',
            }}
          >
            <defs>
              <linearGradient id="jBody" x1="0%" y1="0%" x2="85%" y2="100%">
                <stop offset="0%" stopColor="#D4AC50" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#A07828" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#6B4E10" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path
              d="M-28,-88 Q0,-72 28,-88 L72,-82 L124,-50 L112,-8 L62,-16 L62,98 L-62,98 L-62,-16 L-112,-8 L-124,-50 L-72,-82 Z"
              fill="url(#jBody)"
            />
            <path d="M-28,-88 Q0,-72 28,-88" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="-62" y="4" width="124" height="7" fill="rgba(255,255,255,0.09)" rx="1" />
            <text x="0" y="76" textAnchor="middle" fontSize="54" fontWeight="900" letterSpacing="-3" fill="rgba(10,10,11,0.48)" fontFamily="ui-monospace,monospace">10</text>
          </svg>
        </div>

        {/* Kicker */}
        <p
          className="section-kicker mb-3 relative z-10"
          style={{ opacity: 0, animation: 'heroFadeUp 0.5s ease 0.45s forwards' }}
        >
          {isHe ? 'מאז 2023 · ישראל · 18 קולקציות' : 'EST. IL · SINCE 2023 · 18 COLLECTIONS'}
        </p>

        {/* Headline */}
        <h1
          className="font-playfair font-bold text-white mb-4 relative z-10"
          style={{ fontSize: 'clamp(3rem, 13vw, 6rem)', letterSpacing: '-0.045em', lineHeight: 0.9 }}
        >
          <span className="block word-reveal" style={{ animationDelay: '0.5s' }}>
            {isHe ? 'כל חולצה.' : 'Every Kit.'}
          </span>
          <span className="block word-reveal" style={{ animationDelay: '0.66s', color: 'var(--gold)' }}>
            {isHe ? 'כל עידן.' : 'Every Era.'}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-sm md:text-base mb-7 leading-relaxed relative z-10"
          style={{ color: 'var(--muted)', maxWidth: '42ch', opacity: 0, animation: 'heroFadeUp 0.6s ease 0.95s forwards' }}
        >
          {isHe
            ? 'פרמייר ליג, לה ליגה, רטרו, מונדיאל 2026 ועוד — נשלח לכל ישראל.'
            : 'Premier League, La Liga, Retro, World Cup 2026 and more — shipped across Israel.'}
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col gap-3 w-full relative z-10"
          style={{ maxWidth: 300, opacity: 0, animation: 'heroFadeUp 0.6s ease 1.1s forwards' }}
        >
          <Link
            href={`/${locale}/discover`}
            className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 active:scale-[0.97] hover:opacity-90"
            style={{ backgroundColor: 'var(--flare)', color: '#fff', boxShadow: '0 0 32px rgba(255,77,46,0.38)' }}
          >
            {isHe ? 'גלה עוד' : 'Discover more'}
            <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d={isHe ? 'M13 8H3M7 4l-4 4 4 4' : 'M3 8h10M9 4l4 4-4 4'} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <button
            onClick={goToCollections}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-white/[0.07]"
            style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.14)' }}
          >
            {isHe ? 'הקולקציות שלנו' : 'Our Collections'}
          </button>
        </div>

        {/* Trust row */}
        <div
          className={`flex items-center justify-center flex-wrap gap-x-2.5 gap-y-1.5 mt-7 relative z-10 ${isHe ? 'flex-row-reverse' : ''}`}
          style={{ opacity: 0, animation: 'heroFadeUp 0.5s ease 1.25s forwards' }}
        >
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} viewBox="0 0 16 16" className="w-3 h-3" fill="var(--gold)">
                <path d="M8 1l1.9 3.9L14 5.6l-3 2.9.7 4.1L8 10.4l-3.7 2.2.7-4.1-3-2.9 4.1-.7z" />
              </svg>
            ))}
            <span className="font-mono text-[10px] ms-1" style={{ color: 'var(--gold)' }}>{AGGREGATE_RATING.ratingValue}</span>
          </div>
          <span style={{ width: 1, height: 10, backgroundColor: 'var(--border)', display: 'inline-block' }} />
          <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
            {isHe ? 'PayPal · ביט · אשראי' : 'PayPal · BIT · Credit Card'}
          </span>
          <span style={{ width: 1, height: 10, backgroundColor: 'var(--border)', display: 'inline-block' }} />
          <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
            <Truck className="w-2.5 h-2.5 shrink-0" style={{ color: 'rgba(200,162,75,0.65)' }} />
            {isHe ? '2–3 שבועות' : '2–3 weeks'}
          </span>
        </div>
      </div>

      {/* ── Ticker ── */}
      <div
        className="w-full overflow-hidden py-2.5 shrink-0"
        style={{ borderTop: '1px solid rgba(200,162,75,0.12)', backgroundColor: 'rgba(10,10,11,0.95)' }}
        aria-hidden="true"
      >
        <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'tickerScroll 48s linear infinite', direction: 'ltr' }}>
          {[0, 1].map((n) => (
            <span
              key={n}
              className="font-mono uppercase shrink-0"
              style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'rgba(200,162,75,0.42)' }}
            >
              {ticker}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
