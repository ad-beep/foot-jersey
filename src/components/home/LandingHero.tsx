'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLocale } from '@/hooks/useLocale';
import { ChevronRight, Search } from 'lucide-react';
import type { Jersey } from '@/types';

// ── Marquee constants ────────────────────────────────────────────────────────
const CARD_W  = 110;
const CARD_H  = 148;
const CARD_MR = 10;
const HALF    = 12;
const STRIP_W = HALF * (CARD_W + CARD_MR);  // 1440px

const ROWS = [
  { dir: 'left'  as const, speed: 55, opacity: 0.22, scale: 1.0  },
  { dir: 'right' as const, speed: 40, opacity: 0.18, scale: 0.92 },
];

// ── Order ticker messages ────────────────────────────────────────────────────
const TICKER_ITEMS = {
  en: [
    'A fan in Tel Aviv just grabbed Real Madrid 24/25 ⚽',
    'Someone in Jerusalem ordered Argentina WC 2026 🏆',
    'A fan in Haifa picked up PSG Retro Classic 📦',
    'Someone in Beer Sheva ordered Maccabi Tel Aviv Drip ✨',
    'A fan in Rishon got 3 jerseys + free shipping 🎁',
    'Someone in Netanya ordered Barcelona 2024/25 ⚽',
    'A fan in Ashdod just grabbed the Stussy Edition 🔥',
    'Someone in Eilat ordered a Mystery Box 📦',
  ],
  he: [
    'אוהד בתל אביב הזמין ריאל מדריד 24/25 ⚽',
    'מישהו בירושלים הזמין ארגנטינה מונדיאל 2026 🏆',
    'אוהד בחיפה בחר ב-PSG רטרו קלאסיק 📦',
    'מישהו בבאר שבע הזמין Drip של מכבי תל אביב ✨',
    'אוהד בראשון קיבל 3 חולצות + משלוח חינם 🎁',
    'מישהו בנתניה הזמין ברצלונה 2024/25 ⚽',
    'אוהד באשדוד הזמין את מהדורת Stussy 🔥',
    'מישהו באילת הזמין Mystery Box 📦',
  ],
};

// ── Marquee Row ──────────────────────────────────────────────────────────────
function MarqueeRow({
  images,
  dir,
  speed,
  opacity,
  scale = 1,
}: {
  images: { id: string; imageUrl: string }[];
  dir: 'left' | 'right';
  speed: number;
  opacity: number;
  scale?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const pxPerMs = STRIP_W / (speed * 1000);
    let pos  = dir === 'left' ? 0 : -STRIP_W;
    let prev = performance.now();
    let raf: number;

    const step = (now: number) => {
      const dt = Math.min(now - prev, 100);
      prev = now;
      if (dir === 'left') {
        pos -= pxPerMs * dt;
        if (pos <= -STRIP_W) pos += STRIP_W;
      } else {
        pos += pxPerMs * dt;
        if (pos >= 0) pos -= STRIP_W;
      }
      el.style.transform = `translateX(${pos}px)`;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [dir, speed]);

  if (images.length === 0) return null;

  const half: typeof images = [];
  for (let i = 0; i < HALF; i++) half.push(images[i % images.length]);
  const all = [...half, ...half];

  return (
    <div style={{ overflow: 'hidden', width: '100%', transform: `scale(${scale})` }}>
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          width: STRIP_W * 2,
          willChange: 'transform',
          transform: `translateX(${dir === 'left' ? 0 : -STRIP_W}px)`,
          opacity,
        }}
      >
        {all.map((j, i) => (
          <div
            key={`${j.id}-${i}`}
            style={{
              width: CARD_W,
              height: CARD_H,
              marginRight: CARD_MR,
              borderRadius: 10,
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: '#141416',
              position: 'relative',
            }}
          >
            <Image
              src={j.imageUrl}
              alt=""
              width={CARD_W}
              height={CARD_H}
              unoptimized
              loading="eager"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Order Ticker ─────────────────────────────────────────────────────────────
function OrderTicker({ locale }: { locale: 'en' | 'he' }) {
  const items = TICKER_ITEMS[locale];
  // Duplicate for seamless loop
  const all = [...items, ...items];

  return (
    <div
      className="w-full overflow-hidden"
      style={{ backgroundColor: 'rgba(15,61,46,0.25)', borderTop: '1px solid rgba(15,61,46,0.5)', borderBottom: '1px solid rgba(15,61,46,0.5)' }}
      aria-hidden="true"
    >
      <div
        style={{
          display: 'flex',
          whiteSpace: 'nowrap',
          animation: 'tickerScroll 30s linear infinite',
          direction: 'ltr', // always ltr for ticker
        }}
      >
        {all.map((item, i) => (
          <span
            key={i}
            className="font-mono text-xs py-2 px-6 shrink-0"
            style={{ color: 'rgba(200,162,75,0.9)' }}
          >
            {item}
            <span className="mx-6 opacity-30">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
interface LandingHeroProps {
  jerseys?: Jersey[];
}

export default function LandingHero({ jerseys = [] }: LandingHeroProps) {
  const { locale, isRtl } = useLocale();
  const router = useRouter();
  const isHe = locale === 'he';

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use all jerseys for marquee (diverse look)
  const pool = jerseys
    .filter((j) => j.imageUrl)
    .sort(() => Math.random() - 0.5)
    .slice(0, HALF * ROWS.length);
  const perRow = Math.max(1, Math.ceil(pool.length / ROWS.length));
  const chunks = ROWS.map((_, i) => {
    const chunk = pool.slice(i * perRow, (i + 1) * perRow);
    return chunk.length > 0 ? chunk : (pool.length > 0 ? pool.slice(0, perRow) : []);
  });

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/${locale}/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  };

  const headline = isHe
    ? ['כל', 'חולצה', 'מספרת', 'סיפור.']
    : ['Every', 'jersey', 'tells', 'a', 'story.'];

  return (
    <section
      className="snap-start relative flex flex-col overflow-hidden"
      style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--ink)' }}
    >
      {/* ── Layer 0: Marquee background ──────────────────────────────────── */}
      {pool.length > 0 && (
        <div
          className="absolute inset-0 z-0 flex flex-col justify-evenly"
          style={{ direction: 'ltr', overflow: 'hidden' }}
          aria-hidden="true"
        >
          {ROWS.map((row, i) => (
            <MarqueeRow
              key={i}
              images={chunks[i] || []}
              dir={row.dir}
              speed={row.speed}
              opacity={row.opacity}
              scale={row.scale}
            />
          ))}
        </div>
      )}

      {/* ── Layer 1: Gradient vignette overlay ───────────────────────────── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(10,10,11,0.5) 0%, rgba(10,10,11,0.85) 70%, #0A0A0B 100%)',
          ].join(', '),
        }}
      />

      {/* ── Layer 2: Film grain ───────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
          opacity: 0.04,
          mixBlendMode: 'overlay',
        }}
        aria-hidden="true"
      />

      {/* ── Layer 3: Hero content ─────────────────────────────────────────── */}
      <div className="relative z-20 flex flex-col justify-center flex-1 px-6 pt-12 pb-4">
        <div className="max-w-[1200px] mx-auto w-full">

          {/* Kicker */}
          <div
            className="section-kicker mb-6 md:mb-8"
            style={{ opacity: 0, animation: 'heroFadeUp 0.5s ease 0.1s forwards' }}
          >
            {isHe
              ? 'מאז 2023 · ישראל · 17 קולקציות'
              : 'EST. · ISRAEL · 17 COLLECTIONS · SINCE 2023'}
          </div>

          {/* Headline — word-by-word reveal */}
          <h1
            className={`font-playfair font-bold text-white mb-6 md:mb-8 leading-none ${isHe ? 'text-right' : ''}`}
            style={{
              fontSize: 'clamp(3rem, 9vw, 7.5rem)',
              letterSpacing: '-0.04em',
              lineHeight: 0.95,
            }}
          >
            {headline.map((word, i) => (
              <span
                key={i}
                className="inline-block word-reveal"
                style={{
                  animationDelay: `${0.3 + i * 0.1}s`,
                  marginRight: isHe ? 0 : '0.25em',
                  marginLeft: isHe ? '0.25em' : 0,
                }}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Subline */}
          <p
            className={`text-base md:text-lg mb-10 max-w-md ${isHe ? 'text-right' : ''}`}
            style={{
              color: 'var(--muted)',
              opacity: 0,
              animation: 'heroFadeUp 0.6s ease 0.9s forwards',
              fontWeight: 400,
            }}
          >
            {isHe
              ? 'חולצות כדורגל פרמיום מכל הליגות. תשלום מאובטח. משלוח לכל ישראל.'
              : 'Premium football jerseys from every league. Secure payment. Fast delivery across Israel.'}
          </p>

          {/* CTAs */}
          <div
            className={`flex items-center gap-3 md:gap-4 ${isHe ? 'flex-row-reverse justify-end' : ''}`}
            style={{ opacity: 0, animation: 'heroFadeUp 0.6s ease 1.1s forwards' }}
          >
            <button
              onClick={() => router.push(`/${locale}/discover`)}
              className="group flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm transition-all duration-300"
              style={{
                backgroundColor: 'var(--flare)',
                color: '#fff',
                boxShadow: '0 0 28px rgba(255,77,46,0.35)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--flare-hover)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--flare)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              {isHe ? 'גלה את הקולקציה' : 'Shop the Drop'}
              <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${isHe ? 'rotate-180' : ''}`} />
            </button>

            {/* Search icon button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)';
              }}
            >
              <Search className="w-4 h-4" />
              {isHe ? 'חיפוש' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded Search overlay ───────────────────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,10,11,0.9)', backdropFilter: 'blur(20px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
        >
          <div
            className="w-full max-w-lg"
            style={{ animation: 'searchDropIn 0.25s ease both' }}
          >
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
                  className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-[var(--muted)]"
                  style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-xs shrink-0"
                  style={{ color: 'var(--muted)' }}
                >
                  {isHe ? 'סגור' : 'ESC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Layer 4: Order Ticker ─────────────────────────────────────────── */}
      <div
        className="relative z-20 mt-auto"
        style={{ opacity: 0, animation: 'heroFadeUp 0.5s ease 1.4s forwards' }}
      >
        <OrderTicker locale={locale as 'en' | 'he'} />
      </div>
    </section>
  );
}
