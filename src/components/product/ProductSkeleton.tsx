'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ProductSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Breadcrumbs skeleton */}
      <div className="flex gap-2 mb-6">
        <Skeleton variant="text" className="w-12" />
        <Skeleton variant="text" className="w-24" />
        <Skeleton variant="text" className="w-32" />
      </div>

      <div className="lg:flex lg:gap-10">
        {/* Image skeleton */}
        <div className="lg:w-[55%] shrink-0 mb-6 lg:mb-0">
          <Skeleton className="aspect-[3/4] w-full rounded-xl" />
          <div className="hidden lg:flex gap-2 mt-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="w-16 h-[85px] rounded-lg" />
            ))}
          </div>
        </div>

        {/* Info skeleton */}
        <div className="flex-1 space-y-4">
          <Skeleton variant="text" className="w-3/4 h-8" />
          <Skeleton variant="text" className="w-1/2 h-4" />
          <Skeleton variant="text" className="w-24 h-8 mt-2" />
          <div className="flex gap-2 mt-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="w-12 h-12 rounded-lg" />
            ))}
          </div>
          <Skeleton className="w-full h-48 rounded-xl mt-4" />
          <Skeleton className="w-full h-14 rounded-xl mt-4" />
        </div>
      </div>
    </div>
  );
}
