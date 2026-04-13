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
  const isHe = locale === 'he';
  const reviews = getSortedReviews();

  return (
    <section
      className="py-16 md:py-24"
      style={{ backgroundColor: 'var(--ink)', borderTop: '1px solid var(--border)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">

        {/* Header */}
        <Reveal>
          <div className={`flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 ${isHe ? 'text-right' : ''}`}>
            <div>
              <p className="section-kicker mb-3">
                {isHe ? 'לקוחות מרוצים' : 'The Locker Room'}
              </p>
              <h2
                className="font-playfair font-bold text-white"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1 }}
              >
                {isHe ? 'מה האוהדים אומרים' : 'What fans say'}
              </h2>
            </div>

            {/* Aggregate rating */}
            <div className={`flex items-center gap-3 ${isHe ? 'flex-row-reverse' : ''}`}>
              <div className="text-center">
                <div
                  className="font-playfair font-bold"
                  style={{ fontSize: '2.5rem', lineHeight: 1, color: 'var(--gold)' }}
                >
                  {AGGREGATE_RATING.ratingValue}
                </div>
                <StarRating rating={Math.round(AGGREGATE_RATING.ratingValue)} />
                <p className="font-mono text-[10px] mt-1 uppercase" style={{ color: 'var(--muted)' }}>
                  {isHe ? `${AGGREGATE_RATING.reviewCount}+ ביקורות` : `${AGGREGATE_RATING.reviewCount}+ reviews`}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((review, i) => (
            <Reveal key={review.id} delay={i * 60}>
              <ReviewCard review={review} locale={locale as 'en' | 'he'} />
            </Reveal>
          ))}
        </div>

        {/* Social proof footer */}
        <Reveal delay={400}>
          <div className={`mt-10 flex flex-wrap items-center gap-6 ${isHe ? 'flex-row-reverse' : ''}`}>
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
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              {isHe ? '🔒 תשלום מאובטח דרך PayPal + BIT' : '🔒 Secure payment via PayPal + BIT'}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
