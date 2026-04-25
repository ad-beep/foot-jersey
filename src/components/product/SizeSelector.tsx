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
  hideLabel?: boolean;
  onOutOfStockClick?: (size: Size) => void;
}

export function SizeSelector({
  availableSizes,
  selectedSize,
  onSelect,
  jerseyType,
  shake = false,
  hideLabel = false,
  onOutOfStockClick,
}: SizeSelectorProps) {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const isKids = jerseyType === 'kids';

  // Always render the full size range for the jersey type; mark sizes not in
  // `availableSizes` as out-of-stock so customers can still tap them to request
  // a back-in-stock alert.
  const allSizes = isKids ? ([...KIDS_SIZES] as unknown as Size[]) : ([...ALL_SIZES] as unknown as Size[]);
  const availableSet = new Set(availableSizes);
  const sizes = availableSizes.length > 0 ? allSizes : allSizes;

  return (
    <div className={cn(shake && 'animate-[shake_0.4s_ease-in-out]')}>
      {!hideLabel && (
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          {isHe ? 'מידה' : 'Size'}
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={isHe ? 'בחר מידה' : 'Select size'}>
        {sizes.map((size) => {
          const selected = selectedSize === size;
          const inStock = availableSet.has(size);
          const outOfStock = !inStock && availableSizes.length > 0;
          return (
            <button
              key={size}
              onClick={() => {
                if (outOfStock) {
                  onOutOfStockClick?.(size);
                } else {
                  onSelect(size);
                }
              }}
              role="radio"
              aria-checked={selected}
              aria-label={outOfStock ? `${size} — ${isHe ? 'אזל מהמלאי — לחץ כדי לקבל התראה' : 'Out of stock — tap to get notified'}` : size}
              className="relative min-w-[48px] h-[48px] rounded-lg flex items-center justify-center text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: selected ? 'rgba(200,162,75,0.12)' : outOfStock ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.04)',
                color: selected ? 'var(--gold)' : outOfStock ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                border: selected
                  ? '1px solid rgba(200,162,75,0.65)'
                  : outOfStock
                  ? '1px dashed rgba(255,255,255,0.08)'
                  : '1px solid var(--border)',
                boxShadow: selected ? '0 0 14px rgba(200,162,75,0.18), inset 0 0 8px rgba(200,162,75,0.07)' : 'none',
                textDecoration: outOfStock ? 'line-through' : 'none',
                cursor: outOfStock ? 'pointer' : undefined,
              }}
              title={outOfStock ? (isHe ? 'אזל מהמלאי — לחץ כדי לקבל התראה' : 'Out of stock — tap to get notified') : undefined}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
