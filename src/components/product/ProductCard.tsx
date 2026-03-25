'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Shirt } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useHydration } from '@/hooks/useHydration';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, getJerseyName } from '@/lib/utils';
import { CURRENCY } from '@/lib/constants';
import type { Jersey, JerseyType, Size } from '@/types';

// ─── Constants ────────────────────────────────────────────────
const BADGE_TYPES = new Set<JerseyType>(['retro', 'special', 'kids', 'drip']);

const TYPE_LABELS: Record<JerseyType, { en: string; he: string }> = {
  regular: { en: 'Regular', he: 'רגיל'  },
  retro:   { en: 'Retro',   he: 'רטרו'  },
  kids:    { en: 'Kids',    he: 'ילדים' },
  special: { en: 'Special', he: 'מיוחד' },
  coat:    { en: 'Coat',    he: 'מעיל'  },
  drip:    { en: 'Drip',    he: 'דריפ'  },
  scarf:   { en: 'Scarf',   he: 'צעיף'  },
};

// ─── Props ────────────────────────────────────────────────────
interface ProductCardProps {
  jersey: Jersey;
  priority?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────
export const ProductCard = React.memo(function ProductCard({
  jersey,
  priority = false,
  className,
}: ProductCardProps) {
  const { locale }     = useLocale();
  const hydrated       = useHydration();
  const isFav          = useFavoritesStore((s) => s.isFavorite(jersey.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const addItem        = useCartStore((s) => s.addItem);
  const savedSize      = useAuthStore((s) => s.user?.savedSize ?? null);
  const savedKidsSize  = useAuthStore((s) => s.user?.savedKidsSize ?? null);
  const recordInteraction = useAnalyticsStore((s) => s.recordInteraction);
  const recordCartAdd  = useAnalyticsStore((s) => s.recordCartAdd);
  const { toast }      = useToast();

  const [imgError, setImgError] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);

  const isHe        = locale === 'he';
  const displayName = getJerseyName(jersey, locale);
  const typeLabel   = TYPE_LABELS[jersey.type];
  const href        = `/${locale}/product/${jersey.id}`;
  const showBadge   = BADGE_TYPES.has(jersey.type);

  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(jersey.id);
    setHeartPulse(true);
    setTimeout(() => setHeartPulse(false), 300);

    const wasFav = useFavoritesStore.getState().isFavorite(jersey.id);
    toast({
      title: wasFav
        ? (isHe ? 'נוסף למועדפים' : 'Added to favorites')
        : (isHe ? 'הוסר מהמועדפים' : 'Removed from favorites'),
      variant: 'info',
    });

    try { recordInteraction(jersey.id, 'like'); } catch {}
  }, [jersey.id, toggleFavorite, recordInteraction, toast, isHe]);

  const handleQuickAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isKids = jersey.type === 'kids';
    const preferred = isKids ? savedKidsSize : savedSize;
    const size = preferred ? (preferred as Size) : jersey.availableSizes[0] ?? 'M';
    addItem(jersey, size);
    toast({
      title: isHe ? 'נוסף לסל' : 'Added to cart',
      description: displayName,
      variant: 'success',
    });

    try {
      recordCartAdd(jersey.id);
      recordInteraction(jersey.id, 'cart');
    } catch {}
  }, [jersey, addItem, savedSize, savedKidsSize, recordCartAdd, recordInteraction, toast, isHe, displayName]);

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col rounded-xl overflow-hidden',
        'bg-[var(--bg-secondary)] border border-[var(--border)]',
        'transition-all duration-300 hover:border-[rgba(0,195,216,0.3)] hover:shadow-md',
        className,
      )}
      aria-label={displayName}
    >
      {/* Image area */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)]">
            <Shirt className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : (
          <Image
            src={jersey.imageUrl}
            alt={displayName}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            onError={() => setImgError(true)}
          />
        )}

        {/* Like button — top left */}
        <button
          onClick={handleFavorite}
          className={cn(
            'absolute top-2.5 start-2.5 z-10 w-9 h-9 rounded-full flex items-center justify-center',
            'transition-all duration-200',
            heartPulse && 'scale-125',
          )}
          style={{
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0,0,0,0.4)',
            color: hydrated && isFav ? '#FF4D6D' : 'rgba(255,255,255,0.7)',
          }}
          aria-label={isHe ? 'הוסף למועדפים' : 'Toggle favorite'}
        >
          <Heart
            className="w-5 h-5"
            fill={hydrated && isFav ? 'currentColor' : 'none'}
            strokeWidth={2}
          />
        </button>

        {/* Type badge — top right */}
        {showBadge && (
          <Badge
            variant="accent"
            className="absolute top-2.5 end-2.5 z-10 text-[10px] px-2 py-0.5"
          >
            {isHe ? typeLabel.he : typeLabel.en}
          </Badge>
        )}

        {/* Hover overlay — desktop only */}
        <div
          className="absolute inset-0 flex items-end justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
          }}
          // Only show on hover-capable devices
          data-hover-overlay=""
        >
          <Button
            variant="primary"
            size="sm"
            onClick={handleQuickAdd}
            className="w-full"
          >
            {isHe ? 'הוסף לסל' : 'Add to Cart'}
          </Button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-white leading-tight truncate">
          {displayName}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {jersey.season} · {isHe ? typeLabel.he : typeLabel.en}
        </p>
        <p className="text-base font-bold mt-1" style={{ color: 'var(--accent)' }}>
          {CURRENCY}{jersey.price}
        </p>
      </div>
    </Link>
  );
});
