'use client';

import Link from 'next/link';
import { MYSTERY_ACCENT } from '@/lib/mystery-jerseys';

export const BOXES = [
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
      desc: 'טרי מעונת 25/26. פרמייר ליג, לה ליגה, סרייה A — כל מועדון מוביל.',
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
      desc: "Our wildcard. Could be retro, current season, World Cup, or special edition. Maximum surprise.",
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
      desc: 'The exact jersey worn on the pitch. Better materials, tighter fit, authentic stitching.',
      inside: ['Player-version quality', 'Authentic materials', 'Any team or league'],
    },
    he: {
      name: 'גרסת שחקן מיסטרי',
      hint: 'איכות פרימיום',
      desc: 'אותה חולצה שמשחקים בה במגרש. חומרים טובים יותר, תפירה אמיתית.',
      inside: ['איכות גרסת שחקן', 'חומרים אותנטיים', 'כל קבוצה או ליגה'],
    },
  },
] as const;

// ─── League/collection-specific mystery boxes (10 items) ──────────────────
const MAIN_BOX_SLUGS: Set<string> = new Set(BOXES.map((b) => b.slug));

const LEAGUE_BOX_ENTRIES = Object.entries(MYSTERY_ACCENT).filter(
  ([slug]) => !MAIN_BOX_SLUGS.has(slug),
);

function MysteryCard({
  slug,
  locale,
  isHe,
}: {
  slug: string;
  locale: string;
  isHe: boolean;
}) {
  const m = MYSTERY_ACCENT[slug];
  if (!m) return null;
  const accent = m.accent;
  const accentFaint  = accent.replace(/[\d.]+\)$/, '0.07)');
  const accentMid    = accent.replace(/[\d.]+\)$/, '0.45)');
  const accentBorder = accent.replace(/[\d.]+\)$/, '0.22)');
  const label = isHe ? m.labelHe : m.labelEn;
  const hint  = isHe ? m.hintHe  : m.hintEn;
  const desc  = isHe ? m.descHe  : m.descEn;
  const inside = isHe ? m.insideHe : m.insideEn;

  return (
    <Link
      href={`/${locale}/product/${slug}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
      style={{ backgroundColor: m.bg, border: `1px solid ${accentBorder}`, textDecoration: 'none' }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = accent.replace(/[\d.]+\)$/, '0.55)');
        el.style.boxShadow = `0 0 40px ${m.glow}, 0 0 80px ${m.glow.replace(/[\d.]+\)$/, '0.15)')}`;
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
          WebkitTextStroke: `1.5px ${accent.replace(/[\d.]+\)$/, '0.1)')}`,
          letterSpacing: '-0.06em', lineHeight: 0.82,
          transform: 'translateY(8%)',
        }}>{m.symbol}</span>
      </div>

      {/* Sealed stamp + price */}
      <div className="relative z-10 px-5 pt-5 pb-2 flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] px-2.5 py-1 rounded-full"
          style={{ border: `1px solid ${accentMid}`, color: accent, background: m.glow.replace(/[\d.]+\)$/, '0.1)') }}>
          {isHe ? 'חתום' : 'Sealed'}
        </span>
        <span className="font-mono font-bold text-xl" style={{ color: accent }}>₪90</span>
      </div>

      {/* Box visual panel */}
      <div className="relative z-10 mx-5 my-3 rounded-xl overflow-hidden flex items-center justify-center"
        style={{
          height: '130px',
          background: `linear-gradient(135deg, ${m.glow} 0%, rgba(0,0,0,0.4) 100%)`,
          border: `1px solid ${accent.replace(/[\d.]+\)$/, '0.14)')}`,
        }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 70% at 50% 50%, ${m.glow} 0%, transparent 70%)` }} />
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2"
            style={{ background: `linear-gradient(to bottom, transparent, ${accent.replace(/[\d.]+\)$/, '0.18)')}, transparent)` }} />
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
            style={{ background: `linear-gradient(to right, transparent, ${accent.replace(/[\d.]+\)$/, '0.18)')}, transparent)` }} />
        </div>
        <span className="relative font-playfair font-black select-none transition-transform duration-500 group-hover:scale-110" style={{
          fontSize: '5.5rem', lineHeight: 1.1,
          background: `linear-gradient(135deg, ${accent} 0%, rgba(255,255,255,0.95) 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          filter: `drop-shadow(0 0 24px ${m.glow})`,
        }}>{m.symbol}</span>
      </div>

      {/* Text content */}
      <div className={`relative z-10 px-5 pb-5 flex flex-col gap-3 flex-1 ${isHe ? 'text-right' : ''}`}>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] mb-1" style={{ color: accentMid }}>
            {hint}
          </p>
          <h3 className="font-bold text-white text-base leading-tight">{label}</h3>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
          {desc}
        </p>
        <ul className="space-y-1 mt-auto">
          {inside.map((item, i) => (
            <li key={i} className={`flex items-center gap-2 text-[11px] ${isHe ? 'flex-row-reverse' : ''}`}
              style={{ color: 'rgba(255,255,255,0.42)' }}>
              <span style={{ color: accentMid, fontSize: '7px' }}>◆</span>
              {item}
            </li>
          ))}
        </ul>
        <div className={`flex items-center justify-between mt-3 pt-3 ${isHe ? 'flex-row-reverse' : ''}`}
          style={{ borderTop: `1px solid ${accent.replace(/[\d.]+\)$/, '0.12)')}` }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: accent }}>
            {isHe ? 'הזמן עכשיו' : 'Order now'}
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
            className={`transition-transform duration-300 ${isHe ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
            style={{ color: accent }}>
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}

export function MysteryLeagueCards({ locale, isHe }: { locale: string; isHe: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
      {LEAGUE_BOX_ENTRIES.map(([slug]) => (
        <MysteryCard key={slug} slug={slug} locale={locale} isHe={isHe} />
      ))}
    </div>
  );
}

export function MysteryBoxCards({ locale, isHe }: { locale: string; isHe: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
      {BOXES.map((box) => {
        const c = isHe ? box.he : box.en;
        const accentFaint  = box.accent.replace(/[\d.]+\)$/, '0.07)');
        const accentMid    = box.accent.replace(/[\d.]+\)$/, '0.45)');
        const accentBorder = box.accent.replace(/[\d.]+\)$/, '0.22)');

        return (
          <Link
            key={box.slug}
            href={`/${locale}/product/${box.slug}`}
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
                style={{
                  border: `1px solid ${accentMid}`,
                  color: box.accent,
                  background: box.accentGlow.replace(/[\d.]+\)$/, '0.1)'),
                }}>
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
              {/* Gift ribbon */}
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
  );
}
