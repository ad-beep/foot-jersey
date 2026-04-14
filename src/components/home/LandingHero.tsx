'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { Search } from 'lucide-react';

// ── League ticker text ────────────────────────────────────────────────────────
const TICKER_EN = 'PREMIER LEAGUE · LA LIGA · SERIE A · BUNDESLIGA · LIGUE 1 · WORLD CUP 2026 · RETRO CLASSICS · DRIP · STUSSY EDITION · MYSTERY BOX · SPECIAL EDITION · ISRAELI LEAGUE · 25/26 SEASON · ';
const TICKER_HE = 'פרמייר ליג · לה ליגה · סרייה A · בונדסליגה · ליג 1 · מונדיאל 2026 · רטרו קלאסיק · דריפ · מהדורת סטוסי · קופסת הפתעה · מהדורה מיוחדת · ליגת העל · עונת 25/26 · ';

// ── Premium jersey SVG — zero network requests ────────────────────────────────
function JerseySVG({ size }: { size: 'mobile' | 'desktop' }) {
  const w = size === 'mobile' ? '180px' : '260px';
  return (
    <svg
      viewBox="0 0 220 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: w,
        height: 'auto',
        animation: 'breathe 5s ease-in-out infinite',
        filter: 'drop-shadow(0 28px 56px rgba(0,0,0,0.8)) drop-shadow(0 0 40px rgba(200,162,75,0.08))',
      }}
      aria-hidden="true"
    >
      {/* Body */}
      <path
        d="M65 42 L18 74 L36 98 L58 82 L58 212 L162 212 L162 82 L184 98 L202 74 L155 42 C142 36 128 31 110 31 C92 31 78 36 65 42Z"
        fill="rgba(10,36,26,0.7)"
        stroke="rgba(200,162,75,0.4)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Left sleeve inner seam */}
      <path d="M36 98 L58 82" stroke="rgba(200,162,75,0.18)" strokeWidth="0.75" />
      {/* Right sleeve inner seam */}
      <path d="M184 98 L162 82" stroke="rgba(200,162,75,0.18)" strokeWidth="0.75" />
      {/* Left shoulder seam */}
      <path d="M58 82 L68 44" stroke="rgba(200,162,75,0.22)" strokeWidth="1" strokeDasharray="3 3" />
      {/* Right shoulder seam */}
      <path d="M162 82 L152 44" stroke="rgba(200,162,75,0.22)" strokeWidth="1" strokeDasharray="3 3" />
      {/* V-collar */}
      <path
        d="M84 44 C91 58 103 65 110 65 C117 65 129 58 136 44"
        stroke="rgba(200,162,75,0.55)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Collar fill */}
      <path
        d="M84 44 C91 58 103 65 110 65 C117 65 129 58 136 44 L130 42 C124 54 116 60 110 60 C104 60 96 54 90 42Z"
        fill="rgba(200,162,75,0.08)"
      />
      {/* Center chest stripe (subtle) */}
      <rect x="105" y="67" width="10" height="145" fill="rgba(200,162,75,0.06)" />
      {/* Sponsor band */}
      <rect x="82" y="99" width="56" height="20" rx="2" fill="rgba(200,162,75,0.06)" stroke="rgba(200,162,75,0.15)" strokeWidth="0.75" />
      {/* Number 10 */}
      <text
        x="110" y="162"
        textAnchor="middle"
        fontFamily="Playfair Display, Georgia, serif"
        fontSize="60"
        fontWeight="bold"
        fill="rgba(200,162,75,0.2)"
        letterSpacing="-3"
      >
        10
      </text>
      {/* Bottom hem line */}
      <line x1="58" y1="205" x2="162" y2="205" stroke="rgba(200,162,75,0.15)" strokeWidth="0.75" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
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
      {/*
       * DOM ORDER: visual panel first, text panel second.
       * Mobile (flex-col): visual = top, text = bottom.  ✓
       * Desktop LTR (md:flex-row-reverse): first item → RIGHT, second → LEFT. ✓
       * Desktop RTL (md:flex-row):         first item → LEFT,  second → RIGHT. ✓
       */}
      <div className={`flex flex-col flex-1 ${isHe ? 'md:flex-row' : 'md:flex-row-reverse'}`}>

        {/* ── Visual panel: pitch-green, jersey SVG ──────────────────────── */}
        <div
          className="hero-visual-panel relative flex flex-col items-center justify-center overflow-hidden w-full md:w-[45%]"
          style={{ backgroundColor: 'var(--pitch)' }}
        >
          {/* Radial gold glow — large, centered */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 75% 65% at 50% 42%, rgba(200,162,75,0.14) 0%, rgba(200,162,75,0.04) 50%, transparent 80%)',
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

          {/* Corner registration marks (editorial) */}
          {[
            { top: '12px', left: '12px',   borderStyle: 'border-t border-l' },
            { top: '12px', right: '12px',  borderStyle: 'border-t border-r' },
            { bottom: '12px', left: '12px',  borderStyle: 'border-b border-l' },
            { bottom: '12px', right: '12px', borderStyle: 'border-b border-r' },
          ].map((m, i) => (
            <div
              key={i}
              className={`absolute w-4 h-4 pointer-events-none ${m.borderStyle}`}
              style={{
                top: m.top, left: m.left, right: m.right, bottom: m.bottom,
                borderColor: 'rgba(200,162,75,0.3)',
              }}
              aria-hidden="true"
            />
          ))}

          {/* Jersey */}
          <div
            className="relative z-10 flex items-center justify-center px-6"
            style={{ opacity: 0, animation: 'heroFadeUp 0.9s ease 0.3s forwards' }}
          >
            {/* Mobile jersey */}
            <div className="md:hidden">
              <JerseySVG size="mobile" />
            </div>
            {/* Desktop jersey */}
            <div className="hidden md:block">
              <JerseySVG size="desktop" />
            </div>
          </div>

          {/* "17 / Collections" counter — bottom center */}
          <div
            className="absolute bottom-4 md:bottom-8 left-0 right-0 flex flex-col items-center gap-0.5"
            style={{ opacity: 0, animation: 'heroFadeUp 0.6s ease 0.9s forwards' }}
            aria-hidden="true"
          >
            <span
              className="font-playfair font-bold"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: 'rgba(200,162,75,0.18)', letterSpacing: '-0.05em', lineHeight: 1 }}
            >
              17
            </span>
            <span
              className="font-mono uppercase"
              style={{ fontSize: '8px', letterSpacing: '0.32em', color: 'rgba(255,255,255,0.25)' }}
            >
              Collections
            </span>
          </div>

          {/* Vertical label — desktop right side */}
          <div
            className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2"
            style={{
              writingMode: 'vertical-rl',
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.28em',
              color: 'rgba(200,162,75,0.3)',
              textTransform: 'uppercase',
            }}
            aria-hidden="true"
          >
            VOL. 01 / 2026
          </div>
        </div>

        {/* ── Text panel: ink, headline, CTAs ───────────────────────────── */}
        <div
          className="relative flex flex-col justify-center px-6 md:px-12 lg:px-20 py-10 md:py-0 w-full md:w-[55%]"
          style={{ backgroundColor: 'var(--ink)' }}
        >
          {/* Gold hairline — top of text panel */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: isHe ? 'auto' : 0,
              right: isHe ? 0 : 'auto',
              width: '45%',
              height: '2px',
              background: isHe
                ? 'linear-gradient(to left, var(--gold), transparent)'
                : 'linear-gradient(to right, var(--gold), transparent)',
              transformOrigin: isHe ? 'right center' : 'left center',
              animation: 'hairlineIn 1.2s cubic-bezier(0.22,1,0.36,1) 0.4s both',
            }}
          />

          {/* Subtle dot-grid background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(200,162,75,0.06) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              opacity: 0.6,
            }}
            aria-hidden="true"
          />

          <div className={`relative z-10 ${isHe ? 'text-right' : ''}`}>
            {/* Kicker */}
            <p
              className="section-kicker mb-6 md:mb-8"
              style={{ opacity: 0, animation: 'heroFadeUp 0.5s ease 0.5s forwards' }}
            >
              {isHe ? 'מאז 2023 · ישראל · 17 קולקציות' : 'EST. IL · SINCE 2023 · 17 COLLECTIONS'}
            </p>

            {/* Headline — 3 lines, final line in gold */}
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
              <span
                className="block word-reveal"
                style={{ animationDelay: '0.89s', color: 'var(--gold)' }}
              >
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

            {/* CTA buttons */}
            <div
              className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8 ${isHe ? 'sm:flex-row-reverse' : ''}`}
              style={{ opacity: 0, animation: 'heroFadeUp 0.6s ease 1.25s forwards' }}
            >
              {/* Primary — full width on mobile */}
              <button
                onClick={() => router.push(`/${locale}/discover`)}
                className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 active:scale-[0.97]"
                style={{
                  backgroundColor: 'var(--flare)',
                  color: '#fff',
                  boxShadow: '0 0 36px rgba(255,77,46,0.45)',
                }}
              >
                {isHe ? 'גלה את הקולקציה' : 'Shop the Drop'}
                <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d={isHe ? 'M13 8H3M7 4l-4 4 4 4' : 'M3 8h10M9 4l4 4-4 4'} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Ghost */}
              <button
                onClick={() => router.push(`/${locale}/discover`)}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-white/[0.08]"
                style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.13)' }}
              >
                {isHe ? 'כל הקולקציות' : 'Explore Collections'}
              </button>

              {/* Search pill */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center justify-center w-[52px] h-[52px] shrink-0 rounded-xl transition-all duration-200 hover:bg-white/[0.08]"
                style={{ border: '1px solid rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.5)' }}
                aria-label={isHe ? 'חיפוש' : 'Search'}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Social proof row */}
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
                <span className="font-mono text-[11px] ml-1.5" style={{ color: 'var(--gold)' }}>4.8</span>
              </div>

              <span style={{ width: 1, height: 12, backgroundColor: 'var(--border)', display: 'inline-block' }} />

              <span className="font-mono text-[11px]" style={{ color: 'var(--muted)' }}>
                {isHe ? '95+ לקוחות מרוצים' : '95+ happy customers'}
              </span>

              <span style={{ width: 1, height: 12, backgroundColor: 'var(--border)', display: 'inline-block' }} />

              <span className="font-mono text-[11px]" style={{ color: 'var(--muted)' }}>
                PayPal · BIT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── League name ticker ─────────────────────────────────────────────── */}
      <div
        className="w-full overflow-hidden py-2.5 shrink-0"
        style={{
          borderTop: '1px solid rgba(200,162,75,0.14)',
          backgroundColor: 'rgba(10,10,11,0.95)',
        }}
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
          {[1, 2, 3].map((n) => (
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

      {/* ── Search overlay ─────────────────────────────────────────────────── */}
      {searchOpen && (
        <div
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
