import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Jersey, JerseyType, SheetRow, Size } from '@/types';
import { PRICES, RETRO_SEASON_THRESHOLD } from './constants';

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
  const rawType = (row.type?.trim().toLowerCase() || 'regular') as JerseyType;
  const type: JerseyType = ['regular', 'retro', 'kids', 'special', 'coat', 'drip', 'scarf'].includes(rawType)
    ? rawType as JerseyType
    : 'regular';

  const isLongSleeve = row.is_long_sleeve?.trim().toLowerCase() === 'true';
  const price = getBasePrice(type) + (isLongSleeve ? 30 : 0);

  // Parse additional images from pipe-separated string
  const additionalImages = row.additional_images
    ? row.additional_images.split('|').filter(Boolean)
    : [];

  // Parse tags
  const tags = row.tags
    ? row.tags.split('|').filter(Boolean)
    : [];

  return {
    id: row.id,
    teamName: row.team_name?.trim() || '',
    league: normalizeLeague(row.league?.trim() || ''),
    season,
    type,
    category: row.category?.trim() || '',
    imageUrl: row.image_url?.trim() || '',
    additionalImages,
    isWorldCup: row.is_world_cup?.trim().toLowerCase() === 'true',
    internationalTeam: row.international_team?.trim() || '',
    availableSizes: parseSizes(row.available_sizes),
    tags,
    isLongSleeve: row.is_long_sleeve?.trim().toLowerCase() === 'true',
    createdAt: row.created_at?.trim() || new Date().toISOString(),
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
  if (locale === 'en') return translations[jersey.id] ?? jersey.teamName;
  return jersey.teamName;
}

// ─── Debounce ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
