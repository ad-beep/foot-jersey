'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import { useLocale } from '@/hooks/useLocale';

interface CategoryDef {
  slug: string;
  en: string;
  he: string;
  bg: string;
  grid: string;
  size: 'lg' | 'sm';
  image?: string;
  imagePosition?: string;
  special?: boolean;
  priceLabel?: { en: string; he: string };
  sizes: string;
  /** Editorial accent color for hover glow */
  accent?: string;
}

const CATEGORIES: CategoryDef[] = [
  // ── Row 1-2 (desktop) ──────────────────────────────────────────────────────
  {
    slug: 'england',
    en: 'Premier League',
    he: 'פרמייר ליג',
    bg: 'rgba(88,28,135,0.4)',
    image: 'premier-league',
    imagePosition: 'bottom',
    grid: 'col-span-2 min-h-[140px] lg:col-start-3 lg:col-end-6 lg:row-start-3 lg:row-end-4 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 100vw, 600px',
  },
  {
    slug: 'spain',
    en: 'La Liga',
    he: 'לה ליגה',
    bg: 'rgba(154,52,18,0.4)',
    image: 'la-liga',
    imagePosition: 'bottom',
    grid: 'min-h-[140px] lg:col-start-4 lg:col-end-6 lg:row-start-1 lg:row-end-2 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 400px',
  },
  {
    slug: 'italy',
    en: 'Serie A',
    he: 'סרייה A',
    bg: 'rgba(30,58,138,0.4)',
    image: 'serie-a',
    grid: 'min-h-[140px] lg:col-start-4 lg:col-end-5 lg:row-start-2 lg:row-end-3 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 200px',
  },
  {
    slug: 'retro',
    en: 'Retro',
    he: 'רטרו',
    bg: 'rgba(200,162,75,0.12)',
    image: 'retro',
    grid: 'min-h-[140px] lg:col-start-5 lg:col-end-7 lg:row-start-4 lg:row-end-5 lg:min-h-0',
    size: 'sm',
    accent: 'rgba(200,162,75,0.5)',
    sizes: '(max-width: 1024px) 50vw, 400px',
  },
  {
    slug: 'germany',
    en: 'Bundesliga',
    he: 'בונדסליגה',
    bg: 'rgba(127,29,29,0.4)',
    image: 'bundesliga',
    grid: 'min-h-[140px] lg:col-start-5 lg:col-end-6 lg:row-start-2 lg:row-end-3 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 200px',
  },
  {
    slug: 'france',
    en: 'Ligue 1',
    he: 'ליג 1',
    bg: 'rgba(20,83,45,0.4)',
    image: 'ligue-1',
    grid: 'min-h-[140px] lg:col-start-6 lg:col-end-7 lg:row-start-3 lg:row-end-4 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 200px',
  },

  // ── Row 3-4 (desktop) ──────────────────────────────────────────────────────
  {
    slug: 'season-2526',
    en: '25/26 Season',
    he: 'עונת 25/26',
    bg: 'rgba(15,61,46,0.4)',
    image: 'season-2526',
    grid: 'col-span-2 min-h-[180px] lg:col-start-1 lg:col-end-3 lg:row-start-3 lg:row-end-5 lg:min-h-0',
    size: 'lg',
    accent: 'rgba(15,61,46,0.8)',
    sizes: '(max-width: 1024px) 100vw, 400px',
  },
  {
    slug: 'world-cup-2026',
    en: 'World Cup 2026',
    he: 'מונדיאל 2026',
    bg: 'rgba(15,61,46,0.45)',
    image: 'world-cup-2026',
    grid: 'col-span-2 min-h-[200px] lg:col-start-1 lg:col-end-4 lg:row-start-1 lg:row-end-3 lg:min-h-0',
    size: 'lg',
    accent: 'rgba(15,61,46,0.8)',
    sizes: '(max-width: 1024px) 100vw, 600px',
  },
  {
    slug: 'rest_of_world',
    en: 'Rest of World',
    he: 'שאר העולם',
    bg: 'rgba(17,94,89,0.4)',
    image: 'rest-of-world',
    grid: 'col-span-2 min-h-[180px] lg:col-start-6 lg:col-end-7 lg:row-start-1 lg:row-end-3 lg:min-h-0',
    size: 'lg',
    sizes: '(max-width: 1024px) 100vw, 200px',
  },
  {
    slug: 'national_teams',
    en: 'International',
    he: 'נבחרות',
    bg: 'rgba(113,63,18,0.4)',
    image: 'international',
    grid: 'min-h-[140px] lg:col-start-5 lg:col-end-7 lg:row-start-5 lg:row-end-6 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 400px',
  },
  {
    slug: 'special',
    en: 'Special Edition',
    he: 'מהדורה מיוחדת',
    bg: 'rgba(255,77,46,0.1)',
    image: 'special-edition',
    imagePosition: 'bottom',
    grid: 'min-h-[140px] lg:col-start-3 lg:col-end-5 lg:row-start-4 lg:row-end-5 lg:min-h-0',
    size: 'sm',
    accent: 'rgba(255,77,46,0.4)',
    sizes: '(max-width: 1024px) 50vw, 400px',
  },
  {
    slug: 'kids',
    en: 'Kids',
    he: 'ילדים',
    bg: 'rgba(30,58,138,0.25)',
    image: 'kids',
    grid: 'min-h-[140px] lg:col-start-2 lg:col-end-4 lg:row-start-5 lg:row-end-6 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 400px',
  },

  // ── Row 5 (desktop) ────────────────────────────────────────────────────────
  {
    slug: 'drip',
    en: 'Drip',
    he: 'דריפ',
    bg: 'rgba(255,77,46,0.08)',
    image: 'drip',
    imagePosition: 'bottom',
    grid: 'col-span-2 min-h-[140px] lg:col-start-4 lg:col-end-7 lg:row-start-6 lg:row-end-7 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 100vw, 600px',
  },
  {
    slug: 'long-sleeve',
    en: 'Long Sleeve',
    he: 'שרוול ארוך',
    bg: 'rgba(30,58,138,0.3)',
    image: 'long-sleeve',
    grid: 'min-h-[140px] lg:col-start-1 lg:col-end-2 lg:row-start-5 lg:row-end-6 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 200px',
  },

  // ── Row 6 (desktop) ────────────────────────────────────────────────────────
  {
    slug: 'mystery-box',
    en: 'Mystery Box',
    he: 'קופסת הפתעה',
    bg: 'rgba(255,77,46,0.08)',
    image: 'mystery-box',
    imagePosition: 'bottom',
    grid: 'col-span-2 min-h-[140px] lg:col-start-1 lg:col-end-4 lg:row-start-6 lg:row-end-7 lg:min-h-0',
    size: 'sm',
    special: true,
    priceLabel: { en: 'From ₪99', he: 'החל מ-₪99' },
    accent: 'rgba(255,77,46,0.45)',
    sizes: '(max-width: 1024px) 100vw, 600px',
  },
  {
    slug: 'other-products',
    en: 'Other Products',
    he: 'מוצרים נוספים',
    bg: 'var(--steel)',
    image: 'other-products',
    grid: 'min-h-[140px] lg:col-start-4 lg:col-end-5 lg:row-start-5 lg:row-end-6 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 200px',
  },

  // ── Row 7 (desktop) ────────────────────────────────────────────────────────
  {
    slug: 'stussy-edition',
    en: 'Stussy Edition',
    he: 'מהדורת סטוסי',
    bg: 'rgba(30,20,60,0.7)',
    image: 'stussy-edition',
    grid: 'min-h-[140px] lg:col-start-1 lg:col-end-4 lg:row-start-7 lg:row-end-8 lg:min-h-0',
    size: 'sm',
    special: true,
    accent: 'rgba(200,162,75,0.5)',
    sizes: '(max-width: 1024px) 50vw, 600px',
  },
  {
    slug: 'israeli_league',
    en: 'Israeli League',
    he: 'ליגת העל',
    bg: 'rgba(0,56,184,0.35)',
    grid: 'min-h-[140px] lg:col-start-4 lg:col-end-7 lg:row-start-7 lg:row-end-8 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 600px',
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
          <div className={`mb-10 ${isHe ? 'text-right' : ''}`} id="collections-section">
            <p className="section-kicker mb-3">
              {isHe ? '17 קולקציות' : '17 Collections'}
            </p>
            <h2
              className="font-playfair font-bold text-white"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', lineHeight: 1 }}
            >
              {isHe ? 'כל עולמות\nהכדורגל' : 'Every world\nof football'}
            </h2>
          </div>
        </Reveal>

        {/* Bento grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:auto-rows-[130px]">
          {CATEGORIES.map((cat, i) => {
            const num = String(i + 1).padStart(2, '0');
            const hoverAccent = cat.accent ?? 'rgba(200,162,75,0.4)';

            return (
              <Reveal key={cat.slug} delay={i * 30} className={cat.grid}>
                <Link
                  href={getCategoryHref(locale, cat.slug)}
                  className="group relative block rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] h-full"
                  style={{
                    backgroundColor: cat.bg,
                    border: cat.special
                      ? '1px solid rgba(255,77,46,0.3)'
                      : '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = hoverAccent.replace(/[\d.]+\)$/, '0.8)');
                    el.style.boxShadow = `0 0 24px ${hoverAccent}`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = cat.special ? 'rgba(255,77,46,0.3)' : 'var(--border)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  {/* Background image */}
                  {cat.image && (
                    <Image
                      src={`/images/categories/${locale}/${cat.image}.webp`}
                      alt={isHe ? cat.he : cat.en}
                      fill
                      sizes={cat.sizes}
                      quality={60}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      style={cat.imagePosition ? { objectPosition: cat.imagePosition } : undefined}
                      priority={i < 4}
                    />
                  )}

                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }}
                  />

                  {/* Editorial number — top-right, faint */}
                  <span
                    className="absolute top-2 end-3 font-mono text-[10px] pointer-events-none select-none"
                    style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}
                    aria-hidden="true"
                  >
                    {num}
                  </span>

                  {/* Category label — bottom */}
                  <div className={`absolute bottom-0 ${isHe ? 'right-0' : 'left-0'} p-3`}>
                    <p
                      className={`font-bold leading-tight text-white ${
                        cat.size === 'lg' ? 'text-lg md:text-xl' : 'text-sm md:text-base'
                      }`}
                    >
                      {isHe ? cat.he : cat.en}
                    </p>
                    {cat.priceLabel && (
                      <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--flare)' }}>
                        {isHe ? cat.priceLabel.he : cat.priceLabel.en}
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
