'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'accent' | 'cta' | 'success' | 'error';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[rgba(255,255,255,0.1)] text-white',
  accent:  'bg-[rgba(0,195,216,0.2)] text-[var(--accent)] border border-[rgba(0,195,216,0.3)]',
  cta:     'bg-[rgba(255,140,0,0.2)] text-[var(--cta)]',
  success: 'bg-[rgba(0,200,83,0.2)] text-[var(--success)]',
  error:   'bg-[rgba(255,61,0,0.2)] text-[var(--error)]',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
