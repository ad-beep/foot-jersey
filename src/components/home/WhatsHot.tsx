'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { Reveal } from '@/components/ui/reveal';
import type { Jersey, Locale } from '@/types';

interface WhatsHotProps {
  locale:     Locale;
  hotJerseys: Jersey[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Shortest signed offset from `active` to `index`, wrapping around `total`. */
function wrappedOffset(index: number, active: number, total: number): number {
  let d = index - active;
  if (d > total / 2)  d -= total;
  if (d < -total / 2) d += total;
  return d;
}

// ── Card position configs ─────────────────────────────────────────────────────

interface SlotStyle {
  rotateY: number;
  z: number;
  xDesktop: number;
  xMobile: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

const SLOTS: Record<number, SlotStyle> = {
  0: { rotateY: 0,   z: 0,    xDesktop: 0,   xMobile: 0,   scale: 1,    opacity: 1,   zIndex: 5 },
  1: { rotateY: -35,  z: -120, xDesktop: 290, xMobile: 195, scale: 0.85, opacity: 0.7, zIndex: 4 },
  2: { rotateY: -55,  z: -220, xDesktop: 500, xMobile: 340, scale: 0.7,  opacity: 0.4, zIndex: 3 },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function WhatsHot({ locale, hotJerseys }: WhatsHotProps) {
  const isHe  = locale === 'he';
  const total = hotJerseys.length;

  const sectionRef       = useRef<HTMLElement>(null);
  const lastInteraction  = useRef(0);
  const autoTimer        = useRef<ReturnType<typeof setInterval>>();
  const touchStartX      = useRef(0);
  const touchEndX        = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isInView,    setIsInView]    = useState(false);
  const [isPaused,    setIsPaused]    = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);

  // ── Responsive ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const cb = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  }, []);

  const cardWidth = isMobile ? 280 : 320;
  const maxOffset = isMobile ? 1 : 2;

  // ── Navigate (infinite loop) ────────────────────────────────────────────────
  const navigate = useCallback(
    (dir: 1 | -1) => {
      if (total === 0) return;
      setActiveIndex((p) => (p + dir + total) % total);
      lastInteraction.current = Date.now();
    },
    [total],
  );

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInView || total === 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isInView, navigate, total]);

  // ── Intersection observer ───────────────────────────────────────────────────
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Auto-play ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInView || isPaused || total === 0) return;
    autoTimer.current = setInterval(() => {
      if (Date.now() - lastInteraction.current > 2000) {
        setActiveIndex((p) => (p + 1) % total);
      }
    }, 4000);
    return () => clearInterval(autoTimer.current);
  }, [isInView, isPaused, total]);

  // ── Touch swipe ─────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current   = e.targetTouches[0].clientX;
    setIsPaused(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
    setIsPaused(false);
    lastInteraction.current = Date.now();
  }, [navigate]);

  // ── Section header (shared between skeleton & real) ─────────────────────────
  const header = (
    <Reveal>
      <div className="mb-8">
        <h2
          className="font-bold text-white text-3xl md:text-4xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          {isHe ? 'מה חם 🔥' : "What's Hot 🔥"}
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          {isHe ? 'החולצות שכולם מחפשים' : "The jerseys everyone's looking at"}
        </p>
      </div>
    </Reveal>
  );

  // ── Arrow button (reused left & right) ────────────────────────────────────
  const arrowBtn = (dir: 'left' | 'right') => (
    <button
      onClick={() => navigate(dir === 'left' ? -1 : 1)}
      className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full items-center justify-center transition-all duration-200"
      style={{
        [dir === 'left' ? 'left' : 'right']: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: 'var(--text-muted)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
      }}
      aria-label={dir === 'left' ? 'Previous' : 'Next'}
    >
      {dir === 'left'
        ? <ChevronLeft  className="w-5 h-5" />
        : <ChevronRight className="w-5 h-5" />}
    </button>
  );

  // ── Skeleton fallback ───────────────────────────────────────────────────────
  if (total === 0) {
    return (
      <section
        id="whats-hot"
        className="snap-start flex flex-col justify-center py-16 md:py-24"
        style={{
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: 'var(--bg-primary)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 w-full">
          {header}
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="shrink-0 w-[220px] md:w-[260px]">
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      id="whats-hot"
      className="snap-start flex flex-col justify-center py-16 md:py-24"
      style={{
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 w-full">
        {header}

        {/* ── 3D Carousel ──────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden select-none"
          style={{ height: isMobile ? 460 : 520 }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {total > 0 && arrowBtn('left')}
          {total > 0 && arrowBtn('right')}

          {hotJerseys.map((jersey, i) => {
            const offset    = wrappedOffset(i, activeIndex, total);
            const absOffset = Math.abs(offset);
            if (absOffset > maxOffset) return null;

            const slot     = SLOTS[absOffset];
            const sign     = offset > 0 ? 1 : offset < 0 ? -1 : 0;
            const isCenter = offset === 0;

            const rotateY    = sign * slot.rotateY;
            const translateX = sign * (isMobile ? slot.xMobile : slot.xDesktop);

            return (
              <motion.div
                key={jersey.id}
                className="absolute"
                style={{
                  left:       '50%',
                  top:        16,
                  width:      cardWidth,
                  marginLeft: -cardWidth / 2,
                  willChange: 'transform, opacity',
                  zIndex:     slot.zIndex,
                }}
                animate={{
                  rotateY,
                  x:       translateX,
                  z:       slot.z,
                  scale:   slot.scale,
                  opacity: slot.opacity,
                  y:       isCenter ? [0, -4, 0, 4, 0] : 0,
                }}
                transformTemplate={(_, generated) =>
                  `perspective(1200px) ${generated}`
                }
                transition={{
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  ...(isCenter && {
                    y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                  }),
                }}
                initial={false}
              >
                {/* Accent glow behind the center card */}
                {isCenter && (
                  <div
                    className="absolute -inset-1.5 rounded-2xl pointer-events-none"
                    style={{ boxShadow: '0 0 30px rgba(0,195,216,0.15)' }}
                  />
                )}
                <ProductCard jersey={jersey} priority={isCenter} />
              </motion.div>
            );
          })}
        </div>

        {/* ── Progress bar + counter ───────────────────────────────── */}
        <div className="mt-6 max-w-sm mx-auto">
          <div
            className="h-0.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--accent)' }}
              animate={{ width: `${((activeIndex + 1) / total) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
            {activeIndex + 1} / {total}
          </p>
        </div>
      </div>
    </section>
  );
}
