'use client';

import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { ProductCard } from './ProductCard';
import { Reveal } from '@/components/ui/reveal';
import type { Jersey } from '@/types';

interface RecommendationsProps {
  currentJersey: Jersey;
  allJerseys: Jersey[];
}

export function Recommendations({ currentJersey, allJerseys }: RecommendationsProps) {
  const { locale, isRtl } = useLocale();
  const isHe = locale === 'he';
  const getScore = useAnalyticsStore((s) => s.getScore);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Math.abs handles RTL negative scrollLeft (Firefox/Safari)
    const absLeft = Math.abs(scrollLeft);
    setCanScrollPrev(absLeft > 8);
    setCanScrollNext(absLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  const scroll = useCallback((dir: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth < 640 ? 196 : 236; // w-[180px]+gap vs w-[220px]+gap
    const delta = dir === 'next' ? cardWidth * 2 : -cardWidth * 2;
    el.scrollBy({ left: isRtl ? -delta : delta, behavior: 'smooth' });
  }, [isRtl]);

  const recommendations = useMemo(() => {
    const others = allJerseys.filter((j) => j.id !== currentJersey.id);

    // Build candidates: same league first, then same type, then same season
    const sameLeague = others.filter((j) => j.league === currentJersey.league);
    const sameType = others.filter(
      (j) => j.type === currentJersey.type && j.league !== currentJersey.league,
    );
    const sameSeason = others.filter(
      (j) => j.season === currentJersey.season && j.league !== currentJersey.league && j.type !== currentJersey.type,
    );

    // Track same-league IDs for correct score boost (Set-based, order-independent)
    const sameLeagueIds = new Set(sameLeague.map((j) => j.id));

    const pool = [...sameLeague, ...sameType, ...sameSeason];
    // Deduplicate while preserving priority order
    const seen = new Set<string>();
    const candidates: Jersey[] = [];
    for (const j of pool) {
      if (!seen.has(j.id)) {
        seen.add(j.id);
        candidates.push(j);
      }
    }

    // Fill with remaining jerseys if pool is shallow
    if (candidates.length < 20) {
      for (const j of others) {
        if (!seen.has(j.id)) {
          candidates.push(j);
          seen.add(j.id);
        }
        if (candidates.length >= 20) break;
      }
    }

    // Score: base analytics + league affinity boost + type affinity boost
    return candidates
      .map((j) => ({
        jersey: j,
        score: getScore(j.id)
          + (sameLeagueIds.has(j.id) ? 3 : 0)
          + (j.type === currentJersey.type ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s) => s.jersey);
  }, [currentJersey, allJerseys, getScore]);

  if (recommendations.length === 0) return null;

  return (
    <section className="mt-12 mb-8">
      <Reveal>
        <div className="px-4 md:px-0 mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker mb-2">
              {isHe ? 'בחירות מותאמות' : 'Curated For You'}
            </p>
            <h2
              className="font-playfair font-bold text-white"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', letterSpacing: '-0.03em', lineHeight: 1.0 }}
            >
              {isHe ? 'אולי יעניין אותך גם' : 'You May Also Like'}
            </h2>
          </div>

          {/* Desktop scroll arrows */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={() => scroll('prev')}
              disabled={!canScrollPrev}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: canScrollPrev ? 'rgba(200,162,75,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${canScrollPrev ? 'rgba(200,162,75,0.3)' : 'var(--border)'}`,
                color: canScrollPrev ? 'var(--gold)' : 'var(--muted)',
                cursor: canScrollPrev ? 'pointer' : 'not-allowed',
              }}
              aria-label={isHe ? 'הקודם' : 'Previous'}
            >
              {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => scroll('next')}
              disabled={!canScrollNext}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: canScrollNext ? 'rgba(200,162,75,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${canScrollNext ? 'rgba(200,162,75,0.3)' : 'var(--border)'}`,
                color: canScrollNext ? 'var(--gold)' : 'var(--muted)',
                cursor: canScrollNext ? 'pointer' : 'not-allowed',
              }}
              aria-label={isHe ? 'הבא' : 'Next'}
            >
              {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </Reveal>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 md:px-0"
        style={{
          direction: isRtl ? 'rtl' : 'ltr',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {recommendations.map((jersey, i) => (
          <div
            key={jersey.id}
            className="shrink-0 w-[180px] md:w-[220px]"
            style={{ scrollSnapAlign: 'start' }}
          >
            <Reveal delay={Math.min(i * 40, 200)}>
              <ProductCard jersey={jersey} imageSizes="(max-width: 768px) 180px, 220px" imageQuality={65} />
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}
