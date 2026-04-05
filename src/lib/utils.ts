import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Jersey, JerseyType, SheetRow, Size } from '@/types';
import { PRICES, RETRO_SEASON_THRESHOLD } from '@/lib/constants';

// ─── Tailwind Merge ──────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Season Comparison ───────────────────────────────────────
function seasonToNumber(season: string): number {
  const parts = season.split('/');
  return parseInt(parts[0], 10);
}

export function isRetroSeason(season: string): boolean {
  return seasonToNumber(season) < seasonToNumber(RETRO_SEASON_THRESHOLD);
}

// ─── Price Calculation ───────────────────────────────────────
export function getBasePrice(type: JerseyType): number {
  return PRICES[type] || PRICES.regular;
}

export function calculateCustomizationPrice(options: {
  hasNameNumber: boolean;
  hasPatch: boolean;
  hasPants: boolean;
  isPlayerVersion: boolean;
}): number {
  let extra = 0;
  if (options.hasNameNumber) extra += PRICES.customization.nameAndNumber;
  if (options.hasPatch) extra += PRICES.customization.patch;
  if (options.hasPants) extra += PRICES.customization.pants;
  if (options.isPlayerVersion) extra += PRICES.customization.playerVersion;
  return extra;
}

// ─── Slug Generation ─────────────────────────────────────────
export function generateSlug(teamName: string, season: string): string {
  return `${teamName.toLowerCase().replace(/\s+/g, '-')}-${season.replace('/', '-')}`;
}

// ─── Sheet Row to Jersey Mapping ─────────────────────────────
export function mapSheetRowToJersey(row: SheetRow): Jersey {
  const season = row.season?.trim() || '';
  const rawType = row.type?.trim().toLowerCase() || 'regular';

  // Parse tags (pipe-separated) — used for long sleeve, world_cup, images, etc.
  const rawTags = row.tags
    ? row.tags.split('|').filter(Boolean)
    : [];

  // Extract structured tags (images:..., en:..., etc.) and plain tags
  const tags: string[] = [];
  let additionalImages: string[] = [];
  let englishName = '';
  for (const t of rawTags) {
    if (t.startsWith('images:')) {
      additionalImages = t.slice(7).split(',').filter(Boolean);
    } else if (t.startsWith('en:')) {
      englishName = t.slice(3);
    } else {
      tags.push(t);
    }
  }

  // Backward-compat: also check legacy additional_images column
  if (additionalImages.length === 0 && row.additional_images) {
    additionalImages = row.additional_images.split('|').filter(Boolean);
  }

  // Backward-compat: coat/scarf → other_products, detect world_cup/stussy from tag
  let type: JerseyType;
  if (rawType === 'coat' || rawType === 'scarf') {
    type = 'other_products';
  } else if (rawType === 'world_cup') {
    type = 'world_cup';
  } else if (rawType === 'regular' && tags.some((t) => t.includes('מונדיאל'))) {
    type = 'world_cup';
  } else if (rawType === 'regular' && tags.some((t) => t.toLowerCase() === 'stussy')) {
    type = 'stussy';
  } else if (['regular', 'retro', 'kids', 'special', 'drip', 'other_products', 'stussy'].includes(rawType)) {
    type = rawType as JerseyType;
  } else {
    type = 'regular';
  }

  // Detect long sleeve from tag (ארוך or long_sleeve) or legacy column
  const isLongSleeve =
    row.is_long_sleeve?.trim().toLowerCase() === 'true' ||
    tags.some((t) => t === 'long_sleeve' || t.includes('ארוך'));

  // Price: use sheet value if present, otherwise compute
  const sheetPrice = row.price ? parseFloat(row.price) : NaN;
  const price = !isNaN(sheetPrice)
    ? sheetPrice
    : getBasePrice(type) + (isLongSleeve ? PRICES.longSleeveExtra : 0);

  // Category: derive from type/league (no longer a dedicated column for new rows)
  const category = row.category?.trim() || rawType;

  return {
    id: row.id,
    teamName: row.team_name?.trim() || englishName || '',
    nameEn: englishName || undefined,
    league: normalizeLeague(row.league?.trim() || ''),
    season,
    type,
    category,
    imageUrl: row.image_url?.trim() || '',
    additionalImages,
    isWorldCup: row.is_world_cup?.trim().toLowerCase() === 'true' || type === 'world_cup',
    internationalTeam: row.international_team?.trim() || '',
    availableSizes: parseSizes(row.available_sizes),
    tags,
    isLongSleeve,
    createdAt: row.date_added?.trim() || row.created_at?.trim() || new Date().toISOString(),
    price,
    slug: generateSlug(row.team_name?.trim() || '', season),
  };
}

// ─── League Normalization ────────────────────────────────────
function normalizeLeague(league: string): Jersey['league'] {
  const map: Record<string, Jersey['league']> = {
    'england': 'england',
    'spain': 'spain',
    'italy': 'italy',
    'germany': 'germany',
    'france': 'france',
    'national_teams': 'national_teams',
    'rest_of_world': 'rest_of_world',
    // Legacy mappings
    'premier league': 'england',
    'premier-league': 'england',
    'la liga': 'spain',
    'la-liga': 'spain',
    'serie a': 'italy',
    'serie-a': 'italy',
    'bundesliga': 'germany',
    'ligue 1': 'france',
    'ligue-1': 'france',
    'international': 'national_teams',
    'world cup 2026': 'national_teams',
    'world-cup-2026': 'national_teams',
    'rest of world': 'rest_of_world',
    'rest-of-world': 'rest_of_world',
    'israel': 'rest_of_world',
    'israeli_league': 'israeli_league',
    'ליגת העל': 'israeli_league',
    'rest of the world': 'rest_of_world',
  };
  return map[league.toLowerCase()] || 'rest_of_world';
}

// ─── Size Parsing ────────────────────────────────────────────
function parseSizes(raw: string): Size[] {
  if (!raw) return ['S', 'M', 'L', 'XL', 'XXL'];
  const parts = raw.split(',').map((s) => s.trim());
  // Kids sizes are numeric (16, 18, etc.)
  const isKidsSizes = parts.some((s) => /^\d{2}$/.test(s));
  if (isKidsSizes) {
    return parts as Size[];
  }
  return parts
    .map((s) => s.toUpperCase() as Size)
    .filter((s) => ['S', 'M', 'L', 'XL', 'XXL'].includes(s));
}

// ─── Format Price ────────────────────────────────────────────
export function formatPrice(price: number): string {
  return `${price}₪`;
}

// ─── Get Unique Values ───────────────────────────────────────
export function getUniqueValues<T>(items: T[], key: keyof T): string[] {
  const values = new Set(items.map((item) => String(item[key])).filter(Boolean));
  return Array.from(values).sort();
}

// ─── Image URL Helper ───────────────────────────────────────
export function getImageUrl(imageUrl: string): string {
  if (!imageUrl) return '/placeholder-jersey.svg';
  // Direct URLs (Shopify CDN, etc.) - use as-is
  if (imageUrl.startsWith('http')) return imageUrl;
  // Fallback
  return imageUrl;
}

// ─── Jersey Name Translation ────────────────────────────────
import translationsJson from '@/data/jersey-translations.json';
const translations = translationsJson as Record<string, string>;

export function getJerseyName(jersey: Jersey, locale: 'en' | 'he'): string {
  if (locale === 'en') return jersey.nameEn ?? translations[jersey.id] ?? jersey.teamName;
  return jersey.teamName;
}

// ─── Debounce ────────────────────────────────────────────────
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
