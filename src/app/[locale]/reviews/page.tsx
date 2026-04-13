import type { Metadata } from 'next';
import Link from 'next/link';
import { reviewSchema } from '@/lib/schema';
import { REVIEWS, AGGREGATE_RATING, getSortedReviews } from '@/data/reviews';
import type { Locale } from '@/types';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe
      ? `ביקורות לקוחות — ${AGGREGATE_RATING.ratingValue}★ | FootJersey`
      : `Customer Reviews — ${AGGREGATE_RATING.ratingValue}★ | FootJersey`,
    description: isHe
      ? `קרא ביקורות אמיתיות של לקוחות FootJersey. דירוג ממוצע ${AGGREGATE_RATING.ratingValue}/5 מתוך ${AGGREGATE_RATING.reviewCount}+ ביקורות.`
      : `Read real FootJersey customer reviews. Average rating ${AGGREGATE_RATING.ratingValue}/5 from ${AGGREGATE_RATING.reviewCount}+ reviews.`,
  };
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={sz} viewBox="0 0 20 20" fill={s <= rating ? '#C8A24B' : '#2a2a2d'}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsPage({ params }: { params: { locale: string } }) {
  const locale  = (params.locale === 'he' ? 'he' : 'en') as Locale;
  const isHe    = locale === 'he';
  const sorted  = getSortedReviews();
  const featured = sorted[0];
  const rest     = sorted.slice(1);

  const schema = reviewSchema(
    'FootJersey Football Jerseys',
    `https://shopfootjersey.com/${locale}/reviews`,
    sorted.map((r) => ({
      author: r.name,
      reviewBody: r.text.en,
      ratingValue: r.rating,
      datePublished: r.date,
    })),
    AGGREGATE_RATING,
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>

        {/* ── Hero aggregate bar ───────────────────────────────────────────── */}
        <div className="py-16 md:py-24" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className={`max-w-[1000px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
            <p className="section-kicker mb-6">{isHe ? 'מה הלקוחות אומרים' : 'The Locker Room'}</p>

            <div className={`flex items-end gap-6 flex-wrap ${isHe ? 'flex-row-reverse' : ''}`}>
              {/* Big rating number */}
              <div
                className="font-playfair font-bold"
                style={{ fontSize: 'clamp(5rem, 12vw, 8rem)', color: 'var(--gold)', lineHeight: 0.9, letterSpacing: '-0.04em' }}
              >
                {AGGREGATE_RATING.ratingValue}
              </div>

              <div className="pb-2">
                <Stars rating={Math.round(AGGREGATE_RATING.ratingValue)} size="lg" />
                <p
                  className="font-mono text-xs uppercase tracking-widest mt-2"
                  style={{ color: 'var(--muted)' }}
                >
                  {isHe
                    ? `מתוך 5 · ${AGGREGATE_RATING.reviewCount}+ ביקורות מאומתות`
                    : `out of 5 · ${AGGREGATE_RATING.reviewCount}+ verified reviews`}
                </p>
              </div>

              {/* Rating breakdown bars */}
              <div className="flex flex-col gap-1.5 pb-2 flex-1 max-w-[200px]">
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = sorted.filter((r) => r.rating === n).length;
                  const pct   = sorted.length > 0 ? (count / sorted.length) * 100 : 0;
                  return (
                    <div key={n} className={`flex items-center gap-2 ${isHe ? 'flex-row-reverse' : ''}`}>
                      <span className="font-mono text-[9px]" style={{ color: 'var(--muted)', minWidth: '6px' }}>{n}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: pct > 50 ? 'var(--gold)' : 'var(--muted)' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Cover testimonial (chalk band) ──────────────────────────────── */}
        {featured && (
          <div
            className="relative overflow-hidden py-14 md:py-20"
            style={{ backgroundColor: 'var(--chalk)', borderBottom: '1px solid var(--chalk-dark)' }}
          >
            {/* Big decorative quotation mark */}
            <div
              className="absolute pointer-events-none select-none"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(20rem, 30vw, 28rem)',
                color: 'rgba(0,0,0,0.04)',
                lineHeight: 0.8,
                top: '-2rem',
                left: isHe ? 'auto' : '2rem',
                right: isHe ? '2rem' : 'auto',
                userSelect: 'none',
              }}
              aria-hidden="true"
            >
              &ldquo;
            </div>

            <div className={`relative max-w-[800px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
              <p
                className="font-mono text-[10px] uppercase tracking-[0.3em] mb-6"
                style={{ color: '#888' }}
              >
                {isHe ? 'ביקורת מומלצת' : 'Featured Review'}
              </p>

              <blockquote>
                <p
                  className="font-playfair font-bold italic mb-8"
                  style={{
                    fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
                    color: '#111',
                    lineHeight: 1.25,
                    letterSpacing: '-0.02em',
                    maxWidth: '32ch',
                  }}
                >
                  &ldquo;{(featured.text[locale === 'he' && featured.text.he ? 'he' : 'en']) as string}&rdquo;
                </p>
                <footer className={`flex items-center gap-3 ${isHe ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${featured.avatarColor}`}
                  >
                    {featured.avatarInitials}
                  </div>
                  <div className={isHe ? 'text-right' : ''}>
                    <p className="font-semibold text-sm" style={{ color: '#111' }}>{featured.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#888' }}>
                      {featured.city} · {featured.jersey}
                    </p>
                  </div>
                  <div className={isHe ? 'mr-auto' : 'ml-auto'}>
                    <Stars rating={featured.rating} />
                  </div>
                </footer>
              </blockquote>
            </div>
          </div>
        )}

        {/* ── Reviews grid ────────────────────────────────────────────────── */}
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-12">
          <div className="columns-1 md:columns-2 gap-5">
            {rest.map((review, idx) => {
              const text    = (review.text[locale === 'he' && review.text.he ? 'he' : 'en']) as string;
              const date    = new Date(review.date).toLocaleDateString(
                locale === 'he' ? 'he-IL' : 'en-US',
                { month: 'short', year: 'numeric' },
              );
              // Every 5th card: chalk background for visual rhythm
              const isChalk = (idx + 1) % 5 === 0;

              return (
                <div
                  key={review.id}
                  className={`break-inside-avoid mb-5 rounded-xl p-6 flex flex-col gap-4 ${isHe ? 'text-right' : ''}`}
                  style={{
                    backgroundColor: isChalk ? 'var(--chalk)' : 'var(--steel)',
                    border: `1px solid ${isChalk ? 'var(--chalk-dark)' : 'var(--border)'}`,
                  }}
                >
                  <div className={`flex items-center justify-between ${isHe ? 'flex-row-reverse' : ''}`}>
                    <Stars rating={review.rating} />
                    <span
                      className="font-mono text-[9px] uppercase tracking-wide"
                      style={{ color: isChalk ? '#888' : 'var(--muted)' }}
                    >
                      {date}
                    </span>
                  </div>

                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: isChalk ? 'rgba(17,17,17,0.8)' : 'rgba(255,255,255,0.82)' }}
                  >
                    &ldquo;{text}&rdquo;
                  </p>

                  <div
                    className={`flex items-center gap-3 pt-3 border-t ${isHe ? 'flex-row-reverse' : ''}`}
                    style={{ borderColor: isChalk ? 'var(--chalk-dark)' : 'var(--border)' }}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${review.avatarColor}`}
                    >
                      {review.avatarInitials}
                    </div>
                    <div className={`flex-1 min-w-0 ${isHe ? 'text-right' : ''}`}>
                      <p
                        className="font-semibold text-sm truncate"
                        style={{ color: isChalk ? '#111' : 'white' }}
                      >
                        {review.name}
                      </p>
                      <p
                        className="text-[10px] truncate"
                        style={{ color: isChalk ? '#888' : 'var(--muted)' }}
                      >
                        {review.city}
                      </p>
                    </div>
                    <span
                      className="font-mono text-[8px] uppercase tracking-wide px-2 py-1 rounded shrink-0"
                      style={{
                        backgroundColor: 'rgba(15,61,46,0.25)',
                        color: '#1A5C44',
                        border: '1px solid rgba(15,61,46,0.3)',
                      }}
                    >
                      {isHe ? '✓ מאומת' : '✓ Verified'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust footer */}
          <div
            className={`mt-10 p-6 rounded-xl ${isHe ? 'text-right' : ''}`}
            style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              {isHe
                ? '🔒 כל הביקורות מגיעות מלקוחות אמיתיים שביצעו הזמנה. אנחנו אוספים ביקורות דרך WhatsApp ואינסטגרם — לא דרך פלטפורמות חיצוניות.'
                : '🔒 All reviews come from real customers who placed an order. We collect reviews via WhatsApp and Instagram — not through third-party platforms.'}
            </p>
          </div>

          {/* CTA */}
          <div className={`mt-8 flex gap-3 ${isHe ? 'flex-row-reverse' : ''}`}>
            <Link
              href={`/${locale}/discover`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: 'var(--flare)', boxShadow: '0 0 24px rgba(255,77,46,0.28)' }}
            >
              {isHe ? 'קנה עכשיו' : 'Shop Now'}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              {isHe ? 'שאלות? צור קשר' : 'Questions? Contact us'}
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}
