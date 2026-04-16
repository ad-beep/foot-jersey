'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { Search } from 'lucide-react';
import { AGGREGATE_RATING } from '@/data/reviews';

const TICKER_EN = 'PREMIER LEAGUE · LA LIGA · SERIE A · BUNDESLIGA · LIGUE 1 · WORLD CUP 2026 · RETRO CLASSICS · DRIP · STUSSY EDITION · MYSTERY BOX · SPECIAL EDITION · ISRAELI LEAGUE · 25/26 SEASON · ';
const TICKER_HE = 'פרמייר ליג · לה ליגה · סרייה A · בונדסליגה · ליג 1 · מונדיאל 2026 · רטרו קלאסיק · דריפ · מהדורת סטוסי · קופסת הפתעה · מהדורה מיוחדת · ליגת העל · עונת 25/26 · ';

export default function LandingHero() {
  const { locale, isRtl } = useLocale();
  const router  = useRouter();
  const isHe    = locale === 'he';

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery]           = useState('');
  const searchInputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/${locale}/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setQuery('');
  };

  const ticker = isHe ? TICKER_HE : TICKER_EN;

  return (
    <section
      className="relative overflow-hidden flex flex-col"
      style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--ink)' }}
    >
      {/*
       * Layout:
       * Mobile  → flex-col: visual panel TOP, text panel BOTTOM
       * Desktop LTR → md:flex-row-reverse: first DOM item (visual) → RIGHT
       * Desktop RTL → md:flex-row:         first DOM item (visual) → LEFT
       */}
      <div className={`flex flex-col flex-1 ${isHe ? 'md:flex-row' : 'md:flex-row-reverse'}`}>

        {/* ── Visual panel ──────────────────────────────────────────────── */}
        <div
          className="hero-visual-panel relative flex flex-col items-center justify-center overflow-hidden w-full md:w-[45%]"
          style={{ backgroundColor: 'var(--pitch)' }}
        >
          {/* Radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(200,162,75,0.1) 0%, rgba(200,162,75,0.03) 55%, transparent 80%)',
            }}
          />

          {/* Film grain */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '256px 256px',
              opacity: 0.04,
              mixBlendMode: 'overlay',
            }}
            aria-hidden="true"
          />

          {/* Corner registration marks */}
          {([
            { top: '14px', left: '14px' },
            { top: '14px', right: '14px' },
            { bottom: '14px', left: '14px' },
            { bottom: '14px', right: '14px' },
          ] as React.CSSProperties[]).map((pos, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 pointer-events-none"
              style={{
                ...pos,
                borderTop:    i < 2 ? '1px solid rgba(200,162,75,0.35)' : undefined,
                borderBottom: i >= 2 ? '1px solid rgba(200,162,75,0.35)' : undefined,
                borderLeft:   i % 2 === 0 ? '1px solid rgba(200,162,75,0.35)' : undefined,
                borderRight:  i % 2 === 1 ? '1px solid rgba(200,162,75,0.35)' : undefined,
              }}
              aria-hidden="true"
            />
          ))}

          {/* Jersey silhouette watermark */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            style={{ opacity: 0.055 }}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 200 220"
              fill="none"
              className="w-[72%] h-[72%] max-w-[320px]"
              style={{ color: '#C8A24B' }}
            >
              {/* Jersey front silhouette */}
              <path
                d="M70 10 L50 0 L10 30 L30 50 L20 220 L180 220 L170 50 L190 30 L150 0 L130 10 C130 28 70 28 70 10 Z"
                fill="currentColor"
                fillOpacity="0.35"
              />
              {/* Collar */}
              <path
                d="M85 10 Q100 26 115 10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeOpacity="0.6"
              />
              {/* Sleeve seam lines */}
              <line x1="30" y1="50" x2="55" y2="80" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
              <line x1="170" y1="50" x2="145" y2="80" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
            </svg>
          </div>

          {/* Editorial centrepiece — massive "No.10" */}
          <div
            className="relative z-10 flex flex-col items-center justify-center select-none"
            style={{ opacity: 0, animation: 'heroFadeUp 1s ease 0.4s forwards' }}
            aria-hidden="true"
          >
            {/* "No." label */}
            <span
              className="font-mono uppercase tracking-[0.4em]"
              style={{ fontSize: '9px', color: 'rgba(200,162,75,0.5)', letterSpacing: '0.45em' }}
            >
              No.
            </span>
            {/* Giant 10 */}
            <span
              className="font-playfair font-bold leading-none"
              style={{
                fontSize: 'clamp(7rem, 22vw, 14rem)',
                color: 'rgba(200,162,75,0.13)',
                letterSpacing: '-0.06em',
                lineHeight: 0.85,
              }}
            >
              10
            </span>
            {/* Hairline under */}
            <div
              style={{
                width: '48px',
                height: '1px',
                backgroundColor: 'rgba(200,162,75,0.3)',
                marginTop: '12px',
              }}
            />
            {/* Sub-label */}
            <span
              className="font-mono uppercase mt-3"
              style={{ fontSize: '8px', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.2)' }}
            >
              {isHe ? 'קולקציות 18' : '18 Collections'}
            </span>
          </div>

          {/* Vertical "VOL. 01" label — desktop only */}
          <div
            className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2"
            style={{
              writingMode: 'vertical-rl',
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.28em',
              color: 'rgba(200,162,75,0.28)',
              textTransform: 'uppercase',
            }}
            aria-hidden="true"
          >
            VOL. 01 / 2026
          </div>
        </div>

        {/* ── Text panel ────────────────────────────────────────────────── */}
        <div
          className="relative flex flex-col justify-center px-6 md:px-12 lg:px-20 py-10 md:py-0 w-full md:w-[55%]"
          style={{ backgroundColor: 'var(--ink)' }}
        >
          {/* Gold hairline top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: isHe ? 'auto' : 0,
              right: isHe ? 0 : 'auto',
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
              className="section-kicker mb-6"
              style={{ opacity: 0, animation: 'heroFadeUp 0.5s ease 0.5s forwards' }}
            >
              {isHe ? 'מאז 2023 · ישראל · 18 קולקציות' : 'EST. IL · SINCE 2023 · 18 COLLECTIONS'}
            </p>

            {/* Headline */}
            <h1
              className="font-playfair font-bold text-white mb-6 md:mb-8"
              style={{
                fontSize: 'clamp(3.8rem, 13vw, 7.5rem)',
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

            {/* Subtitle */}
            <p
              className="text-sm md:text-base mb-8 md:mb-10 leading-relaxed"
              style={{
                color: 'var(--muted)',
                maxWidth: '40ch',
                opacity: 0,
                animation: 'heroFadeUp 0.6s ease 1.1s forwards',
              }}
            >
              {isHe
                ? 'חולצות כדורגל פרמיום מכל הליגות. PayPal · BIT · משלוח מהיר לכל ישראל.'
                : 'Premium football jerseys from every league. PayPal · BIT · Fast delivery across Israel.'}
            </p>

            {/* CTAs */}
            <div
              className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8 ${isHe ? 'sm:flex-row-reverse' : ''}`}
              style={{ opacity: 0, animation: 'heroFadeUp 0.6s ease 1.25s forwards' }}
            >
              <button
                onClick={() => router.push(`/${locale}/discover`)}
                className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 active:scale-[0.97] hover:opacity-90"
                style={{ backgroundColor: 'var(--flare)', color: '#fff', boxShadow: '0 0 36px rgba(255,77,46,0.4)' }}
              >
                {isHe ? 'גלה את הקולקציה' : 'Shop the Drop'}
                <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d={isHe ? 'M13 8H3M7 4l-4 4 4 4' : 'M3 8h10M9 4l4 4-4 4'} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('collections-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  else router.push(`/${locale}/#collections-section`);
                }}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-white/[0.07]"
                style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.13)' }}
              >
                {isHe ? 'כל הקולקציות' : 'Explore Collections'}
              </button>

              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center justify-center w-[52px] h-[52px] shrink-0 rounded-xl transition-all duration-200 hover:bg-white/[0.07]"
                style={{ border: '1px solid rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.45)' }}
                aria-label={isHe ? 'חיפוש' : 'Search'}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Social proof */}
            <div
              className={`flex items-center flex-wrap gap-3 md:gap-4 ${isHe ? 'flex-row-reverse' : ''}`}
              style={{ opacity: 0, animation: 'heroFadeUp 0.5s ease 1.4s forwards' }}
            >
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 16 16" className="w-3 h-3 md:w-3.5 md:h-3.5" fill="var(--gold)">
                    <path d="M8 1l1.9 3.9L14 5.6l-3 2.9.7 4.1L8 10.4l-3.7 2.2.7-4.1-3-2.9 4.1-.7z" />
                  </svg>
                ))}
                <span className="font-mono text-[11px] ms-1.5" style={{ color: 'var(--gold)' }}>{AGGREGATE_RATING.ratingValue}</span>
              </div>
              <span style={{ width: 1, height: 12, backgroundColor: 'var(--border)', display: 'inline-block' }} />
              <span className="font-mono text-[11px]" style={{ color: 'var(--muted)' }}>
                {isHe ? '120+ לקוחות מרוצים' : '120+ happy customers'}
              </span>
              <span style={{ width: 1, height: 12, backgroundColor: 'var(--border)', display: 'inline-block' }} />
              <span className="font-mono text-[11px]" style={{ color: 'var(--muted)' }}>PayPal · BIT</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ticker ────────────────────────────────────────────────────────── */}
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
          {/* Two identical copies → seamless loop (tickerScroll moves -50%) */}
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

      {/* ── Search overlay ────────────────────────────────────────────────── */}
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
