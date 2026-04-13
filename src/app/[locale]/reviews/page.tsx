import type { Metadata } from 'next';
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-4 h-4"
          viewBox="0 0 20 20"
          style={{ color: star <= rating ? '#C8A24B' : '#2a2a2d' }}
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'he' ? 'he' : 'en') as Locale;
  const isHe = locale === 'he';
  const sorted = getSortedReviews();

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
        {/* Header */}
        <div className="py-20 md:py-24" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className={`max-w-[1000px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
            <p className="section-kicker mb-4">{isHe ? 'מה הלקוחות אומרים' : 'The Locker Room'}</p>
            <h1
              className="font-playfair font-bold text-white mb-6"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', letterSpacing: '-0.04em', lineHeight: 1 }}
            >
              {isHe ? 'ביקורות לקוחות' : 'Customer Reviews'}
            </h1>

            {/* Aggregate */}
            <div className={`flex items-center gap-4 ${isHe ? 'flex-row-reverse' : ''}`}>
              <div
                className="font-playfair font-bold"
                style={{ fontSize: '3.5rem', color: 'var(--gold)', lineHeight: 1, letterSpacing: '-0.02em' }}
              >
                {AGGREGATE_RATING.ratingValue}
              </div>
              <div>
                <StarRating rating={Math.round(AGGREGATE_RATING.ratingValue)} />
                <p className="font-mono text-xs mt-1 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  {isHe
                    ? `${AGGREGATE_RATING.reviewCount}+ ביקורות מאומתות`
                    : `${AGGREGATE_RATING.reviewCount}+ verified reviews`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews grid */}
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sorted.map((review) => {
              const text = (review.text[locale === 'he' && review.text.he ? 'he' : 'en']) as string;
              const date = new Date(review.date).toLocaleDateString(
                locale === 'he' ? 'he-IL' : 'en-US',
                { month: 'long', year: 'numeric' },
              );
              return (
                <div
                  key={review.id}
                  className={`p-6 rounded-xl flex flex-col gap-4 ${isHe ? 'text-right' : ''}`}
                  style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
                >
                  <div className={`flex items-start justify-between ${isHe ? 'flex-row-reverse' : ''}`}>
                    <StarRating rating={review.rating} />
                    <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>{date}</span>
                  </div>

                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    &ldquo;{text}&rdquo;
                  </p>

                  <div className={`flex items-center gap-3 pt-3 border-t ${isHe ? 'flex-row-reverse' : ''}`} style={{ borderColor: 'var(--border)' }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${review.avatarColor}`}>
                      {review.avatarInitials}
                    </div>
                    <div className={`flex-1 ${isHe ? 'text-right' : ''}`}>
                      <p className="font-semibold text-white text-sm">{review.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{review.city}</p>
                    </div>
                    <span
                      className="font-mono text-[9px] uppercase tracking-wide px-2 py-1 rounded shrink-0"
                      style={{ backgroundColor: 'rgba(15,61,46,0.4)', color: '#1A5C44', border: '1px solid rgba(15,61,46,0.4)' }}
                    >
                      {isHe ? '✓ מאומת' : '✓ Verified'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust note */}
          <div
            className={`mt-10 p-5 rounded-xl text-sm ${isHe ? 'text-right' : ''}`}
            style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            <p>
              {isHe
                ? '🔒 כל הביקורות מגיעות מלקוחות אמיתיים שביצעו הזמנה. אנחנו מקבלים ביקורות דרך WhatsApp ואינסטגרם.'
                : '🔒 All reviews come from real customers who placed an order. We collect reviews via WhatsApp and Instagram.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
