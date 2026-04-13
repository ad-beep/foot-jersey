'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Shirt, Package, X } from 'lucide-react';
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
import { CURRENCY, KIDS_SIZES } from '@/lib/constants';
import type { Jersey, JerseyType, Size, KidsSize } from '@/types';

// ─── Constants ────────────────────────────────────────────────
const BADGE_TYPES = new Set<JerseyType>(['retro', 'special', 'kids', 'drip', 'world_cup', 'other_products']);

const TYPE_LABELS: Record<JerseyType, { en: string; he: string }> = {
  regular:        { en: 'Regular',   he: 'רגיל'  },
  retro:          { en: 'Retro',     he: 'רטרו'  },
  kids:           { en: 'Kids',      he: 'ילדים' },
  special:        { en: 'Special',   he: 'מיוחד' },
  drip:           { en: 'Drip',      he: 'דריפ'  },
  world_cup:      { en: 'World Cup', he: 'מונדיאל' },
  other_products: { en: 'Other',     he: 'אחר'   },
  stussy:         { en: 'Stussy',    he: 'סטוסי'  },
};

// ─── Props ────────────────────────────────────────────────────
interface ProductCardProps {
  jersey: Jersey;
  priority?: boolean;
  className?: string;
  imageSizes?: string;
  imageQuality?: number;
}

// ─── Component ────────────────────────────────────────────────
export const ProductCard = React.memo(function ProductCard({
  jersey,
  priority = false,
  className,
  imageSizes,
  imageQuality,
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

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);
  const [sizePickerOpen, setSizePickerOpen] = useState(false);
  const sizePickerRef = useRef<HTMLDivElement>(null);

  const isHe          = locale === 'he';
  const isMysteryBox  = jersey.category === 'mystery-box';
  const isKids        = jersey.type === 'kids';
  const displayName   = getJerseyName(jersey, locale);
  const typeLabel     = TYPE_LABELS[jersey.type];
  const href          = isMysteryBox
    ? `/${locale}/category/mystery-box`
    : `/${locale}/product/${jersey.id}`;
  const showBadge     = BADGE_TYPES.has(jersey.type);

  const sizes = isKids
    ? (KIDS_SIZES as readonly string[])
    : (jersey.availableSizes.length > 0 ? jersey.availableSizes : ['S', 'M', 'L', 'XL', 'XXL']);

  // Timeout fallback: if image hasn't loaded or errored after 8s, force placeholder
  useEffect(() => {
    if (isMysteryBox) return;
    const timer = setTimeout(() => {
      if (!imgLoaded) setImgError(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [isMysteryBox, jersey.imageUrl, imgLoaded]);

  // Close size picker on click outside
  useEffect(() => {
    if (!sizePickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (sizePickerRef.current && !sizePickerRef.current.contains(e.target as Node)) {
        setSizePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sizePickerOpen]);

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

  const openSizePicker = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSizePickerOpen(true);
  }, []);

  const handleSizeSelect = useCallback((size: string) => {
    addItem(jersey, size as Size);
    setSizePickerOpen(false);
    toast({
      title: isHe ? 'נוסף לסל' : 'Added to cart',
      description: `${displayName} — ${size}`,
      variant: 'success',
    });

    try {
      recordCartAdd(jersey.id);
      recordInteraction(jersey.id, 'cart');
    } catch {}
  }, [jersey, addItem, recordCartAdd, recordInteraction, toast, isHe, displayName]);

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col rounded-xl overflow-hidden',
        'bg-[var(--steel)] border border-[var(--border)]',
        'transition-all duration-300 hover:border-[rgba(200,162,75,0.35)] hover:shadow-md',
        className,
      )}
      aria-label={displayName}
    >
      {/* Image area */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {isMysteryBox ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-secondary)]">
            <Package className="w-16 h-16" style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-medium px-3 text-center leading-snug" style={{ color: 'var(--text-muted)' }}>
              {isHe ? 'קופסת הפתעה' : 'Mystery Box'}
            </span>
          </div>
        ) : imgError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/placeholder-jersey.svg"
              alt={displayName}
              className="w-full h-full object-contain p-4 opacity-60"
            />
          </div>
        ) : (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: 'var(--bg-elevated)' }} />
            )}
            <Image
              src={jersey.imageUrl}
              alt={displayName}
              fill
              sizes={imageSizes ?? '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 300px'}
              quality={imageQuality ?? 70}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
              onLoad={() => {
                console.log('[img ok]', jersey.imageUrl);
                setImgLoaded(true);
              }}
              onError={() => {
                console.warn('[img FAIL]', jersey.imageUrl);
                setImgError(true);
              }}
            />
          </>
        )}

        {/* Like button — top left */}
        <button
          onClick={handleFavorite}
          className={cn(
            'absolute top-2 start-2 z-10 w-11 h-11 rounded-full flex items-center justify-center',
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

        {/* Hover overlay — desktop only (hidden for mystery boxes) */}
        {!isMysteryBox && (
          <div
            className="absolute inset-0 flex items-end justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
            }}
            data-hover-overlay=""
          >
            <Button
              variant="primary"
              size="sm"
              onClick={openSizePicker}
              className="w-full"
            >
              {isHe ? 'הוסף לסל' : 'Add to Cart'}
            </Button>
          </div>
        )}

        {/* Size selector modal */}
        {sizePickerOpen && (
          <div
            ref={sizePickerRef}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSizePickerOpen(false); }}
              className="absolute top-2 end-2 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.1)' }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
              {isHe ? 'בחר מידה' : 'Select Size'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-[200px]">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSizeSelect(s); }}
                  className="min-w-[44px] h-11 px-2 rounded-lg text-xs font-bold transition-all duration-150 border"
                  style={{ color: '#fff', borderColor: 'var(--border)', backgroundColor: 'rgba(255,255,255,0.08)' }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = 'var(--gold)';
                    el.style.color = 'var(--gold)';
                    el.style.backgroundColor = 'rgba(200,162,75,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = 'var(--border)';
                    el.style.color = '#fff';
                    el.style.backgroundColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-0.5">
        <p className="text-sm font-semibold leading-tight truncate text-white">
          {displayName}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {isMysteryBox
            ? (isHe ? 'קופסת הפתעה' : 'Mystery Box')
            : `${jersey.season} · ${isHe ? typeLabel.he : typeLabel.en}`}
        </p>
        <p className="font-mono text-base font-bold mt-1" style={{ color: 'var(--gold)' }}>
          {CURRENCY}{jersey.price}
        </p>
      </div>
    </Link>
  );
});
