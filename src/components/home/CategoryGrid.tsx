'use client';

import Link from 'next/link';
import { Reveal } from '@/components/ui/reveal';
import { useLocale } from '@/hooks/useLocale';

interface CategoryDef {
  slug: string;
  en: string;
  he: string;
  bg: string;
  grid: string;
  size: 'lg' | 'sm';
  special?: boolean;
  priceLabel?: { en: string; he: string };
  accent: string;
  /** Primary editorial glyph */
  symbol: string;
  /** Short editorial sub-line — shown on lg tiles */
  sub?: { en: string; he: string };
}

const CATEGORIES: CategoryDef[] = [
  // ── Row 1-2 (desktop) ──────────────────────────────────────────────────────
  {
    slug: 'england',
    en: 'Premier League',
    he: 'פרמייר ליג',
    bg: '#0e0a17',
    symbol: 'PL',
    accent: 'rgba(88,28,135,0.9)',
    grid: 'col-span-2 min-h-[140px] lg:col-start-3 lg:col-end-6 lg:row-start-3 lg:row-end-4 lg:min-h-0',
    size: 'sm',
  },
  {
    slug: 'spain',
    en: 'La Liga',
    he: 'לה ליגה',
    bg: '#180a05',
    symbol: 'LL',
    accent: 'rgba(180,50,18,0.9)',
    grid: 'min-h-[140px] lg:col-start-4 lg:col-end-6 lg:row-start-1 lg:row-end-2 lg:min-h-0',
    size: 'sm',
  },
  {
    slug: 'italy',
    en: 'Serie A',
    he: 'סרייה A',
    bg: '#060d1f',
    symbol: 'SA',
    accent: 'rgba(30,58,138,0.9)',
    grid: 'min-h-[140px] lg:col-start-4 lg:col-end-5 lg:row-start-2 lg:row-end-3 lg:min-h-0',
    size: 'sm',
  },
  {
    slug: 'retro',
    en: 'Retro',
    he: 'רטרו',
    bg: '#120e04',
    symbol: "'90",
    accent: 'rgba(200,162,75,0.8)',
    grid: 'min-h-[140px] lg:col-start-5 lg:col-end-7 lg:row-start-4 lg:row-end-5 lg:min-h-0',
    size: 'sm',
  },
  {
    slug: 'germany',
    en: 'Bundesliga',
    he: 'בונדסליגה',
    bg: '#170505',
    symbol: 'BL',
    accent: 'rgba(180,20,20,0.9)',
    grid: 'min-h-[140px] lg:col-start-5 lg:col-end-6 lg:row-start-2 lg:row-end-3 lg:min-h-0',
    size: 'sm',
  },
  {
    slug: 'france',
    en: 'Ligue 1',
    he: 'ליג 1',
    bg: '#030f08',
    symbol: 'L1',
    accent: 'rgba(15,100,50,0.9)',
    grid: 'min-h-[140px] lg:col-start-6 lg:col-end-7 lg:row-start-3 lg:row-end-4 lg:min-h-0',
    size: 'sm',
  },

  // ── Row 3-4 (desktop) ──────────────────────────────────────────────────────
  {
    slug: 'season-2526',
    en: '25/26 Season',
    he: 'עונת 25/26',
    bg: '#03100b',
    symbol: '25',
    accent: 'rgba(15,61,46,1)',
    grid: 'col-span-2 min-h-[180px] lg:col-start-1 lg:col-end-3 lg:row-start-3 lg:row-end-5 lg:min-h-0',
    size: 'lg',
    sub: { en: 'PREMIER LEAGUE · LA LIGA · SERIE A', he: 'פרמייר ליג · לה ליגה · סרייה A' },
  },
  {
    slug: 'world-cup-2026',
    en: 'World Cup 2026',
    he: 'מונדיאל 2026',
    bg: '#021009',
    symbol: 'WC',
    accent: 'rgba(15,61,46,1)',
    grid: 'col-span-2 min-h-[200px] lg:col-start-1 lg:col-end-4 lg:row-start-1 lg:row-end-3 lg:min-h-0',
    size: 'lg',
    sub: { en: 'FRANCE · BRAZIL · ARGENTINA · ENGLAND', he: 'צרפת · ברזיל · ארגנטינה · אנגליה' },
  },
  {
    slug: 'rest_of_world',
    en: 'Rest of World',
    he: 'שאר העולם',
    bg: '#030f10',
    symbol: '∞',
    accent: 'rgba(17,94,89,0.9)',
    grid: 'col-span-2 min-h-[180px] lg:col-start-6 lg:col-end-7 lg:row-start-1 lg:row-end-3 lg:min-h-0',
    size: 'lg',
    sub: { en: 'AFRICA · ASIA · AMERICAS', he: 'אפריקה · אסיה · אמריקה' },
  },
  {
    slug: 'national_teams',
    en: 'International',
    he: 'נבחרות',
    bg: '#130a02',
    symbol: 'INT',
    accent: 'rgba(140,80,18,0.9)',
    grid: 'min-h-[140px] lg:col-start-5 lg:col-end-7 lg:row-start-5 lg:row-end-6 lg:min-h-0',
    size: 'sm',
  },
  {
    slug: 'special',
    en: 'Special Edition',
    he: 'מהדורה מיוחדת',
    bg: '#140603',
    symbol: '★',
    accent: 'rgba(255,77,46,0.8)',
    special: true,
    grid: 'min-h-[140px] lg:col-start-3 lg:col-end-5 lg:row-start-4 lg:row-end-5 lg:min-h-0',
    size: 'sm',
  },
  {
    slug: 'kids',
    en: 'Kids',
    he: 'ילדים',
    bg: '#060d1f',
    symbol: 'K',
    accent: 'rgba(50,80,180,0.9)',
    grid: 'min-h-[140px] lg:col-start-2 lg:col-end-4 lg:row-start-5 lg:row-end-6 lg:min-h-0',
    size: 'sm',
  },

  // ── Row 5 (desktop) ────────────────────────────────────────────────────────
  {
    slug: 'drip',
    en: 'Drip',
    he: 'דריפ',
    bg: '#120302',
    symbol: 'D',
    accent: 'rgba(220,60,30,0.7)',
    grid: 'col-span-2 min-h-[140px] lg:col-start-4 lg:col-end-7 lg:row-start-6 lg:row-end-7 lg:min-h-0',
    size: 'sm',
  },
  {
    slug: 'long-sleeve',
    en: 'Long Sleeve',
    he: 'שרוול ארוך',
    bg: '#060d1f',
    symbol: 'LS',
    accent: 'rgba(30,58,138,0.9)',
    grid: 'min-h-[140px] lg:col-start-1 lg:col-end-2 lg:row-start-5 lg:row-end-6 lg:min-h-0',
    size: 'sm',
  },

  // ── Row 6 (desktop) ────────────────────────────────────────────────────────
  {
    slug: 'mystery-box',
    en: 'Mystery Box',
    he: 'קופסת הפתעה',
    bg: '#100302',
    symbol: '?',
    accent: 'rgba(255,77,46,0.8)',
    special: true,
    priceLabel: { en: 'From ₪99', he: 'החל מ-₪99' },
    grid: 'col-span-2 min-h-[140px] lg:col-start-1 lg:col-end-4 lg:row-start-6 lg:row-end-7 lg:min-h-0',
    size: 'sm',
  },
  {
    slug: 'other-products',
    en: 'Other Products',
    he: 'מוצרים נוספים',
    bg: '#111113',
    symbol: '+',
    accent: 'rgba(120,120,130,0.7)',
    grid: 'min-h-[140px] lg:col-start-4 lg:col-end-5 lg:row-start-5 lg:row-end-6 lg:min-h-0',
    size: 'sm',
  },

  // ── Row 7 (desktop) ────────────────────────────────────────────────────────
  {
    slug: 'stussy-edition',
    en: 'Stussy Edition',
    he: 'מהדורת סטוסי',
    bg: '#0a0614',
    symbol: 'S',
    accent: 'rgba(200,162,75,0.8)',
    special: true,
    grid: 'min-h-[140px] lg:col-start-1 lg:col-end-4 lg:row-start-7 lg:row-end-8 lg:min-h-0',
    size: 'sm',
  },
  {
    slug: 'israeli_league',
    en: 'Israeli League',
    he: 'ליגת העל',
    bg: '#010818',
    symbol: 'IL',
    accent: 'rgba(0,100,230,0.8)',
    grid: 'min-h-[140px] lg:col-start-4 lg:col-end-7 lg:row-start-7 lg:row-end-8 lg:min-h-0',
    size: 'sm',
  },
];

const LEAGUE_SLUGS = new Set(['england', 'spain', 'italy', 'germany', 'france', 'rest_of_world', 'national_teams', 'israeli_league']);
const COLLECTION_SLUG_MAP: Record<string, string> = {
  'retro': 'retro',
  'season-2526': 'season-2526',
  'special': 'special',
  'world-cup-2026': 'world-cup',
  'kids': 'kids',
  'long-sleeve': 'long-sleeve',
  'drip': 'drip',
  'other-products': 'other-products',
};
const CATEGORY_PAGE_SLUGS = new Set(['mystery-box', 'stussy-edition']);

function getCategoryHref(locale: string, slug: string): string {
  if (CATEGORY_PAGE_SLUGS.has(slug)) return `/${locale}/category/${slug}`;
  if (LEAGUE_SLUGS.has(slug)) return `/${locale}/discover?leagues=${slug}`;
  const collectionId = COLLECTION_SLUG_MAP[slug];
  if (collectionId) return `/${locale}/discover?collections=${collectionId}`;
  return `/${locale}/category/${slug}`;
}

/** Corner arc SVG — football pitch corner mark */
function CornerArc({ accent }: { accent: string }) {
  const color = accent.replace(/[\d.]+\)$/, '0.14)');
  return (
    <svg
      className="absolute bottom-0 right-0 pointer-events-none"
      width="52"
      height="52"
      viewBox="0 0 52 52"
      fill="none"
      aria-hidden="true"
    >
      {/* Quarter circle — pitch corner arc */}
      <path d="M52 0 A52 52 0 0 0 0 52" stroke={color} strokeWidth="1" fill="none" />
      {/* Tighter inner arc */}
      <path d="M52 12 A40 40 0 0 0 12 52" stroke={color.replace(/[\d.]+\)$/, '0.07)')} strokeWidth="0.75" fill="none" />
    </svg>
  );
}

/** Center circle fragment — used only on lg tiles */
function CenterCircle({ accent }: { accent: string }) {
  const color = accent.replace(/[\d.]+\)$/, '0.1)');
  return (
    <svg
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      width="110"
      height="110"
      viewBox="0 0 110 110"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="55" cy="55" r="50" stroke={color} strokeWidth="1" strokeDasharray="4 6" />
      <circle cx="55" cy="55" r="3" fill={color} />
    </svg>
  );
}

export function CategoryGrid() {
  const { locale } = useLocale();
  const isHe = locale === 'he';

  return (
    <section
      className="py-16 md:py-24"
      style={{ backgroundColor: 'var(--ink)', borderTop: '1px solid var(--border)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 w-full">

        {/* Section header */}
        <Reveal>
          <div
            className={`relative mb-10 overflow-hidden ${isHe ? 'text-right' : ''}`}
            id="collections-section"
          >
            <div
              className="absolute pointer-events-none select-none"
              style={{
                fontFamily: 'Playfair Display, serif',
                fontWeight: 900,
                fontSize: 'clamp(8rem, 22vw, 18rem)',
                color: 'rgba(200,162,75,0.055)',
                letterSpacing: '-0.06em',
                lineHeight: 0.85,
                top: '-0.1em',
                left: isHe ? 'auto' : '-0.04em',
                right: isHe ? '-0.04em' : 'auto',
                userSelect: 'none',
              }}
              aria-hidden="true"
            >
              17
            </div>
            <div className="relative">
              <p className="section-kicker mb-3">
                {isHe ? '17 קולקציות' : '17 Collections'}
              </p>
              <h2
                className="font-playfair font-bold text-white whitespace-pre-line"
                style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4rem)', letterSpacing: '-0.04em', lineHeight: 0.95 }}
              >
                {isHe ? 'כל עולמות\nהכדורגל' : 'Every world\nof football'}
              </h2>
            </div>
          </div>
        </Reveal>

        {/* Bento grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:auto-rows-[130px]">
          {CATEGORIES.map((cat, i) => {
            const num = String(i + 1).padStart(2, '0');
            const accentFaint = cat.accent.replace(/[\d.]+\)$/, '0.12)');
            const accentMid   = cat.accent.replace(/[\d.]+\)$/, '0.55)');
            const symbolSize  = cat.size === 'lg'
              ? 'clamp(4.5rem, 14vw, 8rem)'
              : 'clamp(3rem, 8vw, 5.5rem)';
            const isItalic = cat.slug === 'retro';

            return (
              <Reveal key={cat.slug} delay={i * 30} className={cat.grid}>
                <Link
                  href={getCategoryHref(locale, cat.slug)}
                  className="group relative flex flex-col justify-end rounded-xl overflow-hidden h-full transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    backgroundColor: cat.bg,
                    border: cat.special
                      ? '1px solid rgba(255,77,46,0.22)'
                      : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor  = cat.accent.replace(/[\d.]+\)$/, '0.65)');
                    el.style.boxShadow    = `0 0 36px ${cat.accent.replace(/[\d.]+\)$/, '0.22)')}, inset 0 1px 0 rgba(255,255,255,0.07)`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor  = cat.special ? 'rgba(255,77,46,0.22)' : 'rgba(255,255,255,0.06)';
                    el.style.boxShadow    = 'inset 0 1px 0 rgba(255,255,255,0.04)';
                  }}
                >

                  {/* ① Diagonal accent sweep */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, transparent 0%, ${accentFaint} 50%, transparent 100%)`,
                    }}
                  />

                  {/* ② Dot-grid texture */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
                      backgroundSize: '18px 18px',
                    }}
                  />

                  {/* ③ Radial glow from top-center */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-400 opacity-60 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(ellipse 85% 65% at 50% 20%, ${accentFaint}, transparent 70%)`,
                    }}
                  />

                  {/* ④ Symbol — ghost stroke depth layer (slightly offset) */}
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
                    aria-hidden="true"
                  >
                    <span
                      className="font-playfair font-bold absolute"
                      style={{
                        fontSize: symbolSize,
                        color: 'transparent',
                        WebkitTextStroke: `1.5px ${cat.accent.replace(/[\d.]+\)$/, '0.22)')}`,
                        letterSpacing: '-0.05em',
                        lineHeight: 0.85,
                        fontStyle: isItalic ? 'italic' : 'normal',
                        transform: 'translate(4px, calc(8% + 4px))',
                        userSelect: 'none',
                      }}
                    >
                      {cat.symbol}
                    </span>

                    {/* Fill layer on top */}
                    <span
                      className="font-playfair font-bold relative transition-opacity duration-300 group-hover:opacity-[0.15]"
                      style={{
                        fontSize: symbolSize,
                        color: 'rgba(255,255,255,1)',
                        opacity: 0.08,
                        letterSpacing: '-0.05em',
                        lineHeight: 0.85,
                        fontStyle: isItalic ? 'italic' : 'normal',
                        transform: 'translateY(8%)',
                        userSelect: 'none',
                      }}
                    >
                      {cat.symbol}
                    </span>
                  </div>

                  {/* ⑤ Football pitch corner arcs */}
                  <CornerArc accent={cat.accent} />
                  {/* Mirror on bottom-left */}
                  <svg
                    className="absolute bottom-0 left-0 pointer-events-none"
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M0 0 A28 28 0 0 1 28 28" stroke={cat.accent.replace(/[\d.]+\)$/, '0.08)')} strokeWidth="0.75" fill="none" />
                  </svg>

                  {/* ⑥ Centre-circle fragment — lg tiles only */}
                  {cat.size === 'lg' && <CenterCircle accent={cat.accent} />}

                  {/* ⑦ Left accent bar */}
                  <div
                    className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full pointer-events-none"
                    style={{
                      background: `linear-gradient(to bottom, transparent, ${accentMid}, transparent)`,
                    }}
                  />

                  {/* ⑧ Gold hairline top edge on lg tiles */}
                  {cat.size === 'lg' && (
                    <div
                      className="absolute top-0 left-4 right-4 pointer-events-none"
                      style={{
                        height: '1px',
                        background: `linear-gradient(to right, transparent, ${cat.accent.replace(/[\d.]+\)$/, '0.45)')}, transparent)`,
                      }}
                    />
                  )}

                  {/* ⑨ Bottom gradient for label readability */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.12) 45%, transparent 70%)',
                    }}
                  />

                  {/* ⑩ Index number — top corner */}
                  <span
                    className="absolute top-2.5 end-3 font-mono text-[10px] pointer-events-none select-none z-10"
                    style={{ color: 'rgba(255,255,255,0.18)', letterSpacing: '0.1em' }}
                    aria-hidden="true"
                  >
                    {num}
                  </span>

                  {/* ⑪ Sub-text on lg tiles */}
                  {cat.size === 'lg' && cat.sub && (
                    <div className="relative z-10 px-3.5 mb-1">
                      <p
                        className="font-mono uppercase"
                        style={{ fontSize: '8px', letterSpacing: '0.18em', color: cat.accent.replace(/[\d.]+\)$/, '0.55)') }}
                      >
                        {isHe ? cat.sub.he : cat.sub.en}
                      </p>
                    </div>
                  )}

                  {/* ⑫ Label row */}
                  <div className={`relative z-10 p-3.5 pt-0 ${isHe ? 'text-right' : ''}`}>
                    <p
                      className={`font-bold leading-tight text-white ${
                        cat.size === 'lg' ? 'text-base md:text-lg' : 'text-sm'
                      }`}
                    >
                      {isHe ? cat.he : cat.en}
                    </p>
                    {cat.priceLabel && (
                      <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--flare)' }}>
                        {isHe ? cat.priceLabel.he : cat.priceLabel.en}
                      </p>
                    )}
                    {cat.special && !cat.priceLabel && (
                      <p
                        className="font-mono text-[9px] uppercase tracking-[0.18em] mt-0.5"
                        style={{ color: cat.accent.replace(/[\d.]+\)$/, '0.65)') }}
                      >
                        {isHe ? 'מהדורה מוגבלת' : 'Limited Edition'}
                      </p>
                    )}
                  </div>

                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
