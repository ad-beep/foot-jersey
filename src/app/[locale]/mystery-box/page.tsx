import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/constants';
import { REVIEWS } from '@/data/reviews';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'Mystery Box — חולצת הפתעה | FootJersey' : 'Mystery Box — Surprise Jersey | FootJersey',
    description: isHe
      ? 'הזמן Mystery Box של FootJersey וקבל חולצת כדורגל מפתיעה! רטרו, מונדיאל, מהדורה מיוחדת ועוד. מתחיל מ-₪99.'
      : 'Order a FootJersey Mystery Box and receive a surprise football jersey! Retro, World Cup, Special Edition and more. From ₪99.',
    alternates: {
      canonical: `${SITE_URL}/${params.locale}/mystery-box`,
      languages: { en: `${SITE_URL}/en/mystery-box`, he: `${SITE_URL}/he/mystery-box` },
    },
  };
}

export default function MysteryBoxPage({ params }: { params: { locale: string } }) {
  const isHe = params.locale === 'he';
  const locale = params.locale;
  const mysteryReviews = REVIEWS.filter((r) => r.product === 'mystery-box');

  const boxes = [
    {
      slug: 'retro-mystery',
      price: 109,
      emoji: '📼',
      en: { name: 'Retro Mystery', desc: 'A legendary kit from the 90s or 2000s. Your chance to own a piece of football history.' },
      he: { name: 'רטרו מיסטרי', desc: 'ערכה אגדית מהשנות ה-90 או ה-2000. הסיכוי שלך להחזיק חלק מהיסטוריית הכדורגל.' },
    },
    {
      slug: 'season-mystery',
      price: 99,
      emoji: '⚽',
      en: { name: '25/26 Season Mystery', desc: 'A current season jersey from one of the top leagues. Could be anyone.' },
      he: { name: 'מיסטרי עונה 25/26', desc: 'חולצת עונה נוכחית מאחת הליגות המובילות. יכול להיות כל קבוצה.' },
    },
    {
      slug: 'world-cup-mystery',
      price: 99,
      emoji: '🏆',
      en: { name: 'World Cup 2026 Mystery', desc: 'A national team jersey from the upcoming World Cup. Which country will you get?' },
      he: { name: 'מונדיאל 2026 מיסטרי', desc: 'חולצת נבחרת לאומית למונדיאל הקרוב. איזו מדינה תקבל?' },
    },
    {
      slug: 'mixed-mystery',
      price: 109,
      emoji: '🎲',
      en: { name: 'Mixed Mystery', desc: 'Could be anything — retro, current season, World Cup, or special. Maximum surprise.' },
      he: { name: 'מיקס מיסטרי', desc: 'יכול להיות הכל — רטרו, עונה נוכחית, מונדיאל, או מיוחד. הפתעה מקסימלית.' },
    },
    {
      slug: 'special-mystery',
      price: 99,
      emoji: '✨',
      en: { name: 'Special Edition Mystery', desc: 'One of our most exclusive drops — special and limited edition jerseys.' },
      he: { name: 'מהדורה מיוחדת מיסטרי', desc: 'אחד מהדרופים הבלעדיים שלנו — חולצות מיוחדות ומוגבלות.' },
    },
    {
      slug: 'player-mystery',
      price: 109,
      emoji: '🌟',
      en: { name: 'Player Version Mystery', desc: 'Premium player-version quality. The best materials, exact stitching. A real treat.' },
      he: { name: 'גרסת שחקן מיסטרי', desc: 'איכות גרסת שחקן פרמיום. חומרים הטובים ביותר, תפירה מדויקת. פינוק אמיתי.' },
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>
      {/* Hero */}
      <div className="py-20 md:py-28 relative overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,77,46,0.08) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div className={`relative max-w-[700px] mx-auto px-4 md:px-6 text-center ${isHe ? 'text-right' : ''}`}>
          <p className="section-kicker mb-4 text-center">{isHe ? 'הפתעה בכל קופסא' : 'Surprise in Every Box'}</p>
          <h1
            className="font-playfair font-bold text-white mb-6 text-center"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)', letterSpacing: '-0.05em', lineHeight: 0.9 }}
          >
            Mystery<br />
            <span style={{ color: 'var(--flare)' }}>Box</span>
          </h1>
          <p className="text-base md:text-lg text-center mb-8" style={{ color: 'var(--muted)', maxWidth: '40ch', margin: '0 auto 2rem' }}>
            {isHe
              ? 'בחר קטגוריה. קבל חולצה. הפתעה מובטחת. תמיד שווה יותר ממה ששילמת.'
              : 'Choose a category. Get a jersey. Guaranteed surprise. Always worth more than you paid.'}
          </p>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wide"
            style={{ backgroundColor: 'rgba(255,77,46,0.15)', color: 'var(--flare)', border: '1px solid rgba(255,77,46,0.3)' }}
          >
            {isHe ? '🔥 פופולרי — לרוב אוזל' : '🔥 Popular — often sells out'}
          </div>
          {/* Sold counter */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <span style={{ fontSize: '1.1rem' }}>📦</span>
            <span className="font-mono font-bold text-lg" style={{ color: 'var(--gold)' }}>847+</span>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              {isHe ? 'קופסאות נמכרו' : 'mystery boxes sold'}
            </span>
          </div>
        </div>
      </div>

      {/* Boxes grid */}
      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {boxes.map((box) => {
            const content = isHe ? box.he : box.en;
            return (
              <Link
                key={box.slug}
                href={`/${locale}/category/mystery-box`}
                className="group flex flex-col p-6 rounded-xl transition-all duration-300 border border-[var(--border)] hover:border-[var(--flare)] hover:shadow-[0_0_30px_rgba(255,77,46,0.12)]"
                style={{ backgroundColor: 'var(--steel)', textDecoration: 'none' }}
              >
                <div className="text-3xl mb-4" aria-hidden="true">{box.emoji}</div>
                <div className={`flex items-center justify-between mb-2 ${isHe ? 'flex-row-reverse' : ''}`}>
                  <h3 className="font-semibold text-white text-base">{content.name}</h3>
                  <span className="font-mono font-bold text-lg" style={{ color: 'var(--gold)' }}>
                    ₪{box.price}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed flex-1 ${isHe ? 'text-right' : ''}`} style={{ color: 'var(--muted)' }}>
                  {content.desc}
                </p>
                <div
                  className={`mt-4 pt-4 border-t text-xs font-mono uppercase tracking-wide ${isHe ? 'text-right' : ''}`}
                  style={{ borderColor: 'var(--border)', color: 'var(--flare)' }}
                >
                  {isHe ? 'הזמן עכשיו →' : 'Order now →'}
                </div>
              </Link>
            );
          })}
        </div>

        {/* How it works */}
        <div className={`mt-14 ${isHe ? 'text-right' : ''}`}>
          <h2
            className="font-playfair font-bold text-white mb-8"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', letterSpacing: '-0.02em' }}
          >
            {isHe ? 'איך זה עובד' : 'How it works'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                en: { title: 'Choose a box', desc: 'Pick the category that excites you most. Retro, current, World Cup, or mixed.' },
                he: { title: 'בחר קופסא', desc: 'בחר את הקטגוריה שמרגשת אותך ביותר. רטרו, נוכחית, מונדיאל, או מעורב.' },
              },
              {
                num: '02',
                en: { title: 'We pick for you', desc: 'Our team hand-picks a jersey from that category. Always quality, always with value.' },
                he: { title: 'אנחנו בוחרים בשבילך', desc: 'הצוות שלנו בוחר ידנית חולצה מאותה קטגוריה. תמיד איכות, תמיד שווה.' },
              },
              {
                num: '03',
                en: { title: 'Unbox & enjoy', desc: 'Your mystery jersey arrives in 2-4 weeks. The reveal moment is half the fun.' },
                he: { title: 'פתח ותהנה', desc: 'החולצה המסתורית שלך מגיעה תוך 2-4 שבועות. רגע החשיפה הוא חצי מהכיף.' },
              },
            ].map((step) => {
              const c = isHe ? step.he : step.en;
              return (
                <div key={step.num} className={`p-5 rounded-xl ${isHe ? 'text-right' : ''}`} style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}>
                  <div className="font-playfair font-bold text-3xl mb-3" style={{ color: 'var(--flare)', opacity: 0.5 }}>{step.num}</div>
                  <h3 className="font-semibold text-white text-sm mb-2">{c.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── What's inside? accordion ─────────────────────────────── */}
        <div className={`mt-10 ${isHe ? 'text-right' : ''}`}>
          <details className="group rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}>
            <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none select-none">
              <span className="font-semibold text-white text-base">
                {isHe ? 'מה יש בתוך קופסת המסתורין?' : "What's inside the Mystery Box?"}
              </span>
              <svg
                className="w-5 h-5 transition-transform duration-200 group-open:rotate-180 shrink-0"
                style={{ color: 'var(--gold)' }}
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
              <ul className="mt-4 space-y-2">
                {(isHe ? [
                  'חולצת כדורגל פרמיום אחת (קבוצה ועונה לפי קטגוריה)',
                  'יכולה להיות עונה נוכחית, קלאסיק, מונדיאל או מהדורה מיוחדת',
                  'כל החולצות חדשות עם תגיות',
                  'מידה לבחירתך',
                  'תמיד שווה יותר ממה ששילמת',
                ] : [
                  '1 premium football jersey (team & season based on category)',
                  'Could be current season, classic, World Cup, or special edition',
                  'All jerseys are brand new with tags',
                  'Size of your choice',
                  'Always worth more than you paid',
                ]).map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <span className="mt-0.5 shrink-0 text-xs" style={{ color: 'var(--gold)' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>

        {/* ── Customer reviews ─────────────────────────────────────── */}
        {mysteryReviews.length > 0 && (
          <div className={`mt-12 ${isHe ? 'text-right' : ''}`}>
            <h2
              className="font-playfair font-bold text-white mb-6"
              style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', letterSpacing: '-0.02em' }}
            >
              {isHe ? 'מה הלקוחות אומרים' : 'What customers are saying'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mysteryReviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl p-5"
                  style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
                >
                  <div className={`flex items-center gap-1 mb-3 ${isHe ? 'flex-row-reverse' : ''}`}>
                    {[1,2,3,4,5].map((i) => (
                      <span key={i} className="text-sm" style={{ color: i <= r.rating ? '#FFBE32' : 'rgba(255,190,50,0.25)' }}>★</span>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    &ldquo;{isHe && r.text.he ? r.text.he : r.text.en}&rdquo;
                  </p>
                  <div className={`flex items-center gap-2 ${isHe ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${r.avatarColor}`}
                    >
                      {r.avatarInitials}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{r.name}</p>
                      <p className="text-[10px] font-medium" style={{ color: '#4ade80' }}>✓ {isHe ? 'רכישה מאומתת' : 'Verified Purchase'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
