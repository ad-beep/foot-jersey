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

export function Skeleton({ variant = 'rectangle', className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer',
        variantStyles[variant],
        className,
      )}
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
        backgroundSize: '200% 100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        ...style,
      }}
      {...props}
    />
  );
}
