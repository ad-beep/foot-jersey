'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ProductSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Breadcrumbs skeleton */}
        <div className="flex gap-2 mb-6">
          <Skeleton variant="text" className="w-12" />
          <Skeleton variant="text" className="w-24" />
          <Skeleton variant="text" className="w-32" />
        </div>

        <div className="lg:flex lg:gap-12">
          {/* Image skeleton — matches real layout: lg:w-[52%] */}
          <div className="lg:w-[52%] shrink-0 mb-8 lg:mb-0">
            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            <div className="hidden lg:flex gap-2 mt-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="w-16 h-[85px] rounded-lg" />
              ))}
            </div>
          </div>

          {/* Info skeleton */}
          <div className="flex-1 lg:pt-2 space-y-4">
            {/* League kicker + season */}
            <div className="flex gap-2 items-center">
              <Skeleton variant="text" className="w-20 h-3" />
              <Skeleton variant="text" className="w-12 h-3" />
            </div>
            {/* Stars */}
            <Skeleton variant="text" className="w-28 h-3" />
            {/* Title + heart */}
            <div className="flex items-start justify-between gap-3">
              <Skeleton variant="text" className="w-3/4 h-9" />
              <Skeleton variant="circle" className="w-11 h-11 shrink-0" />
            </div>
            {/* Price */}
            <Skeleton variant="text" className="w-24 h-10 mt-2" />
            {/* Size buttons */}
            <div className="flex gap-2 mt-4">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="w-12 h-12 rounded-lg" />
              ))}
            </div>
            {/* Customization block */}
            <Skeleton className="w-full h-32 rounded-xl mt-4" />
            {/* CTA button */}
            <Skeleton className="w-full h-14 rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
