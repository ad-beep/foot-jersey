'use client';

import { useMemo } from 'react';
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
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const getScore = useAnalyticsStore((s) => s.getScore);

  const recommendations = useMemo(() => {
    const others = allJerseys.filter((j) => j.id !== currentJersey.id);

    // Build candidates: same league, same type, same season
    const sameLeague = others.filter((j) => j.league === currentJersey.league);
    const sameType = others.filter(
      (j) => j.type === currentJersey.type && j.league !== currentJersey.league,
    );
    const sameSeason = others.filter(
      (j) => j.season === currentJersey.season && j.league !== currentJersey.league && j.type !== currentJersey.type,
    );

    const pool = [...sameLeague, ...sameType, ...sameSeason];
    // Deduplicate
    const seen = new Set<string>();
    const candidates: Jersey[] = [];
    for (const j of pool) {
      if (!seen.has(j.id)) {
        seen.add(j.id);
        candidates.push(j);
      }
    }

    // Fill with remaining jerseys if needed
    if (candidates.length < 20) {
      for (const j of others) {
        if (!seen.has(j.id)) {
          candidates.push(j);
          seen.add(j.id);
        }
        if (candidates.length >= 20) break;
      }
    }

    // Sort by analytics score (descending), keeping related jerseys prioritized
    return candidates
      .map((j, i) => ({
        jersey: j,
        score: getScore(j.id) + (i < sameLeague.length ? 2 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s) => s.jersey);
  }, [currentJersey, allJerseys, getScore]);

  if (recommendations.length === 0) return null;

  return (
    <section className="mt-12 mb-8">
      <Reveal>
        <h2 className="text-xl font-bold text-white mb-5 px-4 md:px-0">
          {isHe ? 'אולי יעניין אותך גם' : 'You May Also Like'}
        </h2>
      </Reveal>
      <div
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-4 md:px-0"
        style={{ direction: 'ltr' }}
      >
        {recommendations.map((jersey, i) => (
          <div key={jersey.id} className="shrink-0 w-[180px] md:w-[220px]">
            <Reveal delay={i * 50}>
              <ProductCard jersey={jersey} />
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}
