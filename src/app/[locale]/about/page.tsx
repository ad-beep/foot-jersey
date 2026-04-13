import type { Metadata } from 'next';
import Link from 'next/link';
import { localBusinessSchema } from '@/lib/schema';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'אודות FootJersey' : 'About FootJersey',
    description: isHe
      ? 'הסיפור מאחורי FootJersey — חנות חולצות הכדורגל המובילה בישראל. מי אנחנו, מה אנחנו מוכרים, ולמה אנחנו שונים.'
      : "The story behind FootJersey — Israel's leading football jersey store. Who we are, what we sell, and why we're different.",
    alternates: {
      canonical: `https://shopfootjersey.com/${params.locale}/about`,
      languages: {
        en: 'https://shopfootjersey.com/en/about',
        he: 'https://shopfootjersey.com/he/about',
      },
    },
  };
}

const CATEGORIES = [
  { slug: 'england',        en: 'Premier League',  he: 'פרמייר ליג' },
  { slug: 'spain',          en: 'La Liga',          he: 'לה ליגה' },
  { slug: 'italy',          en: 'Serie A',          he: 'סרייה A' },
  { slug: 'germany',        en: 'Bundesliga',       he: 'בונדסליגה' },
  { slug: 'france',         en: 'Ligue 1',          he: 'ליג 1' },
  { slug: 'retro',          en: 'Retro Classics',   he: 'רטרו קלאסיק' },
  { slug: 'world-cup-2026', en: 'World Cup 2026',   he: 'מונדיאל 2026' },
  { slug: 'drip',           en: 'Drip',             he: 'דריפ' },
  { slug: 'stussy-edition', en: 'Stussy Edition',   he: 'מהדורת סטוסי' },
  { slug: 'season-2526',    en: '25/26 Season',     he: 'עונת 25/26' },
  { slug: 'kids',           en: 'Kids',             he: 'ילדים' },
  { slug: 'special',        en: 'Special Edition',  he: 'מהדורה מיוחדת' },
];

export default function AboutPage({ params }: { params: { locale: string } }) {
  const isHe    = params.locale === 'he';
  const locale  = params.locale;
  const schema  = localBusinessSchema();

  const values = [
    {
      num: '01',
      en: { title: 'Quality First',    desc: 'Every jersey we sell is one we\'d wear ourselves. Authentic-quality reproductions, true to cut, badge, and colourway. No shortcuts.' },
      he: { title: 'איכות ראשונה',     desc: 'כל חולצה שאנחנו מוכרים היא כזו שהיינו לובשים בעצמנו. רפרודוקציות באיכות אותנטית, נאמנות לחיתוך, הסמל והצבעים. ללא פשרות.' },
    },
    {
      num: '02',
      en: { title: 'Real Service',     desc: 'Real people reply on WhatsApp in Hebrew & English — no bots, no scripts, no 48-hour wait. We treat every customer like a teammate.' },
      he: { title: 'שירות אמיתי',      desc: 'אנשים אמיתיים עונים ב-WhatsApp בעברית ואנגלית — לא בוטים, לא תסריטים, לא המתנה של 48 שעות. אנחנו מתייחסים לכל לקוח כמו לשחקן בקבוצה שלנו.' },
    },
    {
      num: '03',
      en: { title: 'Fair Prices',      desc: 'Premium jerseys starting from ₪100. Free shipping on 3+ jerseys. We believe fandom shouldn\'t cost a fortune — it should feel like one.' },
      he: { title: 'מחירים הוגנים',    desc: 'חולצות פרמיום מתחילות מ-₪100. משלוח חינם על 3+ חולצות. אנחנו מאמינים שאוהדות לא צריכה לעלות הון — רק להרגיש כמו הון.' },
    },
    {
      num: '04',
      en: { title: 'Stand Behind It',  desc: '30-day returns. Free replacement for damaged goods. No questions asked. We\'re here long after checkout — that\'s the promise.' },
      he: { title: 'עומדים מאחורי זה', desc: '30 יום להחזרה. החלפה חינמית למוצרים פגומים. ללא שאלות. אנחנו כאן הרבה אחרי הצ\'קאאוט — זה ההבטחה.' },
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>

        {/* ── Chalk masthead quote ────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden py-16 md:py-24"
          style={{ backgroundColor: 'var(--chalk)', borderBottom: '1px solid var(--chalk-dark)' }}
        >
          {/* Background editorial numeral */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
            aria-hidden="true"
          >
            <span
              className="font-playfair font-bold"
              style={{
                fontSize: 'clamp(20rem, 40vw, 40rem)',
                color: 'rgba(0,0,0,0.035)',
                letterSpacing: '-0.1em',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              FJ
            </span>
          </div>

          <div
            className={`relative max-w-[900px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}
          >
            <p
              className="font-mono text-[10px] uppercase tracking-[0.3em] mb-6"
              style={{ color: '#6B6B6F' }}
            >
              {isHe ? 'על FootJersey' : 'About FootJersey'}
            </p>
            <blockquote>
              <p
                className="font-playfair font-bold italic"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 3.25rem)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                  color: '#111',
                  maxWidth: '22ch',
                }}
              >
                {isHe
                  ? '"כדורגל הוא לא רק משחק. הוא זיכרון, זהות, שייכות."'
                  : '"Football isn\'t just a game. It\'s memory, identity, belonging."'}
              </p>
              <footer
                className="font-mono text-[10px] uppercase tracking-[0.25em] mt-6"
                style={{ color: '#888' }}
              >
                {isHe ? '— למה בנינו את FootJersey' : '— Why we built FootJersey'}
              </footer>
            </blockquote>
          </div>
        </div>

        {/* ── Origin story ────────────────────────────────────────────────── */}
        <div
          className="py-16 md:py-24"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className={`max-w-[900px] mx-auto px-4 md:px-6 grid md:grid-cols-[1fr_2fr] gap-10 items-start ${isHe ? 'md:grid-cols-[2fr_1fr]' : ''}`}
          >
            {/* Left: label */}
            <div className={isHe ? 'text-right' : ''}>
              <p className="section-kicker mb-3">
                {isHe ? 'הסיפור שלנו' : 'Our Story'}
              </p>
              <div
                className="font-playfair font-bold"
                style={{
                  fontSize: 'clamp(4rem, 10vw, 8rem)',
                  color: 'rgba(200,162,75,0.12)',
                  lineHeight: 0.9,
                  letterSpacing: '-0.05em',
                }}
                aria-hidden="true"
              >
                {isHe ? 'מאחורי' : 'Behind'}
              </div>
            </div>

            {/* Right: copy */}
            <div className={isHe ? 'text-right' : ''}>
              <h1
                className="font-playfair font-bold text-white mb-6"
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                }}
              >
                {isHe
                  ? 'בנוי על ידי אוהדים, עבור אוהדים.'
                  : 'Built by fans, for fans.'}
              </h1>
              <p
                className="text-base leading-relaxed mb-5"
                style={{ color: 'rgba(255,255,255,0.72)' }}
              >
                {isHe
                  ? 'FootJersey נוסדה ב-2023 מתוך תשוקה אמיתית לכדורגל ותסכול מהאפשרויות הקיימות בישראל. רצינו ליצור מקום אחד שבו כל אוהד יכול למצוא את החולצה שהוא מחפש — בין אם מדובר בחולצה חדשה של הקבוצה האהובה עליו, רטרו קלאסי מהשנות ה-90, חולצת מונדיאל 2026, או מהדורה מיוחדת שלא ניתן למצוא בשום מקום אחר.'
                  : 'FootJersey was founded in 2023 out of a genuine passion for football and frustration with the existing options in Israel. We wanted to create one place where every fan could find the jersey they\'re looking for — a new kit from their favorite club, a 90s retro classic, a World Cup 2026 shirt, or a special edition you can\'t find anywhere else.'}
              </p>
              <p
                className="text-base leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.72)' }}
              >
                {isHe
                  ? 'אנחנו לא חנות — אנחנו קהילה. כל הזמנה, כל שאלה ב-WhatsApp, כל חולצה שאנחנו בוחרים בקפידה — כולם חלק מאותה מחויבות: לספק לאוהדי כדורגל בישראל את הבגד שהם מגיעים לו.'
                  : "We're not a store — we're a community. Every order, every WhatsApp message, every jersey we hand-pick is part of the same commitment: giving Israeli football fans the kit they deserve."}
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: 'var(--steel)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-[900px] mx-auto px-4 md:px-6 py-10">
            <div className="grid grid-cols-3 gap-6">
              {[
                { num: '2023',  en: 'Founded',        he: 'שנת הייסוד' },
                { num: '17',    en: 'Collections',    he: 'קולקציות' },
                { num: '120+',  en: 'Orders shipped', he: 'הזמנות שנשלחו' },
              ].map((stat) => (
                <div key={stat.num} className={`text-center ${isHe ? '' : ''}`}>
                  <div
                    className="font-playfair font-bold"
                    style={{
                      fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                      color: 'var(--gold)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {stat.num}
                  </div>
                  <div
                    className="font-mono text-[10px] uppercase tracking-widest mt-1"
                    style={{ color: 'var(--muted)' }}
                  >
                    {isHe ? stat.he : stat.en}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Numbered values ─────────────────────────────────────────────── */}
        <div className="max-w-[900px] mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className={`mb-12 ${isHe ? 'text-right' : ''}`}>
            <p className="section-kicker mb-3">{isHe ? 'מה שמנחה אותנו' : 'What guides us'}</p>
            <h2
              className="font-playfair font-bold text-white"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
            >
              {isHe ? 'עקרונות, לא רק ערכים.' : 'Principles, not just values.'}
            </h2>
          </div>

          <div className="space-y-0">
            {values.map((v, i) => {
              const c = isHe ? v.he : v.en;
              return (
                <div
                  key={v.num}
                  className={`flex gap-6 py-8 ${isHe ? 'flex-row-reverse text-right' : ''} ${i < values.length - 1 ? 'border-b' : ''}`}
                  style={{ borderColor: 'var(--border)' }}
                >
                  {/* Number */}
                  <span
                    className="font-mono font-bold shrink-0 mt-0.5"
                    style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.1em', minWidth: '28px' }}
                  >
                    {v.num}
                  </span>

                  {/* Content */}
                  <div className="flex-1">
                    <h3
                      className="font-semibold text-white mb-2"
                      style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}
                    >
                      {c.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '60ch' }}
                    >
                      {c.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Category filmstrip ───────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--steel)' }}>
          <div className="max-w-[900px] mx-auto px-4 md:px-6 py-12">
            <p className={`section-kicker mb-6 ${isHe ? 'text-right' : ''}`}>
              {isHe ? '17 קולקציות. קבוצה אחת.' : '17 Collections. One team.'}
            </p>
            {/* Horizontal scroll filmstrip */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ direction: 'ltr' }}>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${locale}/discover?collections=${cat.slug}`}
                  className="shrink-0 px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-wide transition-all duration-200 border hover:border-[var(--gold)] hover:text-white"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--muted)',
                    border: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isHe ? cat.he : cat.en}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Final CTA ────────────────────────────────────────────────────── */}
        <div className="py-16 md:py-20">
          <div className={`max-w-[900px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
            <p className="section-kicker mb-3">{isHe ? 'מוכן?' : 'Ready?'}</p>
            <h2
              className="font-playfair font-bold text-white mb-8"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
            >
              {isHe ? 'מצא את החולצה שמספרת את הסיפור שלך.' : 'Find the jersey that tells your story.'}
            </h2>
            <div className={`flex flex-wrap gap-3 ${isHe ? 'flex-row-reverse' : ''}`}>
              <Link
                href={`/${locale}/discover`}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ backgroundColor: 'var(--flare)', boxShadow: '0 0 28px rgba(255,77,46,0.3)' }}
              >
                {isHe ? 'עיין בכל החולצות' : 'Browse All Jerseys'}
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d={isHe ? 'M13 8H3M7 4l-4 4 4 4' : 'M3 8h10M9 4l4 4-4 4'} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.14)' }}
              >
                {isHe ? 'צור קשר' : 'Contact Us'}
              </Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
