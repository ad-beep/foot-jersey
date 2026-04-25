'use client';

import { useEffect, useState, useMemo } from 'react';
import { Star, Check, PenLine } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { ReviewForm } from './ReviewForm';
import type { Review as StaticReview } from '@/data/reviews';

interface RealReview {
  id: string;
  jerseyId: string;
  rating: number;
  text: string;
  customerName: string;
  city: string;
  orderNumber: number | null;
  verified: boolean;
  createdAt: number | null;
}

interface ReviewListProps {
  jerseyId: string;
  jerseyName: string;
  staticReviews: StaticReview[];
}

const AVATAR_COLORS = [
  'bg-rose-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500',
  'bg-cyan-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500',
];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatDate(ms: number | null, isHe: boolean): string {
  if (!ms) return '';
  const d = new Date(ms);
  return d.toLocaleDateString(isHe ? 'he-IL' : 'en-US', { month: 'short', year: 'numeric' });
}

export function ReviewList({ jerseyId, jerseyName, staticReviews }: ReviewListProps) {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const [realReviews, setRealReviews] = useState<RealReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/reviews?jerseyId=${encodeURIComponent(jerseyId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setRealReviews(Array.isArray(data.reviews) ? data.reviews : []);
      })
      .catch(() => {
        if (!cancelled) setRealReviews([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jerseyId, refreshTick]);

  const hasReal = realReviews.length > 0;
  const hasStatic = staticReviews.length > 0;

  const aggregate = useMemo(() => {
    if (!hasReal) return null;
    const sum = realReviews.reduce((s, r) => s + (r.rating || 0), 0);
    return { avg: sum / realReviews.length, count: realReviews.length };
  }, [realReviews, hasReal]);

  // Hide nothing: show real first, then static as fillers if < 3 real
  const staticToShow = hasReal && realReviews.length >= 3 ? [] : staticReviews.slice(0, 3 - realReviews.length);

  if (!hasReal && !hasStatic && !loading) {
    // Still allow writing first review
    return (
      <section className="mt-12 mb-8">
        <div className="mb-6 px-4 md:px-0">
          <p className="section-kicker mb-2">{isHe ? 'ביקורות לקוחות' : 'Customer Reviews'}</p>
          <div className={`flex items-center justify-between gap-4 flex-wrap ${isHe ? 'flex-row-reverse' : ''}`}>
            <h2
              className="font-playfair font-bold text-white"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', letterSpacing: '-0.03em', lineHeight: 1.0 }}
            >
              {isHe ? 'היה הראשון לכתוב ביקורת' : 'Be the first to review'}
            </h2>
            <button
              onClick={() => setFormOpen(true)}
              className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition-colors ${isHe ? 'flex-row-reverse' : ''}`}
              style={{
                backgroundColor: 'rgba(200,162,75,0.12)',
                color: 'var(--gold)',
                border: '1px solid rgba(200,162,75,0.4)',
              }}
            >
              <PenLine className="w-4 h-4" />
              {isHe ? 'כתוב ביקורת' : 'Write a review'}
            </button>
          </div>
        </div>
        <ReviewForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          jerseyId={jerseyId}
          jerseyName={jerseyName}
          onSubmitted={() => setRefreshTick((n) => n + 1)}
        />
      </section>
    );
  }

  return (
    <section className="mt-12 mb-8">
      <div className="mb-6 px-4 md:px-0">
        <p className="section-kicker mb-2">{isHe ? 'ביקורות לקוחות' : 'Customer Reviews'}</p>
        <div className={`flex items-center justify-between gap-4 flex-wrap ${isHe ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 flex-wrap ${isHe ? 'flex-row-reverse' : ''}`}>
            <h2
              className="font-playfair font-bold text-white"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', letterSpacing: '-0.03em', lineHeight: 1.0 }}
            >
              {isHe ? 'מה אומרים הלקוחות' : 'What Customers Say'}
            </h2>
            {aggregate && (
              <div className={`flex items-center gap-2 ${isHe ? 'flex-row-reverse' : ''}`}>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4"
                      fill={i <= Math.round(aggregate.avg) ? '#FFBE32' : 'transparent'}
                      style={{ color: i <= Math.round(aggregate.avg) ? '#FFBE32' : 'rgba(255,190,50,0.35)' }}
                    />
                  ))}
                </div>
                <span className="font-mono text-sm font-bold text-white">{aggregate.avg.toFixed(1)}</span>
                <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                  {isHe ? `(${aggregate.count} ביקורות)` : `(${aggregate.count} reviews)`}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition-colors ${isHe ? 'flex-row-reverse' : ''}`}
            style={{
              backgroundColor: 'rgba(200,162,75,0.12)',
              color: 'var(--gold)',
              border: '1px solid rgba(200,162,75,0.4)',
            }}
          >
            <PenLine className="w-4 h-4" />
            {isHe ? 'כתוב ביקורת' : 'Write a review'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-0">
        {realReviews.slice(0, 6).map((r) => {
          const initials = initialsOf(r.customerName);
          const color = colorFromName(r.customerName);
          return (
            <div
              key={r.id}
              className="rounded-xl p-5"
              style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
            >
              <div className={`flex items-center justify-between gap-2 mb-3 ${isHe ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-1 ${isHe ? 'flex-row-reverse' : ''}`}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4"
                      fill={i <= r.rating ? '#FFBE32' : 'transparent'}
                      style={{ color: i <= r.rating ? '#FFBE32' : 'rgba(255,190,50,0.25)' }}
                    />
                  ))}
                </div>
                {r.createdAt && (
                  <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                    {formatDate(r.createdAt, isHe)}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
                &ldquo;{r.text}&rdquo;
              </p>
              <div className={`flex items-center gap-2.5 ${isHe ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${color}`}>
                  {initials}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {r.customerName}
                    {r.city ? ` · ${r.city}` : ''}
                  </p>
                  {r.verified && (
                    <p className={`text-[10px] font-medium flex items-center gap-1 ${isHe ? 'flex-row-reverse' : ''}`} style={{ color: '#4ade80' }}>
                      <Check className="w-3 h-3" />
                      {isHe ? 'רכישה מאומתת' : 'Verified Purchase'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {staticToShow.map((r) => (
          <div
            key={r.id}
            className="rounded-xl p-5"
            style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
          >
            <div className={`flex items-center gap-1 mb-3 ${isHe ? 'flex-row-reverse' : ''}`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="text-sm" style={{ color: i <= r.rating ? '#FFBE32' : 'rgba(255,190,50,0.25)' }}>★</span>
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
              &ldquo;{isHe && r.text.he ? r.text.he : r.text.en}&rdquo;
            </p>
            <div className={`flex items-center gap-2.5 ${isHe ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${r.avatarColor}`}
              >
                {r.avatarInitials}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{r.name} · {r.city}</p>
                <p className="text-[10px] font-medium" style={{ color: '#4ade80' }}>✓ {isHe ? 'רכישה מאומתת' : 'Verified Purchase'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ReviewForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        jerseyId={jerseyId}
        jerseyName={jerseyName}
        onSubmitted={() => setRefreshTick((n) => n + 1)}
      />
    </section>
  );
}
