// ─── Product Types ────────────────────────────────────────────
export type JerseyType = 'regular' | 'retro' | 'kids' | 'special' | 'drip' | 'world_cup' | 'other_products';

export type League =
  | 'england'
  | 'spain'
  | 'italy'
  | 'germany'
  | 'france'
  | 'national_teams'
  | 'rest_of_world';

export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type KidsSize = '16' | '18' | '20' | '22' | '24' | '26' | '28';

export interface Jersey {
  id: string;
  teamName: string;
  league: League;
  season: string;
  type: JerseyType;
  category: string;
  imageUrl: string;
  additionalImages: string[];  // Back view + gallery angles
  isWorldCup: boolean;
  internationalTeam: string;
  availableSizes: Size[];
  tags: string[];
  isLongSleeve: boolean;
  createdAt: string;
  // Computed
  price: number;
  slug: string;
}

// ─── Cart Types ──────────────────────────────────────────────
export interface CartCustomization {
  customName: string;
  customNumber: string;
  hasPatch: boolean;
  patchText: string;
  hasPants: boolean;
  isPlayerVersion: boolean;
}

export interface CartItem {
  jerseyId: string;
  jersey: Jersey;
  size: Size;
  quantity: number;
  customization: CartCustomization;
  totalPrice: number;
}

// ─── Filter Types ────────────────────────────────────────────
export interface FilterState {
  team: string;
  season: string;
  type: JerseyType | 'all';
}

// ─── i18n Types ──────────────────────────────────────────────
export type Locale = 'en' | 'he';

export type Direction = 'ltr' | 'rtl';

export interface LocaleConfig {
  locale: Locale;
  direction: Direction;
  label: string;
  fontClass: string;
}

// ─── API Types ───────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  error?: string;
  cached: boolean;
  timestamp: number;
}

export interface SheetRow {
  id: string;
  team_name: string;
  league: string;
  season: string;
  type: string;
  category: string;
  image_url: string;
  additional_images: string;
  is_world_cup: string;
  international_team: string;
  available_sizes: string;
  tags: string;
  is_long_sleeve: string;
  created_at: string;
}

// ─── SEO Types ───────────────────────────────────────────────
export interface PageMeta {
  title: string;
  description: string;
  image?: string;
  url?: string;
}
