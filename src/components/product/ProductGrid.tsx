'use client';

import { SearchX } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';
import type { Jersey } from '@/types';

interface ProductGridProps {
  jerseys: Jersey[];
  loading?: boolean;
  skeletonCount?: number;
  columns?: { mobile?: number; tablet?: number; desktop?: number };
  className?: string;
}

const COL_MAP: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
};

export function ProductGrid({
  jerseys,
  loading = false,
  skeletonCount = 8,
  columns,
  className,
}: ProductGridProps) {
  const { locale } = useLocale();
  const isHe = locale === 'he';

  const mobileCols  = COL_MAP[columns?.mobile  ?? 2] ?? 'grid-cols-2';
  const tabletCols  = COL_MAP[columns?.tablet  ?? 3] ?? 'grid-cols-3';
  const desktopCols = COL_MAP[columns?.desktop ?? 4] ?? 'grid-cols-4';

  const gridClass = `grid ${mobileCols} md:${tabletCols} lg:${desktopCols} gap-3 md:gap-4 px-4`;

  // Loading state
  if (loading) {
    return (
      <div className={cn(gridClass, className)}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (jerseys.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-20 gap-4 text-center', className)}>
        <SearchX className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
        <p className="text-lg font-semibold text-white">
          {isHe ? 'לא נמצאו חולצות' : 'No jerseys found'}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {isHe ? 'נסה לשנות את הסינון' : 'Try adjusting your filters'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn(gridClass, className)}>
      {jerseys.map((jersey, i) => (
        <Reveal key={jersey.id} delay={Math.min(i * 50, 300)}>
          <ProductCard jersey={jersey} priority={i < 8} />
        </Reveal>
      ))}
    </div>
  );
}
