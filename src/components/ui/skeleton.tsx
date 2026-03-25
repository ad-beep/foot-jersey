'use client';

import { cn } from '@/lib/utils';

type SkeletonVariant = 'rectangle' | 'circle' | 'text';

const variantStyles: Record<SkeletonVariant, string> = {
  rectangle: 'rounded-xl',
  circle:    'rounded-full',
  text:      'rounded-md h-4',
};

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

export function Skeleton({ variant = 'rectangle', className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-[rgba(255,255,255,0.05)] animate-shimmer bg-[length:200%_100%]',
        variantStyles[variant],
        className,
      )}
      style={{
        backgroundImage:
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
      }}
      {...props}
    />
  );
}
