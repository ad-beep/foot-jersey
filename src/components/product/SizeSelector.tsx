'use client';

import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import { KIDS_SIZES, ALL_SIZES } from '@/lib/constants';
import type { Size, JerseyType } from '@/types';

interface SizeSelectorProps {
  availableSizes: Size[];
  selectedSize: Size | null;
  onSelect: (size: Size) => void;
  jerseyType: JerseyType;
  shake?: boolean;
}

export function SizeSelector({
  availableSizes,
  selectedSize,
  onSelect,
  jerseyType,
  shake = false,
}: SizeSelectorProps) {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const isKids = jerseyType === 'kids';

  // Use available sizes, or fall back to defaults
  const sizes = availableSizes.length > 0
    ? availableSizes
    : (isKids ? ([...KIDS_SIZES] as unknown as Size[]) : ([...ALL_SIZES] as unknown as Size[]));

  return (
    <div className={cn(shake && 'animate-[shake_0.4s_ease-in-out]')}>
      <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        {isHe ? 'מידה' : 'Size'}
      </p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={isHe ? 'בחר מידה' : 'Select size'}>
        {sizes.map((size) => {
          const selected = selectedSize === size;
          return (
            <button
              key={size}
              onClick={() => onSelect(size)}
              role="radio"
              aria-checked={selected}
              aria-label={size}
              className="min-w-[48px] h-[48px] rounded-lg flex items-center justify-center text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: selected ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                color: selected ? 'white' : 'var(--text-secondary)',
                border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
