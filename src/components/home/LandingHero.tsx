'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { Search } from 'lucide-react';

// ── League ticker text ───────────────────────────────────────────────────────
const TICKER_EN =
  'PREMIER LEAGUE · LA LIGA · SERIE A · BUNDESLIGA · LIGUE 1 · WORLD CUP 2026 · RETRO CLASSICS · DRIP · STUSSY EDITION · MYSTERY BOX · SPECIAL EDITION · ISRAELI LEAGUE · 25/26 SEASON · ';
const TICKER_HE =
  'פרמייר ליג · לה ליגה · סרייה A · בונדסליגה · ליג 1 · מונדיאל 2026 · רטרו קלאסיק · דריפ · מהדורת סטוסי · קופסת הפתעה · מהדורה מיוחדת · ליגת העל · עונת 25/26 · ';

// ── Inline SVG jersey silhouette — zero network requests ─────────────────────
function JerseySilhouette() {
  return (
    <svg
      viewBox="0 0 220 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: '100%',
        maxWidth: '260px',
        height: 'auto',
        animation: 'breathe 5s ease-in-out infinite',
        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))',
      }}
      aria-hidden="true"
    >
      {/* Jersey body */}
      <path
        d="M65 42 L18 74 L36 98 L58 82 L58 210 L162 210 L162 82 L184 98 L202 74 L155 42 C142 36 128 31 110 31 C92 31 78 36 65 42Z"
        fill="rgba(15,61,46,0.55)"
        stroke="rgba(200,162,75,0.35)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Sleeve seam left */}
      <path
        d="M58 82 L65 42"
        stroke="rgba(200,162,75,0.2)"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      {/* Sleeve seam right */}
      <path
        d="M162 82 L155 42"
        stroke="rgba(200,162,75,0.2)"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      {/* Collar — V-neck */}
      <path
        d="M83 44 C90 60 104 67 110 67 C116 67 130 60 137 44"
        stroke="rgba(200,162,75,0.5)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Center stripe */}
      <line
        x1="110" y1="67"
        x2="110" y2="210"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
        strokeDasharray="6 4"
      />
      {/* Jersey number */}
      <text
        x="110"
        y="158"
        textAnchor="middle"
        fontFamily="Playfair Display, serif"
        fontSize="56"
        fontWeight="bold"
        fill="rgba(200,162,75,0.18)"
        letterSpacing="-2"
      >
        10
      </text>
      {/* Sponsor block placeholder */}
      <rect
        x="85" y="100"
        width="50" height="18"
        rx="2"
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.75"
      />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
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
      {/* ── Split-screen container ──────────────────────────────────────── */}
      <div className={`flex flex-col md:flex-row flex-1 ${isHe ? 'md:flex-row-reverse' : ''}`}>

        {/* ── Left panel: editorial text ───────────────────────────────── */}
        <div
          className="relative flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 md:py-0 w-full md:w-[55%]"
          style={{ backgroundColor: 'var(--ink)', zIndex: 2 }}
        >
          {/* Gold hairline — animates in from start side */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: isHe ? 'auto' : 0,
              right: isHe ? 0 : 'auto',
              width: '42%',
              height: '2px',
              background: 'linear-gradient(to right, var(--gold), transparent)',
              transformOrigin: isHe ? 'right center' : 'left center',
              animation: 'hairlineIn 1s cubic-bezier(0.22,1,0.36,1) 0.2s both',
            }}
          />

          {/* Mono kicker */}
          <p
            className="section-kicker mb-8"
            style={{ opacity: 0, animation: 'heroFadeUp 0.5s ease 0.35s forwards' }}
          >
            {isHe
              ? 'מאז 2023 · ישראל · 17 קולקציות'
              : 'EST. IL · SINCE 2023 · 17 COLLECTIONS'}
          </p>

          {/* Display headline — 3 lines, last line in gold */}
          <h1
            className={`font-playfair font-bold text-white mb-8 ${isHe ? 'text-right' : ''}`}
            style={{
              fontSize: 'clamp(3.8rem, 6.5vw, 7.5rem)',
              letterSpacing: '-0.04em',
              lineHeight: 0.88,
            }}
          >
            <span
              className="block word-reveal"
              style={{ animationDelay: '0.45s' }}
            >
              {isHe ? 'כל' : 'Wear'}
            </span>
            <span
              className="block word-reveal"
              style={{ animationDelay: '0.6s' }}
            >
              {isHe ? 'חולצה' : 'Every'}
            </span>
            <span
              className="block word-reveal"
              style={{ animationDelay: '0.75s', color: 'var(--gold)' }}
            >
              {isHe ? 'מספרת.' : 'Story.'}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-base md:text-lg mb-10 max-w-[44ch] leading-relaxed ${isHe ? 'text-right' : ''}`}
            style={{
              color: 'var(--muted)',
              opacity: 0,
              animation: 'heroFadeUp 0.6s ease 0.95s forwards',
            }}
          >
            {isHe
              ? 'חולצות כדורגל פרמיום מכל הליגות — פרמייר ליג, לה ליגה, מונדיאל 2026, רטרו ועוד. PayPal · BIT · משלוח לכל ישראל.'
              : 'Premium football jerseys from every league — Premier League, La Liga, World Cup 2026, Retro and more. PayPal · BIT · Ships across Israel.'}
          </p>

          {/* CTA row */}
          <div
            className={`flex items-center flex-wrap gap-3 mb-10 ${isHe ? 'flex-row-reverse' : ''}`}
            style={{ opacity: 0, animation: 'heroFadeUp 0.6s ease 1.1s forwards' }}
          >
            <button
              onClick={() => router.push(`/${locale}/discover`)}
              className="flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: 'var(--flare)',
                color: '#fff',
                boxShadow: '0 0 32px rgba(255,77,46,0.4)',
              }}
            >
              {isHe ? 'גלה את הקולקציה' : 'Shop the Drop'}
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path
                  d={isHe ? 'M13 8H3M7 4l-4 4 4 4' : 'M3 8h10M9 4l4 4-4 4'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              onClick={() => router.push(`/${locale}/discover`)}
              className="flex items-center gap-2 px-7 py-4 rounded-xl font-medium text-sm tracking-wide transition-all duration-200 hover:bg-white/10"
              style={{
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              {isHe ? 'כל הקולקציות' : 'Explore Collections'}
            </button>

            {/* Search icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-[52px] h-[52px] rounded-xl transition-all duration-200 hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.6)' }}
              aria-label={isHe ? 'חיפוש' : 'Search'}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Social proof micro-row */}
          <div
            className={`flex items-center flex-wrap gap-4 ${isHe ? 'flex-row-reverse' : ''}`}
            style={{ opacity: 0, animation: 'heroFadeUp 0.5s ease 1.3s forwards' }}
          >
            {/* Stars */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="var(--gold)">
                  <path d="M8 1l1.9 3.9L14 5.6l-3 2.9.7 4.1L8 10.4l-3.7 2.2.7-4.1-3-2.9 4.1-.7z" />
                </svg>
              ))}
              <span className="font-mono text-[11px] ml-1.5" style={{ color: 'var(--gold)' }}>4.8</span>
            </div>

            <div style={{ width: 1, height: 14, backgroundColor: 'var(--border)' }} />

            <p className="font-mono text-[11px]" style={{ color: 'var(--muted)' }}>
              {isHe ? '95+ לקוחות מרוצים' : '95+ happy customers'}
            </p>

            <div style={{ width: 1, height: 14, backgroundColor: 'var(--border)' }} />

            <p className="font-mono text-[11px]" style={{ color: 'var(--muted)' }}>
              {isHe ? 'PayPal · BIT' : 'PayPal · BIT'}
            </p>
          </div>
        </div>

        {/* ── Right panel: jersey visual — desktop only ─────────────────── */}
        <div
          className="relative hidden md:flex flex-col items-center justify-center overflow-hidden w-[45%]"
          style={{
            backgroundColor: 'var(--pitch)',
            borderLeft: isHe ? 'none' : '1px solid rgba(200,162,75,0.12)',
            borderRight: isHe ? '1px solid rgba(200,162,75,0.12)' : 'none',
          }}
        >
          {/* Radial gold glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(200,162,75,0.11) 0%, transparent 70%)',
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

          {/* Jersey SVG */}
          <div
            className="relative z-10 flex items-center justify-center"
            style={{
              width: '72%',
              maxWidth: '280px',
              opacity: 0,
              animation: 'heroFadeUp 0.8s ease 0.6s forwards',
            }}
          >
            <JerseySilhouette />
          </div>

          {/* Rotated vertical label */}
          <div
            className="absolute right-5 top-1/2 -translate-y-1/2"
            style={{
              writingMode: 'vertical-rl',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '9px',
              letterSpacing: '0.28em',
              color: 'rgba(200,162,75,0.35)',
              textTransform: 'uppercase',
            }}
            aria-hidden="true"
          >
            VOL. 01 / 2026
          </div>

          {/* Bottom "17 / Collections" counter */}
          <div
            className="absolute bottom-8 left-0 right-0 flex flex-col items-center"
            style={{ opacity: 0, animation: 'heroFadeUp 0.6s ease 1.0s forwards' }}
          >
            <p
              className="font-playfair font-bold"
              style={{ fontSize: '4rem', color: 'rgba(200,162,75,0.2)', letterSpacing: '-0.05em', lineHeight: 1 }}
              aria-hidden="true"
            >
              17
            </p>
            <p
              className="font-mono uppercase"
              style={{ fontSize: '8px', letterSpacing: '0.32em', color: 'rgba(255,255,255,0.28)' }}
            >
              Collections
            </p>
          </div>
        </div>
      </div>

      {/* ── League name ticker ────────────────────────────────────────────── */}
      <div
        className="w-full overflow-hidden py-2.5 shrink-0"
        style={{
          borderTop: '1px solid rgba(200,162,75,0.12)',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'rgba(10,10,11,0.8)',
        }}
        aria-hidden="true"
      >
        <div
          style={{
            display: 'flex',
            whiteSpace: 'nowrap',
            animation: 'tickerScroll 45s linear infinite',
            direction: 'ltr',
          }}
        >
          <span
            className="font-mono uppercase shrink-0"
            style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'rgba(200,162,75,0.45)' }}
          >
            {ticker}
          </span>
          <span
            className="font-mono uppercase shrink-0"
            style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'rgba(200,162,75,0.45)' }}
          >
            {ticker}
          </span>
        </div>
      </div>

      {/* ── Search overlay ────────────────────────────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,10,11,0.92)', backdropFilter: 'blur(20px)' }}
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
                  style={{
                    direction: isRtl ? 'rtl' : 'ltr',
                    color: 'white',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-xs font-mono shrink-0 transition-colors hover:text-white"
                  style={{ color: 'var(--muted)' }}
                >
                  {isHe ? 'סגור' : 'ESC'}
                </button>
              </div>
            </form>
            <p className="font-mono text-[10px] text-center mt-3" style={{ color: 'var(--muted)' }}>
              {isHe ? 'לחץ מחוץ לשדה לסגירה' : 'Click outside to close'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
