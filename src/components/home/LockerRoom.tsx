'use client';

import { useLocale } from '@/hooks/useLocale';
import { Reveal } from '@/components/ui/reveal';
import { getSortedReviews, AGGREGATE_RATING } from '@/data/reviews';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-3.5 h-3.5"
          viewBox="0 0 20 20"
          style={{ color: star <= rating ? '#C8A24B' : '#2a2a2d' }}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review, locale }: { review: ReturnType<typeof getSortedReviews>[0]; locale: 'en' | 'he' }) {
  const isHe = locale === 'he';
  const text = review.text[locale === 'he' && review.text.he ? 'he' : 'en'] as string;
  const date = new Date(review.date).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-xl"
      style={{
        backgroundColor: 'var(--steel)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Stars + date */}
      <div className="flex items-center justify-between">
        <StarRating rating={review.rating} />
        <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>{date}</span>
      </div>

      {/* Review text */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.8)', direction: isHe && review.text.he ? 'rtl' : 'ltr' }}
      >
        &ldquo;{text}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-2.5 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${review.avatarColor}`}
          aria-hidden="true"
        >
          {review.avatarInitials}
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{review.name}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{review.city}</p>
            {review.verified && (
              <span
                className="font-mono text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(15,61,46,0.5)', color: '#1A5C44', border: '1px solid rgba(15,61,46,0.4)' }}
              >
                {isHe ? '✓ מאומת' : '✓ Verified'}
              </span>
            )}
          </div>
        </div>
        <p
          className="ml-auto text-[10px] italic truncate max-w-[100px]"
          style={{ color: 'var(--muted)', direction: 'ltr' }}
        >
          {review.jersey}
        </p>
      </div>
    </div>
  );
}

export function LockerRoom() {
  const { locale } = useLocale();
  const isHe    = locale === 'he';
  const reviews = getSortedReviews();
  const featured = reviews[0];
  const rest     = reviews.slice(1);

  return (
    <section
      className="overflow-hidden"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      {/* ── Featured pullquote — chalk band ──────────────────────────── */}
      {featured && (
        <div
          className="relative overflow-hidden py-12 md:py-16"
          style={{ backgroundColor: 'var(--chalk)', borderBottom: '1px solid var(--chalk-dark)' }}
        >
          {/* Decorative large quote mark */}
          <div
            className="absolute pointer-events-none select-none"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(16rem, 28vw, 26rem)',
              color: 'rgba(0,0,0,0.04)',
              lineHeight: 0.8,
              top: '-1.5rem',
              left: isHe ? 'auto' : '1rem',
              right: isHe ? '1rem' : 'auto',
            }}
            aria-hidden="true"
          >
            &ldquo;
          </div>
          <div className={`relative max-w-[900px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] mb-5" style={{ color: '#888' }}>
              {isHe ? 'לקוחות מרוצים' : 'The Locker Room'}
            </p>
            <blockquote>
              <p
                className="font-playfair font-bold italic mb-6"
                style={{
                  fontSize: 'clamp(1.4rem, 3.2vw, 2.4rem)',
                  color: '#111',
                  lineHeight: 1.22,
                  letterSpacing: '-0.02em',
                  maxWidth: '34ch',
                }}
              >
                &ldquo;{(featured.text[locale === 'he' && featured.text.he ? 'he' : 'en']) as string}&rdquo;
              </p>
              <footer className={`flex items-center gap-3 ${isHe ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${featured.avatarColor}`}>
                  {featured.avatarInitials}
                </div>
                <div className={isHe ? 'text-right' : ''}>
                  <p className="font-semibold text-sm" style={{ color: '#111' }}>{featured.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#888' }}>{featured.city}</p>
                </div>
                <div className={`flex gap-0.5 ${isHe ? 'mr-auto' : 'ml-auto'}`}>
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} viewBox="0 0 16 16" className="w-3.5 h-3.5" fill={s <= featured.rating ? '#C8A24B' : '#ccc'}>
                      <path d="M8 1l1.9 3.9L14 5.6l-3 2.9.7 4.1L8 10.4l-3.7 2.2.7-4.1-3-2.9 4.1-.7z" />
                    </svg>
                  ))}
                </div>
                <div
                  className="font-playfair font-bold"
                  style={{ fontSize: '2.2rem', color: 'rgba(200,162,75,0.25)', letterSpacing: '-0.04em', lineHeight: 1, marginLeft: isHe ? 0 : 'auto', marginRight: isHe ? 'auto' : 0 }}
                  aria-hidden="true"
                >
                  {AGGREGATE_RATING.ratingValue}★
                </div>
              </footer>
            </blockquote>
          </div>
        </div>
      )}

      {/* ── Reviews grid ─────────────────────────────────────────────── */}
      <div
        className="py-12 md:py-16"
        style={{ backgroundColor: 'var(--ink)' }}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((review, i) => (
              <Reveal key={review.id} delay={i * 60}>
                <ReviewCard review={review} locale={locale as 'en' | 'he'} />
              </Reveal>
            ))}
          </div>

          {/* Social proof footer */}
          <Reveal delay={300}>
            <div className={`mt-10 flex flex-wrap items-center gap-5 pt-8 border-t ${isHe ? 'flex-row-reverse' : ''}`} style={{ borderColor: 'var(--border)' }}>
              <a
                href="https://www.instagram.com/foot_jersey4"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
                style={{ color: 'var(--muted)' }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect width={20} height={20} x={2} y={2} rx={5} />
                  <circle cx={12} cy={12} r={5} />
                  <circle cx={17.5} cy={6.5} r={1.5} fill="currentColor" stroke="none" />
                </svg>
                @foot_jersey4
              </a>
              <a
                href="https://www.tiktok.com/@foot.jerseys4"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
                style={{ color: 'var(--muted)' }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.53a8.25 8.25 0 0 0 4.83 1.56V6.64a4.84 4.84 0 0 1-1.07.05Z" />
                </svg>
                @foot.jerseys4
              </a>
              <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                {isHe ? '🔒 PayPal + BIT' : '🔒 Secure · PayPal + BIT'}
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
