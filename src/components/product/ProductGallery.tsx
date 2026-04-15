'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [errors, setErrors] = useState<Set<number>>(new Set());
  const [retryCounts, setRetryCounts] = useState<Record<number, number>>({});
  const [loadedSet, setLoadedSet] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const imgs = images.length > 0 ? images : [''];

  // Sync active index from scroll position
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(idx, imgs.length - 1));
  }, [imgs.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleImageError = useCallback((idx: number) => {
    setRetryCounts((prev) => {
      const current = prev[idx] ?? 0;
      if (current < 2) {
        return { ...prev, [idx]: current + 1 };
      }
      setErrors((e) => new Set(e).add(idx));
      return prev;
    });
  }, []);

  const goTo = useCallback((idx: number) => {
    setActiveIndex(idx);
    scrollRef.current?.scrollTo({ left: idx * (scrollRef.current.clientWidth ?? 0), behavior: 'smooth' });
  }, []);

  const renderImage = (src: string, idx: number, priority: boolean, fill: boolean, thumbnail = false) => {
    if (!src || errors.has(idx)) {
      return (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--steel)' }}>
          <Shirt className="w-16 h-16" style={{ color: 'var(--text-muted)' }} />
        </div>
      );
    }
    const retry = retryCounts[idx] ?? 0;
    const imgSrc = retry > 0 ? `${src}?retry=${retry}` : src;
    const isLoaded = loadedSet.has(idx);
    const sizesAttr = fill
      ? (thumbnail ? '64px' : '(max-width: 1024px) 100vw, 55vw')
      : undefined;
    return (
      <>
        {!isLoaded && (
          <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: 'var(--steel)' }} />
        )}
        <Image
          src={imgSrc}
          alt={`${alt} ${idx + 1}`}
          fill={fill}
          sizes={sizesAttr}
          quality={thumbnail ? 60 : 85}
          className="object-cover"
          priority={priority}
          onLoad={() => setLoadedSet((prev) => new Set(prev).add(idx))}
          onError={() => handleImageError(idx)}
        />
      </>
    );
  };

  return (
    <div>
      {/* ── Mobile: swipeable gallery ─────────────────────────── */}
      <div className="lg:hidden">
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide rounded-xl"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {imgs.map((src, i) => (
            <div
              key={i}
              className="relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden"
            >
              {renderImage(src, i, i === 0, true)}
            </div>
          ))}
        </div>

        {/* Dots */}
        {imgs.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Image ${i + 1}`}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === activeIndex ? 10 : 8,
                  height: i === activeIndex ? 10 : 8,
                  backgroundColor: i === activeIndex ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop: main image + thumbnails ──────────────────── */}
      <div className="hidden lg:block">
        {/* Main image */}
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3">
          {/* Crossfade: stack all images, only show active */}
          {imgs.map((src, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-300"
              style={{ opacity: i === activeIndex ? 1 : 0 }}
            >
              {renderImage(src, i, i === 0, true)}
            </div>
          ))}
        </div>

        {/* Thumbnails */}
        {imgs.length > 1 && (
          <div className="flex gap-2">
            {imgs.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'relative w-16 h-[85px] rounded-lg overflow-hidden shrink-0 transition-all duration-200',
                  'border-2',
                )}
                style={{
                  borderColor: i === activeIndex ? 'var(--gold)' : 'var(--border)',
                  opacity: i === activeIndex ? 1 : 0.6,
                }}
                aria-label={`View image ${i + 1}`}
              >
                {renderImage(src, i, false, true, true)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
