'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Reveal } from '@/components/ui/reveal';
import { useLocale } from '@/hooks/useLocale';

// ── Category definitions with explicit grid positions ──────────────────────
// Source order is optimized for mobile 2-col flow.
// Desktop uses explicit lg: grid placement — order doesn't matter there.

interface CategoryDef {
  slug: string;
  en: string;
  he: string;
  bg: string;
  /** Combined mobile + desktop grid classes */
  grid: string;
  /** Text size: 'lg' for large/featured cards, 'sm' for normal */
  size: 'lg' | 'sm';
  image?: string;
  /** CSS object-position for the image (default: 'center') */
  imagePosition?: string;
  special?: boolean;
  priceLabel?: { en: string; he: string };
  /**
   * Accurate sizes hint per card so the browser downloads exactly the right
   * resolution. Mobile = 2-col grid; desktop = 6-col grid max-w-[1200px].
   * Formula: mobile(col-span-2 → 100vw, else 50vw), desktop(n cols × 200px).
   */
  sizes: string;
}

const CATEGORIES: CategoryDef[] = [
  // ── Row 1-2 (desktop) ──────────────────────────────────────────
  {
    slug: 'england',
    en: 'Premier League',
    he: 'פרמייר ליג',
    bg: 'rgba(88,28,135,0.4)',
    image: 'premier-league',
    imagePosition: 'bottom',
    grid: 'col-span-2 min-h-[140px] lg:col-start-3 lg:col-end-6 lg:row-start-3 lg:row-end-4 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 100vw, 600px', // mobile full-width; desktop 3-of-6 cols
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
    sizes: '(max-width: 1024px) 50vw, 400px', // mobile half; desktop 2-of-6 cols
  },
  {
    slug: 'italy',
    en: 'Serie A',
    he: 'סרייה A',
    bg: 'rgba(30,58,138,0.4)',
    image: 'serie-a',
    grid: 'min-h-[140px] lg:col-start-4 lg:col-end-5 lg:row-start-2 lg:row-end-3 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 200px', // mobile half; desktop 1-of-6 cols
  },
  {
    slug: 'retro',
    en: 'Retro',
    he: 'רטרו',
    bg: 'rgba(88,28,135,0.3)',
    image: 'retro',
    grid: 'min-h-[140px] lg:col-start-5 lg:col-end-7 lg:row-start-4 lg:row-end-5 lg:min-h-0',
    size: 'sm',
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

  // ── Row 3-4 (desktop) ──────────────────────────────────────────
  {
    slug: 'season-2526',
    en: '25/26 Season',
    he: 'עונת 25/26',
    bg: 'rgba(0,195,216,0.15)',
    image: 'season-2526',
    grid: 'col-span-2 min-h-[180px] lg:col-start-1 lg:col-end-3 lg:row-start-3 lg:row-end-5 lg:min-h-0',
    size: 'lg',
    sizes: '(max-width: 1024px) 100vw, 400px',
  },
  {
    slug: 'world-cup-2026',
    en: 'World Cup 2026',
    he: 'מונדיאל 2026',
    bg: 'rgba(20,83,45,0.4)',
    image: 'world-cup-2026',
    grid: 'col-span-2 min-h-[200px] lg:col-start-1 lg:col-end-4 lg:row-start-1 lg:row-end-3 lg:min-h-0',
    size: 'lg',
    sizes: '(max-width: 1024px) 100vw, 600px', // largest featured card
  },
  {
    slug: 'rest_of_world',
    en: 'Rest of World',
    he: 'שאר העולם',
    bg: 'rgba(17,94,89,0.4)',
    image: 'rest-of-world',
    grid: 'col-span-2 min-h-[180px] lg:col-start-6 lg:col-end-7 lg:row-start-1 lg:row-end-3 lg:min-h-0',
    size: 'lg',
    sizes: '(max-width: 1024px) 100vw, 200px', // mobile full; desktop 1-of-6
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
    bg: 'rgba(255,140,0,0.12)',
    image: 'special-edition',
    imagePosition: 'bottom',
    grid: 'min-h-[140px] lg:col-start-3 lg:col-end-5 lg:row-start-4 lg:row-end-5 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 400px',
  },
  {
    slug: 'kids',
    en: 'Kids',
    he: 'ילדים',
    bg: 'rgba(0,195,216,0.12)',
    image: 'kids',
    grid: 'min-h-[140px] lg:col-start-2 lg:col-end-4 lg:row-start-5 lg:row-end-6 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 400px',
  },

  // ── Row 5 (desktop) ────────────────────────────────────────────
  {
    slug: 'drip',
    en: 'Drip',
    he: 'דריפ',
    bg: 'rgba(255,140,0,0.1)',
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

  // ── Row 6 (desktop) ────────────────────────────────────────────
  {
    slug: 'mystery-box',
    en: 'Mystery Box 🎁',
    he: 'קופסת הפתעה 🎁',
    bg: 'rgba(255,140,0,0.08)',
    image: 'mystery-box',
    imagePosition: 'bottom',
    grid: 'col-span-2 min-h-[140px] lg:col-start-1 lg:col-end-4 lg:row-start-6 lg:row-end-7 lg:min-h-0',
    size: 'sm',
    special: true,
    priceLabel: { en: 'From ₪89', he: 'החל מ-₪89' },
    sizes: '(max-width: 1024px) 100vw, 600px',
  },
  {
    slug: 'other-products',
    en: 'Other Products',
    he: 'מוצרים נוספים',
    bg: 'var(--bg-elevated)',
    image: 'other-products',
    grid: 'min-h-[140px] lg:col-start-4 lg:col-end-5 lg:row-start-5 lg:row-end-6 lg:min-h-0',
    size: 'sm',
    sizes: '(max-width: 1024px) 50vw, 200px',
  },

  // ── Row 7 (desktop) ────────────────────────────────────────────
  {
    slug: 'stussy-edition',
    en: 'Stussy Edition',
    he: 'מהדורת סטוסי',
    bg: 'rgba(30,20,60,0.7)',
    image: 'stussy-edition',
    grid: 'col-span-2 min-h-[140px] lg:col-start-1 lg:col-end-7 lg:row-start-7 lg:row-end-8 lg:min-h-0',
    size: 'lg',
    special: true,
    sizes: '(max-width: 1024px) 100vw, 1200px', // full-width banner on desktop
  },
];

// ── Discover URL helpers ─────────────────────────────────────────────────────

const LEAGUE_SLUGS = new Set(['england', 'spain', 'italy', 'germany', 'france', 'rest_of_world', 'national_teams']);

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

// ── Component ──────────────────────────────────────────────────────────────
export function CategoryGrid() {
  const { locale } = useLocale();
  const isHe = locale === 'he';

  return (
    <section
      className="snap-start flex flex-col justify-center py-16 md:py-24"
      style={{
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 w-full">
        {/* Section header */}
        <Reveal>
          <h2
            className="font-bold text-white text-3xl md:text-4xl text-center mb-8"
            style={{ letterSpacing: '-0.02em' }}
          >
            {isHe ? 'הקולקציות שלנו' : 'Our Collections'}
          </h2>
        </Reveal>

        {/* Bento grid — 2 cols mobile, 6 cols desktop with explicit placement */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:auto-rows-[130px]">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.slug} delay={i * 50} className={cat.grid}>
              <Link
                href={getCategoryHref(locale, cat.slug)}
                className="group relative block rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] h-full"
                style={{
                  backgroundColor: cat.bg,
                  border: cat.special
                    ? '1px solid rgba(255,140,0,0.4)'
                    : '1px solid var(--border)',
                }}
              >
                {/* Background image (if available) */}
                {cat.image && (
                  <Image
                    src={`/images/categories/${locale}/${cat.image}.webp`}
                    alt={isHe ? cat.he : cat.en}
                    fill
                    sizes={cat.sizes}
                    quality={60}
                    className="object-cover"
                    style={cat.imagePosition ? { objectPosition: cat.imagePosition } : undefined}
                    priority={i < 4}
                  />
                )}

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
                  }}
                />

                {/* Mystery box glow */}
                {cat.special && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 30px rgba(255,140,0,0.1)' }}
                  />
                )}

                {/* Category name — positioned at bottom (hidden on image cards) */}
                {!cat.image && (
                  <div className={`absolute bottom-0 ${isHe ? 'right-0' : 'left-0'} p-4`}>
                    <p
                      className={`text-white font-bold leading-tight ${
                        cat.size === 'lg' ? 'text-2xl' : 'text-lg'
                      }`}
                    >
                      {isHe ? cat.he : cat.en}
                    </p>
                    {cat.priceLabel && (
                      <p className="text-sm mt-1" style={{ color: 'var(--cta)' }}>
                        {isHe ? cat.priceLabel.he : cat.priceLabel.en}
                      </p>
                    )}
                  </div>
                )}

                {/* Hover glow — accent for normal, orange for mystery box */}
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    boxShadow: cat.special
                      ? 'inset 0 0 0 1.5px rgba(255,140,0,0.5), 0 0 20px rgba(255,140,0,0.1)'
                      : 'inset 0 0 0 1.5px rgba(0,195,216,0.4)',
                  }}
                />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
