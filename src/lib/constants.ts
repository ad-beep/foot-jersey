import type { League, LocaleConfig } from '@/types';

// ─── Pricing ─────────────────────────────────────────────────
export const PRICES = {
  regular: 100,
  retro: 110,
  kids: 100,
  special: 100,
  stussy: 125,
  drip: 110,
  world_cup: 100,
  other_products: 150,
  customization: {
    nameAndNumber: 10,
    patch: 10,
    pants: 50,
    playerVersion: 10,
  },
  longSleeveExtra: 20,
  shippingFlat: 15,
} as const;

// ─── Season Threshold ────────────────────────────────────────
export const RETRO_SEASON_THRESHOLD = '24/25';
export const CURRENT_SEASON = '2025/26';

// ─── Currency ────────────────────────────────────────────────
export const CURRENCY = '₪';
export const CURRENCY_CODE = 'ILS';

// ─── Categories (Leagues) ────────────────────────────────────
export const CATEGORIES: {
  slug: League;
  labelKey: string;
  labelHe: string;
  labelEn: string;
  icon: string;
}[] = [
  { slug: 'england', labelKey: 'categories.england', labelHe: 'פרמייר ליג', labelEn: 'Premier League', icon: 'premier-league' },
  { slug: 'spain', labelKey: 'categories.spain', labelHe: 'לה ליגה', labelEn: 'La Liga', icon: 'la-liga' },
  { slug: 'germany', labelKey: 'categories.germany', labelHe: 'בונדסליגה', labelEn: 'Bundesliga', icon: 'bundesliga' },
  { slug: 'italy', labelKey: 'categories.italy', labelHe: 'סרייה A', labelEn: 'Serie A', icon: 'serie-a' },
  { slug: 'france', labelKey: 'categories.france', labelHe: 'ליג 1', labelEn: 'Ligue 1', icon: 'ligue-1' },
  { slug: 'rest_of_world', labelKey: 'categories.restOfWorld', labelHe: 'שאר העולם', labelEn: 'Rest of the World', icon: 'rest-of-world' },
  { slug: 'national_teams', labelKey: 'categories.nationalTeams', labelHe: 'נבחרות', labelEn: 'International', icon: 'international' },
  { slug: 'israeli_league', labelKey: 'categories.israeliLeague', labelHe: 'ליגת העל', labelEn: 'Israeli League', icon: 'israeli-league' },
];

// ─── Special Sections ───────────────────────────────────────
export const SPECIAL_SECTIONS: {
  slug: string;
  labelKey: string;
  labelHe: string;
  labelEn: string;
  icon: string;
  typeMatch: string;
  tagMatch?: string;
  filterMode: 'type' | 'tag' | 'season';
  description?: { en: string; he: string };
}[] = [
  { slug: 'world-cup-2026', labelKey: 'categories.worldCup2026', labelHe: 'מונדיאל 2026', labelEn: 'World Cup 2026', icon: 'world-cup', typeMatch: 'world_cup', filterMode: 'type', description: { en: 'Official World Cup 2026 jerseys', he: 'חולצות מונדיאל 2026 רשמיות' } },
  { slug: 'retro', labelKey: 'categories.retro', labelHe: 'רטרו', labelEn: 'Retro', icon: 'retro', typeMatch: 'retro', filterMode: 'type', description: { en: 'Classic jerseys from the golden eras', he: 'חולצות קלאסיות מתקופות הזהב' } },
  { slug: 'season-2526', labelKey: 'categories.season2526', labelHe: 'עונת 25/26', labelEn: '2025/26 Season', icon: 'season-2526', typeMatch: '', tagMatch: '', filterMode: 'season', description: { en: 'Latest season jerseys', he: 'חולצות העונה האחרונה' } },
  { slug: 'special', labelKey: 'categories.special', labelHe: 'מהדורה מיוחדת', labelEn: 'Special Edition', icon: 'special-edition', typeMatch: 'special', filterMode: 'type', description: { en: 'Limited edition and special releases', he: 'מהדורות מוגבלות ומיוחדות' } },
  { slug: 'drip', labelKey: 'categories.drip', labelHe: 'דריפ', labelEn: 'Drip', icon: 'drip', typeMatch: 'drip', filterMode: 'type', description: { en: 'Fashion-forward football style', he: 'סטייל כדורגל אופנתי' } },
  { slug: 'kids', labelKey: 'categories.kids', labelHe: 'ילדים', labelEn: 'Kids', icon: 'kids', typeMatch: 'kids', filterMode: 'type', description: { en: 'Kids sizes for young fans', he: 'מידות ילדים לאוהדים צעירים' } },
  { slug: 'long-sleeve', labelKey: 'categories.longSleeve', labelHe: 'שרוול ארוך', labelEn: 'Long Sleeve', icon: 'long-sleeve', typeMatch: '', tagMatch: 'ארוך', filterMode: 'tag', description: { en: 'Long sleeve jerseys', he: 'חולצות שרוול ארוך' } },
  { slug: 'other-products', labelKey: 'categories.otherProducts', labelHe: 'מוצרים נוספים', labelEn: 'Other Products', icon: 'other-products', typeMatch: 'other_products', filterMode: 'type', description: { en: 'Scarves, jackets, training wear', he: 'צעיפים, ז׳קטים, ביגוד אימון' } },
  { slug: 'mystery-box', labelKey: 'categories.mysteryBox', labelHe: 'קופסת הפתעה', labelEn: 'Mystery Box', icon: 'mystery-box', typeMatch: 'mystery-box', filterMode: 'type', description: { en: 'Surprise jersey boxes — pick your style, we pick the shirt', he: 'קופסאות הפתעה — בחר סגנון, אנחנו נבחר את החולצה' } },
  { slug: 'stussy-edition', labelKey: 'categories.stussyEdition', labelHe: 'מהדורת סטוסי', labelEn: 'Stussy Edition', icon: 'stussy-edition', typeMatch: '', tagMatch: 'stussy', filterMode: 'tag', description: { en: 'Stussy collaboration jerseys — limited streetwear drops', he: 'חולצות שיתוף פעולה עם Stussy — שחרורים מוגבלים' } },
];

// ─── Mystery Box Options ─────────────────────────────────────
export const MYSTERY_BOX_OPTIONS = [
  { slug: 'retro-mystery', labelEn: 'Retro Mystery Box', labelHe: 'קופסת הפתעה רטרו', price: 109, description: { en: 'A surprise retro jersey from the golden eras', he: 'חולצת רטרו הפתעה מתקופות הזהב' } },
  { slug: '2526-mystery', labelEn: '25/26 Mystery Box', labelHe: 'קופסת הפתעה 25/26', price: 99, description: { en: 'A surprise jersey from the current 25/26 season', he: 'חולצת הפתעה מעונת 25/26' } },
  { slug: 'world-cup-mystery', labelEn: 'World Cup Mystery Box', labelHe: 'קופסת הפתעה מונדיאל', price: 99, description: { en: 'A surprise World Cup national team jersey', he: 'חולצת נבחרת הפתעה ממונדיאל' } },
  { slug: 'mixed-mystery', labelEn: 'Mixed Mystery Box', labelHe: 'קופסת הפתעה מיקס', price: 109, description: { en: 'Any jersey from our entire collection — total surprise', he: 'חולצה כלשהי מכל הקולקציה — הפתעה מוחלטת' } },
  { slug: 'player-version-mystery', labelEn: 'Player Version Mystery Box', labelHe: 'קופסת הפתעה גרסת שחקן', price: 109, description: { en: 'A surprise player version jersey — premium quality', he: 'חולצת גרסת שחקן הפתעה — איכות פרימיום' } },
  { slug: 'special-edition-mystery', labelEn: 'Special Edition Mystery Box', labelHe: 'קופסת הפתעה מהדורה מיוחדת', price: 99, description: { en: 'A surprise special edition jersey — limited and unique', he: 'חולצת מהדורה מיוחדת הפתעה — מוגבלת וייחודית' } },
] as const;

// ─── Locales ─────────────────────────────────────────────────
export const LOCALES: Record<string, LocaleConfig> = {
  en: {
    locale: 'en',
    direction: 'ltr',
    label: 'English',
    fontClass: 'font-sans',
  },
  he: {
    locale: 'he',
    direction: 'rtl',
    label: 'עברית',
    fontClass: 'font-hebrew',
  },
};

export const DEFAULT_LOCALE = 'he';
export const SUPPORTED_LOCALES = ['en', 'he'] as const;

// ─── Cache ───────────────────────────────────────────────────
export const CACHE_TTL = Number(process.env.CACHE_TTL) || 1800;
export const CACHE_REVALIDATE = 60;

// ─── Pagination ──────────────────────────────────────────────
export const PRODUCTS_PER_PAGE = 24;
export const MOST_SOLD_COUNT = 8;

// ─── Google Sheets ───────────────────────────────────────────
export const SHEET_NAME = 'Jerseys';
export const SHEET_RANGE = 'A:J';

// ─── Site ────────────────────────────────────────────────────
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'FootJersey';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shopfootjersey.com';

// ─── Available Sizes ─────────────────────────────────────────
export const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
export const KIDS_SIZES = ['16', '18', '20', '22', '24', '26', '28'] as const;

// ─── Shipping & Returns Policy ──────────────────────────────
export const SHIPPING_POLICY = {
  deliveryTime: { min: 2, max: 4, unit: 'weeks' },
  freeShippingMinItems: 3,
  returnWindowDays: 0,
  damagedGoodsReplacement: true,
  policy: {
    en: {
      delivery: 'Delivery within 2–4 weeks',
      freeShipping: 'Free shipping on 3+ jerseys',
      returns: 'Free replacement for damaged goods',
      damaged: 'Free replacement for damaged goods',
      secure: 'Secure payment',
    },
    he: {
      delivery: 'משלוח תוך 2–4 שבועות',
      freeShipping: 'משלוח חינם על 3 חולצות ומעלה',
      returns: 'החלפה חינם על מוצרים פגומים',
      damaged: 'החלפה חינם על מוצרים פגומים',
      secure: 'תשלום מאובטח',
    },
  },
} as const;

// ─── Recommendation Weights ──────────────────────────────────
export const REC_WEIGHTS = {
  view: 1,
  like: 4,
  cartAdd: 5,
  purchase: 8,
  searchMatch: 3,
} as const;