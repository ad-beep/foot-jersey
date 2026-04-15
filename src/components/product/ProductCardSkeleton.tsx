'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProductCardSkeletonProps {
  className?: string;
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl overflow-hidden',
        'bg-[var(--steel)] border border-[var(--border)]',
        className,
      )}
    >
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-3 flex flex-col gap-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2 h-3" />
        <Skeleton variant="text" className="w-1/4 h-4 mt-1" />
      </div>
    </div>
  );
}
