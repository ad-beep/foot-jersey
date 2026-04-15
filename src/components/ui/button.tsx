'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'icon';
type Size = 'sm' | 'md' | 'lg';

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[var(--cta)] text-white font-bold uppercase tracking-wide hover:bg-[var(--cta-hover)] hover:shadow-[0_0_24px_rgba(255,77,46,0.4)] rounded-lg',
  secondary:
    'bg-transparent border border-[var(--gold)] text-[var(--gold)] hover:bg-[rgba(200,162,75,0.1)] rounded-lg',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white rounded-lg',
  icon:
    'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded-full',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-10 px-5 text-base',
  lg: 'h-12 px-8 text-lg',
};

const iconSize = 'w-11 h-11';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, asChild = false, children, ...props }, ref) => {
    const isDisabled = disabled || loading;
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]',
          'active:scale-[0.98]',
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          variantStyles[variant],
          variant === 'icon' ? iconSize : sizeStyles[size],
          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <span
            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
            role="status"
            aria-label="Loading"
          />
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button };
