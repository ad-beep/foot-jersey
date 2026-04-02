'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown, Search } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { Button } from '@/components/ui/button';
import type { Jersey } from '@/types';

// ── Marquee constants ────────────────────────────────────────────────────────
const CARD_W  = 120;
const CARD_H  = 160;
const CARD_MR = 8;
const HALF    = 12;  // cards per half → 12 × 128px = 1536px
const STRIP_W = HALF * (CARD_W + CARD_MR); // 1536px — one full copy

const ROWS = [
  { dir: 'left'  as const, speed: 40 },
  { dir: 'right' as const, speed: 35 },
  { dir: 'left'  as const, speed: 45 },
  { dir: 'right' as const, speed: 38 },
];

// ── CSS fade-up helper ──────────────────────────────────────────────────────
const fadeUpStyle = (delaySec: number): React.CSSProperties => ({
  opacity: 0,
  animation: `heroFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) ${delaySec}s forwards`,
});

// ── Marquee Row (rAF-driven, no CSS keyframes) ─────────────────────────────
function MarqueeRow({
  images,
  dir,
  speed,
  eager = false,
}: {
  images: { id: string; imageUrl: string }[];
  dir: 'left' | 'right';
  speed: number;
  eager?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const pxPerMs = STRIP_W / (speed * 1000);
    let pos = dir === 'left' ? 0 : -STRIP_W;
    let prev = performance.now();
    let raf: number;

    const step = (now: number) => {
      const dt = Math.min(now - prev, 100); // cap to avoid jump after tab-switch
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

  // Fill one half by cycling through source images
  const half: typeof images = [];
  for (let i = 0; i < HALF; i++) half.push(images[i % images.length]);
  // Double → seamless loop (second copy fills the gap left by the first)
  const all = [...half, ...half];

  return (
    <div style={{ overflow: 'hidden', width: '100%' }}>
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          width: STRIP_W * 2,
          willChange: 'transform',
          transform: `translateX(${dir === 'left' ? 0 : -STRIP_W}px)`,
        }}
      >
        {all.map((j, i) => (
          <div
            key={`${j.id}-${i}`}
            style={{
              width: CARD_W,
              height: CARD_H,
              marginRight: CARD_MR,
              borderRadius: 12,
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: '#1a1a1a',
              position: 'relative',
            }}
          >
            <Image
              src={j.imageUrl}
              alt=""
              width={CARD_W}
              height={CARD_H}
              sizes="120px"
              quality={40}
              {...(eager && i < 4 ? { priority: true } : { loading: 'eager' as const })}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
interface LandingHeroProps {
  jerseys?: Jersey[];
}

export default function LandingHero({ jerseys = [] }: LandingHeroProps) {
  const { locale, isRtl } = useLocale();
  const router = useRouter();
  const isHe = locale === 'he';

  const [query, setQuery] = useState('');
  const [scrolledPast, setScrolledPast] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Only special edition jerseys for marquee background, shuffled for variety
  const pool = jerseys
    .filter((j) => j.imageUrl && j.type === 'special')
    .sort(() => Math.random() - 0.5)
    .slice(0, HALF * ROWS.length);
  const perRow = Math.max(1, Math.ceil(pool.length / ROWS.length));
  const chunks = ROWS.map((_, i) => {
    const chunk = pool.slice(i * perRow, (i + 1) * perRow);
    return chunk.length > 0 ? chunk : pool.slice(0, perRow);
  });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setScrolledPast(!e.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/${locale}/search?q=${encodeURIComponent(q)}`);
  };

  const scrollToAbout = () =>
    document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section
      ref={sectionRef}
      className="snap-start relative flex flex-col items-center justify-center overflow-hidden"
      style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Layer 0 — marquee background */}
      {pool.length > 0 && (
        <div
          className="absolute inset-0 z-0 overflow-hidden flex flex-col justify-evenly"
          style={{ opacity: 0.35, direction: 'ltr' }}
          aria-hidden="true"
        >
          {ROWS.map((row, i) => (
            <MarqueeRow key={i} images={chunks[i]} dir={row.dir} speed={row.speed} eager={i === 0} />
          ))}
        </div>
      )}

      {/* Layer 1 — dark overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(17,17,17,0.4), rgba(17,17,17,0.75) 50%, #111111)',
        }}
      />

      {/* Layer 2 — hero content */}
      <div className="relative z-20 text-center px-6 max-w-3xl mx-auto w-full flex flex-col items-center">
        <h1
          className="font-bold text-white mb-4 text-4xl md:text-5xl lg:text-6xl max-w-3xl mx-auto"
          style={{ ...fadeUpStyle(0.2), lineHeight: 1.12, letterSpacing: '-0.02em' }}
        >
          {isHe ? 'לקנות חולצה זה חוויה ששווה לחוות' : 'Buying a Jersey is an Experience Worth Having'}
        </h1>

        <p
          className="text-lg mb-8 max-w-xl mx-auto"
          style={{ ...fadeUpStyle(0.4), color: 'var(--text-secondary)' }}
        >
          {isHe ? 'חולצות כדורגל פרימיום, מיוצרות לאוהדים אמיתיים' : 'Premium football jerseys, crafted for true fans'}
        </p>

        <form
          onSubmit={handleSearch} className="w-full max-w-lg mb-8"
          style={fadeUpStyle(0.6)}
        >
          <div
            className="relative flex items-center h-14 rounded-full overflow-hidden transition-all duration-200 focus-within:shadow-[0_0_20px_rgba(0,195,216,0.15)]"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}
          >
            <Search className={`absolute w-5 h-5 ${isRtl ? 'right-5' : 'left-5'}`} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={isHe ? '...חפש חולצות' : 'Search jerseys...'}
              className={`w-full h-full bg-transparent text-lg text-white placeholder:text-[var(--text-muted)] outline-none ${isRtl ? 'pr-14 pl-5' : 'pl-14 pr-5'}`}
              style={{ direction: isRtl ? 'rtl' : 'ltr' }}
            />
          </div>
        </form>

        <div className="flex items-center justify-center gap-4" style={fadeUpStyle(0.8)}>
          <Button variant="primary" size="lg" onClick={() => router.push(`/${locale}/discover`)}>
            {isHe ? 'גלה' : 'Explore'}
          </Button>
          <Button variant="secondary" size="lg" onClick={scrollToAbout}>
            {isHe ? 'עלינו' : 'About Us'}
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      {!scrolledPast && (
        <div
          className="absolute bottom-6 z-20 flex flex-col items-center pointer-events-none"
          style={{ opacity: 0, animation: 'heroIndicatorIn 0.7s ease 1.2s forwards' }}
        >
          <ChevronDown className="w-6 h-6" style={{ color: 'var(--text-muted)', animation: 'heroBounce 1.5s ease-in-out infinite' }} />
        </div>
      )}
    </section>
  );
}
