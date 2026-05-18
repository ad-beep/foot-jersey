'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { Search, Truck } from 'lucide-react';
import { AGGREGATE_RATING } from '@/data/reviews';

const TICKER_EN = 'PREMIER LEAGUE · LA LIGA · SERIE A · BUNDESLIGA · LIGUE 1 · WORLD CUP 2026 · RETRO CLASSICS · DRIP · STUSSY EDITION · MYSTERY BOX · SPECIAL EDITION · ISRAELI LEAGUE · 25/26 SEASON · ';
const TICKER_HE = 'פרמייר ליג · לה ליגה · סרייה A · בונדסליגה · ליג 1 · מונדיאל 2026 · רטרו קלאסיק · דריפ · מהדורת סטוסי · קופסת הפתעה · מהדורה מיוחדת · ליגת העל · עונת 25/26 · ';

const QUICK_LINKS_EN = [
  { label: 'World Cup', slug: 'world-cup' },
  { label: '25/26', slug: 'season-2526' },
  { label: 'Retro', slug: 'retro' },
  { label: 'Premier League', slug: 'england' },
];
const QUICK_LINKS_HE = [
  { label: 'מונדיאל', slug: 'world-cup' },
  { label: '25/26', slug: 'season-2526' },
  { label: 'רטרו', slug: 'retro' },
  { label: 'פרמייר ליג', slug: 'england' },
];

export default function LandingHero() {
  const { locale, isRtl } = useLocale();
  const router = useRouter();
  const isHe = locale === 'he';

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/${locale}/discover?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setQuery('');
  };

  const ticker = isHe ? TICKER_HE : TICKER_EN;
  const quickLinks = isHe ? QUICK_LINKS_HE : QUICK_LINKS_EN;

  return (
    <section
      className="relative overflow-hidden flex flex-col"
      style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--ink)' }}
    >
      {/*
       * Layout:
       * Mobile  → flex-col: jersey visual TOP (38vh), text panel BELOW (flex-1)
       * Desktop → flex-row: same visual LEFT/RIGHT, text takes 58% width
       */}
      <div className={`flex flex-col flex-1 ${isHe ? 'md:flex-row' : 'md:flex-row-reverse'}`}>

        {/* ── Visual panel — visible on BOTH mobile and desktop ── */}
        <div
          className="relative flex items-center justify-center overflow-hidden h-[38vh] md:h-auto md:w-[42%] shrink-0 md:shrink"
          style={{
            backgroundColor: 'var(--ink)',
            backgroundImage: 'radial-gradient(ellipse 90% 80% at 50% 55%, rgba(200,162,75,0.1) 0%, transparent 68%)',
          }}
        >

          {/* Gold hairline separator — desktop only, text-facing edge */}
          <div
            className="absolute top-[15%] bottom-[15%] w-px hidden md:block pointer-events-none"
            style={{
              ...(isHe ? { right: 0 } : { left: 0 }),
              background: 'linear-gradient(to bottom, transparent 0%, rgba(200,162,75,0.32) 50%, transparent 100%)',
            }}
            aria-hidden="true"
          />

          {/* Football pitch center-circle texture */}
          <div className="absolute pointer-events-none" style={{ width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(200,162,75,0.07)' }} aria-hidden="true" />
          <div className="absolute pointer-events-none" style={{ width: 190, height: 190, borderRadius: '50%', border: '1px solid rgba(200,162,75,0.05)' }} aria-hidden="true" />

          {/* Jersey centrepiece */}
          <div
            className="relative z-10 flex flex-col items-center justify-center"
            style={{ opacity: 0, animation: 'heroFadeUp 0.9s ease 0.4s forwards' }}
            aria-hidden="true"
          >
            {/* Gold spotlight glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(200,162,75,0.2) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* Jersey SVG */}
            <svg
              viewBox="-130 -100 260 215"
              className="relative z-10"
              style={{
                width: 'clamp(155px, 36vw, 230px)',
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
                <linearGradient id="jLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.13)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>

              {/* Full jersey — left sleeve, body, right sleeve in one path */}
              <path
                d="M-28,-88 Q0,-72 28,-88 L72,-82 L124,-50 L112,-8 L62,-16 L62,98 L-62,98 L-62,-16 L-112,-8 L-124,-50 L-72,-82 Z"
                fill="url(#jBody)"
              />

              {/* Left-side depth highlight */}
              <path
                d="M-28,-88 L-72,-82 L-124,-50 L-112,-8 L-62,-16 L-62,20 L-18,20 L-18,-16 L-55,-16 Z"
                fill="url(#jLeft)"
              />

              {/* V-collar */}
              <path d="M-28,-88 Q0,-72 28,-88" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />

              {/* Chest accent stripe */}
              <rect x="-62" y="4" width="124" height="7" fill="rgba(255,255,255,0.09)" rx="1" />

              {/* Seam lines */}
              <path d="M-62,-16 L-62,-90" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" fill="none" />
              <path d="M62,-16 L62,-90" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" fill="none" />

              {/* Back number 10 */}
              <text
                x="0" y="76"
                textAnchor="middle"
                fontSize="54"
                fontWeight="900"
                letterSpacing="-3"
                fill="rgba(10,10,11,0.48)"
                fontFamily="ui-monospace,monospace"
              >
                10
              </text>
            </svg>

            {/* Micro-label below jersey */}
            <span
              className="font-mono uppercase mt-3"
              style={{ fontSize: '9px', letterSpacing: '0.38em', color: 'rgba(200,162,75,0.48)' }}
            >
              SEASON 25/26
            </span>
          </div>

          {/* Desktop "VOL. 01" vertical label */}
          <div
            className="absolute top-1/2 -translate-y-1/2 hidden md:block pointer-events-none"
            style={{
              ...(isHe ? { left: '18px' } : { right: '18px' }),
              writingMode: 'vertical-rl',
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.3em',
              color: 'rgba(200,162,75,0.32)',
              textTransform: 'uppercase',
            }}
            aria-hidden="true"
          >
            VOL. 01 / 2026
          </div>
        </div>

        {/* ── Text panel ── */}
        <div
          className="relative flex flex-col justify-center px-6 md:px-12 lg:px-20 py-7 md:py-0 flex-1 md:flex-none md:w-[58%]"
          style={{ backgroundColor: 'var(--ink)' }}
        >
          {/* Gold hairline top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              ...(isHe ? { right: 0 } : { left: 0 }),
              width: '42%',
              height: '2px',
              background: isHe
                ? 'linear-gradient(to left, var(--gold), transparent)'
                : 'linear-gradient(to right, var(--gold), transparent)',
              transformOrigin: isHe ? 'right center' : 'left center',
              animation: 'hairlineIn 1.2s cubic-bezier(0.22,1,0.36,1) 0.3s both',
            }}
          />

          {/* Dot grid texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(200,162,75,0.055) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
            aria-hidden="true"
          />

          <div className={`relative z-10 ${isHe ? 'text-right' : ''}`}>
            {/* Kicker */}
            <p
              className="section-kicker mb-4"
              style={{ opacity: 0, animation: 'heroFadeUp 0.5s ease 0.5s forwards' }}
            >
              {isHe ? 'מאז 2023 · ישראל · 18 קולקציות' : 'EST. IL · SINCE 2023 · 18 COLLECTIONS'}
            </p>

            {/* Headline */}
            <h1
              className="font-playfair font-bold text-white mb-4"
              style={{
                fontSize: 'clamp(3.4rem, 12vw, 7rem)',
                letterSpacing: '-0.045em',
                lineHeight: 0.88,
              }}
            >
              <span className="block word-reveal" style={{ animationDelay: '0.55s' }}>
                {isHe ? 'כל' : 'Wear'}
              </span>
              <span className="block word-reveal" style={{ animationDelay: '0.72s' }}>
                {isHe ? 'חולצה' : 'Every'}
              </span>
              <span className="block word-reveal" style={{ animationDelay: '0.89s', color: 'var(--gold)' }}>
                {isHe ? 'מספרת.' : 'Story.'}
              </span>
            </h1>

            {/* Quick collection pills */}
            <div
              className={`flex flex-wrap gap-1.5 mb-4 ${isHe ? 'flex-row-reverse' : ''}`}
              style={{ opacity: 0, animation: 'heroFadeUp 0.5s ease 1s forwards' }}
            >
              {quickLinks.map((link) => (
                <Link
                  key={link.slug}
                  href={`/${locale}/discover?collections=${link.slug}`}
                  className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full transition-all duration-200 hover:border-[rgba(200,162,75,0.45)] hover:text-[rgba(200,162,75,0.85)]"
                  style={{
                    letterSpacing: '0.07em',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Subtitle */}
            <p
              className="text-sm md:text-base mb-6 leading-relaxed"
              style={{
                color: 'var(--muted)',
                maxWidth: '38ch',
                opacity: 0,
                animation: 'heroFadeUp 0.6s ease 1.1s forwards',
              }}
            >
              {isHe
                ? 'פרמייר ליג, לה ליגה, רטרו, מונדיאל 2026 ועוד. כל חולצה שרצית — כאן.'
                : 'Premier League, La Liga, Retro, World Cup 2026 and more. Every kit you want — here.'}
            </p>

            {/* CTAs */}
            <div
              className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 ${isHe ? 'sm:flex-row-reverse' : ''}`}
              style={{ opacity: 0, animation: 'heroFadeUp 0.6s ease 1.25s forwards' }}
            >
              <Link
                href={`/${locale}/discover`}
                className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 active:scale-[0.97] hover:opacity-90"
                style={{ backgroundColor: 'var(--flare)', color: '#fff', boxShadow: '0 0 32px rgba(255,77,46,0.38)' }}
              >
                {isHe ? 'גלה את הקולקציה' : 'Shop the Drop'}
                <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d={isHe ? 'M13 8H3M7 4l-4 4 4 4' : 'M3 8h10M9 4l4 4-4 4'} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              <button
                onClick={() => {
                  const el = document.getElementById('collections-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  else router.push(`/${locale}/#collections-section`);
                }}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-white/[0.07]"
                style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.13)' }}
              >
                {isHe ? 'כל הקולקציות' : 'Explore Collections'}
              </button>

              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center justify-center w-[50px] h-[50px] shrink-0 rounded-xl transition-all duration-200 hover:bg-white/[0.07]"
                style={{ border: '1px solid rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.45)' }}
                aria-label={isHe ? 'חיפוש' : 'Search'}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Trust bar: stars · customers · PayPal·BIT · shipping */}
            <div
              className={`flex items-center flex-wrap gap-x-2.5 gap-y-1.5 ${isHe ? 'flex-row-reverse' : ''}`}
              style={{ opacity: 0, animation: 'heroFadeUp 0.5s ease 1.4s forwards' }}
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
                {isHe ? '120+ לקוחות' : '120+ customers'}
              </span>
              <span style={{ width: 1, height: 10, backgroundColor: 'var(--border)', display: 'inline-block' }} />
              <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>PayPal · BIT</span>
              <span style={{ width: 1, height: 10, backgroundColor: 'var(--border)', display: 'inline-block' }} />
              <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
                <Truck className="w-2.5 h-2.5 shrink-0" style={{ color: 'rgba(200,162,75,0.65)' }} />
                {isHe ? '2–4 שבועות' : '2–4 weeks'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ticker ── */}
      <div
        className="w-full overflow-hidden py-2.5 shrink-0"
        style={{ borderTop: '1px solid rgba(200,162,75,0.12)', backgroundColor: 'rgba(10,10,11,0.95)' }}
        aria-hidden="true"
      >
        <div
          style={{
            display: 'flex',
            whiteSpace: 'nowrap',
            animation: 'tickerScroll 48s linear infinite',
            direction: 'ltr',
          }}
        >
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

      {/* ── Search overlay ── */}
      {searchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isHe ? 'חיפוש' : 'Search'}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,10,11,0.93)', backdropFilter: 'blur(24px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
        >
          <div style={{ animation: 'searchDropIn 0.25s ease both', width: '100%', maxWidth: '520px' }}>
            <form onSubmit={handleSearch}>
              <div
                className="flex items-center gap-3 px-5 py-4 rounded-2xl"
                style={{ backgroundColor: 'var(--steel)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Search className="w-5 h-5 shrink-0" style={{ color: 'var(--muted)' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isHe ? 'חפש חולצות, ליגות, קבוצות...' : 'Search jerseys, leagues, teams...'}
                  className="flex-1 bg-transparent text-white text-lg outline-none"
                  style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-xs font-mono shrink-0 hover:text-white transition-colors"
                  style={{ color: 'var(--muted)' }}
                >
                  ESC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
