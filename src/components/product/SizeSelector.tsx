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
                backgroundColor: selected ? 'rgba(200,162,75,0.12)' : 'rgba(255,255,255,0.04)',
                color: selected ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
                border: selected ? '1px solid rgba(200,162,75,0.65)' : '1px solid var(--border)',
                boxShadow: selected ? '0 0 14px rgba(200,162,75,0.18), inset 0 0 8px rgba(200,162,75,0.07)' : 'none',
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
