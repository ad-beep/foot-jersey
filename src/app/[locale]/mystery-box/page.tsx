import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/constants';
import { REVIEWS } from '@/data/reviews';

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

const BOXES = [
  {
    slug: 'retro-mystery',
    price: 100,
    symbol: "'90",
    accent: 'rgba(200,162,75,1)',
    accentGlow: 'rgba(200,162,75,0.35)',
    bg: '#120e04',
    en: {
      name: 'Retro Mystery',
      hint: '1980s — 2005',
      desc: 'A legendary kit from the golden eras. Could be 98 World Cup, a 90s Milan, a classic Barcelona.',
      inside: ['Classic club jersey', 'Pre-2006 era', 'Could be any team'],
    },
    he: {
      name: 'רטרו מיסטרי',
      hint: '1980 — 2005',
      desc: 'ערכה אגדית מתקופות הזהב. יכול להיות מונדיאל 98, מילאן של שנות ה-90, ברצלונה קלאסית.',
      inside: ['חולצת מועדון קלאסית', 'עידן לפני 2006', 'יכולה להיות כל קבוצה'],
    },
  },
  {
    slug: '2526-mystery',
    price: 90,
    symbol: '25',
    accent: 'rgba(15,200,110,1)',
    accentGlow: 'rgba(15,200,110,0.3)',
    bg: '#03100b',
    en: {
      name: '25/26 Season Mystery',
      hint: 'Current Season',
      desc: 'Fresh from the 25/26 season. Premier League, La Liga, Serie A — any top club. Brand new.',
      inside: ['Current season jersey', 'Top 5 leagues', 'Any club'],
    },
    he: {
      name: 'מיסטרי עונת 25/26',
      hint: 'עונה נוכחית',
      desc: 'טרי מעונת 25/26. פרמייר ליג, לה ליגה, סרייה A — כל מועדון מוביל. חדש עם תגיות.',
      inside: ['חולצת עונה נוכחית', '5 הליגות המובילות', 'כל מועדון'],
    },
  },
  {
    slug: 'world-cup-mystery',
    price: 90,
    symbol: 'WC',
    accent: 'rgba(100,165,255,1)',
    accentGlow: 'rgba(100,165,255,0.3)',
    bg: '#020c18',
    en: {
      name: 'World Cup 2026',
      hint: 'USA · CAN · MEX',
      desc: "A national team jersey from FIFA World Cup 2026. France? Brazil? Argentina? Won't know till it arrives.",
      inside: ['National team jersey', 'FIFA World Cup 2026', 'Any nation'],
    },
    he: {
      name: 'מונדיאל 2026 מיסטרי',
      hint: 'ארה"ב · קנדה · מקסיקו',
      desc: 'חולצת נבחרת לאומית ממונדיאל 2026. צרפת? ברזיל? ארגנטינה? לא תדע עד שיגיע.',
      inside: ['חולצת נבחרת לאומית', 'מונדיאל FIFA 2026', 'כל מדינה'],
    },
  },
  {
    slug: 'mixed-mystery',
    price: 100,
    symbol: '∞',
    accent: 'rgba(255,77,46,1)',
    accentGlow: 'rgba(255,77,46,0.35)',
    bg: '#100302',
    en: {
      name: 'Mixed Mystery',
      hint: 'Total Surprise',
      desc: 'Our wildcard. Could be retro, current season, World Cup, or special edition. Maximum surprise.',
      inside: ['Any era, any league', 'Highest surprise factor', 'Always worth more'],
    },
    he: {
      name: 'מיקס מיסטרי',
      hint: 'הפתעה מוחלטת',
      desc: "הג'וקר שלנו. יכול להיות רטרו, עונה נוכחית, מונדיאל, או מיוחד. הפתעה מקסימלית.",
      inside: ['כל עידן, כל ליגה', 'גורם ההפתעה הגבוה ביותר', 'תמיד שווה יותר'],
    },
  },
  {
    slug: 'special-edition-mystery',
    price: 90,
    symbol: '★',
    accent: 'rgba(210,130,255,1)',
    accentGlow: 'rgba(180,80,255,0.3)',
    bg: '#0c0515',
    en: {
      name: 'Special Edition',
      hint: 'Limited & Rare',
      desc: 'Limited and special edition jerseys — collabs, anniversary editions, unique designs. Rare by nature.',
      inside: ['Limited edition jersey', 'Special collab or design', 'Rare drop'],
    },
    he: {
      name: 'מהדורה מיוחדת מיסטרי',
      hint: 'מוגבל ונדיר',
      desc: 'חולצות מהדורה מיוחדת ומוגבלת — שיתופי פעולה, מהדורות יובל, עיצובים ייחודיים.',
      inside: ['חולצת מהדורה מוגבלת', 'שיתוף פעולה מיוחד', 'דרופ נדיר'],
    },
  },
  {
    slug: 'player-version-mystery',
    price: 100,
    symbol: 'PV',
    accent: 'rgba(255,205,55,1)',
    accentGlow: 'rgba(255,200,50,0.3)',
    bg: '#120a00',
    en: {
      name: 'Player Version',
      hint: 'Premium Quality',
      desc: 'The exact jersey worn on the pitch. Better materials, tighter fit, authentic stitching. A real treat.',
      inside: ['Player-version quality', 'Authentic materials', 'Any team or league'],
    },
    he: {
      name: 'גרסת שחקן מיסטרי',
      hint: 'איכות פרימיום',
      desc: 'אותה חולצה שמשחקים בה במגרש. חומרים טובים יותר, תפירה אמיתית.',
      inside: ['איכות גרסת שחקן', 'חומרים אותנטיים', 'כל קבוצה או ליגה'],
    },
  },
];

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
          {([
            { top: '12%', left: '6%',   size: '5rem',   opacity: 0.04, rotate: '-20deg' },
            { top: '60%', left: '3%',   size: '3rem',   opacity: 0.06, rotate: '15deg' },
            { top: '25%', right: '5%',  size: '7rem',   opacity: 0.04, rotate: '10deg' },
            { top: '70%', right: '4%',  size: '4rem',   opacity: 0.05, rotate: '-8deg' },
            { top: '45%', left: '12%',  size: '2.5rem', opacity: 0.07, rotate: '30deg' },
            { top: '15%', right: '15%', size: '3.5rem', opacity: 0.05, rotate: '-12deg' },
          ] as Array<{ top: string; left?: string; right?: string; size: string; opacity: number; rotate: string }>).map((q, i) => (
            <span key={i} className="absolute font-playfair font-black select-none" style={{
              top: q.top, left: q.left, right: q.right,
              fontSize: q.size, opacity: q.opacity,
              transform: `rotate(${q.rotate})`,
              color: 'var(--gold)', lineHeight: 1,
            }}>?</span>
          ))}
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

      {/* ── Box cards ──────────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {BOXES.map((box) => {
            const c = isHe ? box.he : box.en;
            const accentFaint  = box.accent.replace(/[\d.]+\)$/, '0.07)');
            const accentMid    = box.accent.replace(/[\d.]+\)$/, '0.45)');
            const accentBorder = box.accent.replace(/[\d.]+\)$/, '0.22)');
            const accentGlowFaint = box.accentGlow.replace(/[\d.]+\)$/, '0.12)');

            return (
              <Link
                key={box.slug}
                href={`/${locale}/category/mystery-box`}
                className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
                style={{ backgroundColor: box.bg, border: `1px solid ${accentBorder}`, textDecoration: 'none' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = box.accent.replace(/[\d.]+\)$/, '0.55)');
                  el.style.boxShadow = `0 0 40px ${box.accentGlow}, 0 0 80px ${box.accentGlow.replace(/[\d.]+\)$/, '0.15)')}`;
                  el.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = accentBorder;
                  el.style.boxShadow = '';
                  el.style.transform = '';
                }}
              >
                {/* Hover radial glow */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                  style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${accentFaint}, transparent 70%)` }} />

                {/* Giant background symbol */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" aria-hidden="true">
                  <span className="font-playfair font-black transition-transform duration-500 group-hover:scale-110" style={{
                    fontSize: 'clamp(8rem, 18vw, 10rem)',
                    color: 'transparent',
                    WebkitTextStroke: `1.5px ${box.accent.replace(/[\d.]+\)$/, '0.1)')}`,
                    letterSpacing: '-0.06em', lineHeight: 0.82,
                    transform: 'translateY(8%)',
                  }}>{box.symbol}</span>
                </div>

                {/* Sealed stamp + price */}
                <div className="relative z-10 px-5 pt-5 pb-2 flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.25em] px-2.5 py-1 rounded-full"
                    style={{ border: `1px solid ${accentMid}`, color: box.accent, background: accentGlowFaint }}>
                    {isHe ? 'חתום' : 'Sealed'}
                  </span>
                  <span className="font-mono font-bold text-xl" style={{ color: box.accent }}>₪{box.price}</span>
                </div>

                {/* Box visual panel */}
                <div className="relative z-10 mx-5 my-3 rounded-xl overflow-hidden flex items-center justify-center"
                  style={{
                    height: '130px',
                    background: `linear-gradient(135deg, ${box.accentGlow} 0%, rgba(0,0,0,0.4) 100%)`,
                    border: `1px solid ${box.accent.replace(/[\d.]+\)$/, '0.14)')}`,
                  }}>
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse 70% 70% at 50% 50%, ${box.accentGlow} 0%, transparent 70%)` }} />
                  {/* Gift ribbon lines */}
                  <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2"
                      style={{ background: `linear-gradient(to bottom, transparent, ${box.accent.replace(/[\d.]+\)$/, '0.18)')}, transparent)` }} />
                    <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
                      style={{ background: `linear-gradient(to right, transparent, ${box.accent.replace(/[\d.]+\)$/, '0.18)')}, transparent)` }} />
                  </div>
                  <span className="relative font-playfair font-black select-none transition-transform duration-500 group-hover:scale-110" style={{
                    fontSize: '5.5rem', lineHeight: 1.1,
                    background: `linear-gradient(135deg, ${box.accent} 0%, rgba(255,255,255,0.95) 100%)`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    filter: `drop-shadow(0 0 24px ${box.accentGlow})`,
                  }}>?</span>
                </div>

                {/* Text content */}
                <div className={`relative z-10 px-5 pb-5 flex flex-col gap-3 flex-1 ${isHe ? 'text-right' : ''}`}>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] mb-1" style={{ color: accentMid }}>
                      {c.hint}
                    </p>
                    <h3 className="font-bold text-white text-base leading-tight">{c.name}</h3>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
                    {c.desc}
                  </p>

                  <ul className="space-y-1 mt-auto">
                    {c.inside.map((item, i) => (
                      <li key={i} className={`flex items-center gap-2 text-[11px] ${isHe ? 'flex-row-reverse' : ''}`}
                        style={{ color: 'rgba(255,255,255,0.42)' }}>
                        <span style={{ color: accentMid, fontSize: '7px' }}>◆</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className={`flex items-center justify-between mt-3 pt-3 ${isHe ? 'flex-row-reverse' : ''}`}
                    style={{ borderTop: `1px solid ${box.accent.replace(/[\d.]+\)$/, '0.12)')}` }}>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: box.accent }}>
                      {isHe ? 'הזמן עכשיו' : 'Order now'}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
                      className={`transition-transform duration-300 ${isHe ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
                      style={{ color: box.accent }}>
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

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
                en: { title: 'Unbox & enjoy', desc: 'Your surprise jersey arrives in 2–4 weeks. The reveal moment is half the experience.' },
                he: { title: 'פתח ותהנה', desc: 'החולצה המפתיעה מגיעה תוך 2–4 שבועות. רגע החשיפה הוא חצי מהחוויה.' },
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
