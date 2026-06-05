import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';
import { REVIEWS } from '@/data/reviews';
import { MysteryBoxCards, MysteryLeagueCards } from './mystery-box-cards';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'Mystery Box — חולצת הפתעה | FootJersey' : 'Mystery Box — Surprise Jersey | FootJersey',
    description: isHe
      ? 'הזמן Mystery Box של FootJersey וקבל חולצת כדורגל מפתיעה! רטרו, מונדיאל, מהדורה מיוחדת ועוד. מתחיל מ-₪90.'
      : 'Order a FootJersey Mystery Box and receive a surprise football jersey! Retro, World Cup, Special Edition and more. From ₪90.',
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,77,46,0.12) 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px]"
            style={{ background: 'radial-gradient(ellipse, rgba(200,162,75,0.06) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px]"
            style={{ background: 'radial-gradient(ellipse, rgba(200,162,75,0.06) 0%, transparent 70%)' }} />
        </div>

        {/* Floating question marks */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <span className="absolute font-playfair font-black select-none" style={{ top: '12%', left: '6%',   fontSize: '5rem',   opacity: 0.04, transform: 'rotate(-20deg)', color: 'var(--gold)', lineHeight: 1 }}>?</span>
          <span className="absolute font-playfair font-black select-none" style={{ top: '60%', left: '3%',   fontSize: '3rem',   opacity: 0.06, transform: 'rotate(15deg)',  color: 'var(--flare)', lineHeight: 1 }}>?</span>
          <span className="absolute font-playfair font-black select-none" style={{ top: '25%', right: '5%',  fontSize: '7rem',   opacity: 0.04, transform: 'rotate(10deg)',  color: 'var(--gold)', lineHeight: 1 }}>?</span>
          <span className="absolute font-playfair font-black select-none" style={{ top: '70%', right: '4%',  fontSize: '4rem',   opacity: 0.05, transform: 'rotate(-8deg)',  color: 'var(--gold)', lineHeight: 1 }}>?</span>
          <span className="absolute font-playfair font-black select-none" style={{ top: '45%', left: '12%',  fontSize: '2.5rem', opacity: 0.07, transform: 'rotate(30deg)',  color: 'var(--gold)', lineHeight: 1 }}>?</span>
          <span className="absolute font-playfair font-black select-none" style={{ top: '15%', right: '15%', fontSize: '3.5rem', opacity: 0.05, transform: 'rotate(-12deg)', color: 'var(--gold)', lineHeight: 1 }}>?</span>
        </div>

        <div className="relative max-w-[800px] mx-auto px-4 md:px-6 text-center">
          <p className="section-kicker mb-5 text-center" style={{ color: 'var(--flare)' }}>
            {isHe ? '847+ קופסאות נמסרו' : '847+ boxes delivered'}
          </p>

          {/* Giant layered "?" */}
          <div className="relative inline-block mb-5" aria-hidden="true">
            <span className="font-playfair font-black select-none" style={{
              fontSize: 'clamp(7rem, 22vw, 13rem)', lineHeight: 0.85,
              color: 'transparent',
              WebkitTextStroke: '2px rgba(255,77,46,0.4)',
              filter: 'drop-shadow(0 0 40px rgba(255,77,46,0.2))',
              display: 'block',
            }}>?</span>
            <span className="absolute inset-0 font-playfair font-black select-none flex items-center justify-center" style={{
              fontSize: 'clamp(7rem, 22vw, 13rem)', lineHeight: 0.85,
              background: 'linear-gradient(135deg, var(--flare) 0%, var(--gold) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              opacity: 0.85,
            }}>?</span>
          </div>

          <h1 className="font-playfair font-bold text-white mb-5" style={{
            fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', letterSpacing: '-0.04em', lineHeight: 0.95,
          }}>
            {isHe ? 'קופסת הפתעה' : 'Mystery Box'}
          </h1>

          <p className="text-base md:text-lg mb-8" style={{ color: 'var(--muted)', maxWidth: '38ch', margin: '0 auto 2rem' }}>
            {isHe
              ? 'בחר קטגוריה. קבל חולצה. תמיד שווה יותר ממה ששילמת.'
              : 'Pick a category. Get a jersey. Always worth more than you paid.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wide"
              style={{ backgroundColor: 'rgba(255,77,46,0.12)', color: 'var(--flare)', border: '1px solid rgba(255,77,46,0.25)' }}>
              🔥 {isHe ? 'פופולרי' : 'Popular'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wide"
              style={{ backgroundColor: 'rgba(200,162,75,0.1)', color: 'var(--gold)', border: '1px solid rgba(200,162,75,0.2)' }}>
              ✓ {isHe ? 'תמיד שווה יותר' : 'Always worth more'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wide"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              📦 {isHe ? 'חדש עם תגיות' : 'New with tags'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Box cards (client component for hover effects) ──────────── */}
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pb-16">
        {/* Main 6 */}
        <MysteryBoxCards locale={locale} isHe={isHe} />

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] shrink-0 px-3 py-1.5 rounded-full"
            style={{ color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {isHe ? 'ספציפי לליגה' : 'League-specific'}
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* League-specific mystery boxes */}
        <MysteryLeagueCards locale={locale} isHe={isHe} />

        {/* ── How it works ─────────────────────────────────────────── */}
        <div className={`mt-16 ${isHe ? 'text-right' : ''}`}>
          <p className="section-kicker mb-3">{isHe ? 'תהליך' : 'The Process'}</p>
          <h2 className="font-playfair font-bold text-white mb-8"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
            {isHe ? 'איך זה עובד' : 'How it works'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                num: '01', icon: '📦',
                en: { title: 'Choose a box', desc: 'Pick the category that excites you most — retro, current season, World Cup, or go fully random with Mixed.' },
                he: { title: 'בחר קופסא', desc: 'בחר את הקטגוריה שמרגשת אותך — רטרו, עונה נוכחית, מונדיאל, או לגמרי אקראי עם מיקס.' },
              },
              {
                num: '02', icon: '🎯',
                en: { title: 'We hand-pick', desc: 'Our team selects a jersey from that category. Always brand new with tags. Always worth more than the price.' },
                he: { title: 'אנחנו בוחרים', desc: 'הצוות שלנו בוחר ידנית חולצה מאותה קטגוריה. תמיד חדש עם תגיות. תמיד שווה יותר.' },
              },
              {
                num: '03', icon: '🎁',
                en: { title: 'Unbox & enjoy', desc: 'Your surprise jersey arrives in 2–3 weeks. The reveal moment is half the experience.' },
                he: { title: 'פתח ותהנה', desc: 'החולצה המפתיעה מגיעה תוך 2–3 שבועות. רגע החשיפה הוא חצי מהחוויה.' },
              },
            ].map((step) => {
              const c = isHe ? step.he : step.en;
              return (
                <div key={step.num} className="relative rounded-xl p-6 overflow-hidden"
                  style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}>
                  <div className="absolute top-3 end-4 font-playfair font-black text-[4.5rem] leading-none select-none pointer-events-none"
                    aria-hidden="true" style={{ color: 'rgba(255,77,46,0.06)', letterSpacing: '-0.06em' }}>
                    {step.num}
                  </div>
                  <div className="text-2xl mb-3">{step.icon}</div>
                  <h3 className="font-semibold text-white text-sm mb-2">{c.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── What's inside accordion ───────────────────────────────── */}
        <div className={`mt-8 ${isHe ? 'text-right' : ''}`}>
          <details className="group rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}>
            <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none select-none">
              <span className="font-semibold text-white text-base">
                {isHe ? 'מה יש בתוך קופסת המסתורין?' : "What's inside?"}
              </span>
              <svg className="w-5 h-5 transition-transform duration-200 group-open:rotate-180 shrink-0"
                style={{ color: 'var(--gold)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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

        {/* ── Reviews ──────────────────────────────────────────────── */}
        {mysteryReviews.length > 0 && (
          <div className={`mt-12 ${isHe ? 'text-right' : ''}`}>
            <h2 className="font-playfair font-bold text-white mb-6"
              style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', letterSpacing: '-0.02em' }}>
              {isHe ? 'מה הלקוחות אומרים' : 'What customers say'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mysteryReviews.map((r) => (
                <div key={r.id} className="rounded-xl p-5"
                  style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}>
                  <div className={`flex items-center gap-1 mb-3 ${isHe ? 'flex-row-reverse' : ''}`}>
                    {[1,2,3,4,5].map((i) => (
                      <span key={i} className="text-sm" style={{ color: i <= r.rating ? '#FFBE32' : 'rgba(255,190,50,0.25)' }}>★</span>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    &ldquo;{isHe && r.text.he ? r.text.he : r.text.en}&rdquo;
                  </p>
                  <div className={`flex items-center gap-2 ${isHe ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${r.avatarColor}`}>
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
