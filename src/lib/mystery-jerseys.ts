import type { Jersey, League, Size } from '@/types';

// ─── Visual accent config per mystery jersey id ───────────────
export interface MysteryAccent {
  symbol: string;
  accent: string;
  glow: string;
  bg: string;
  labelEn: string;
  labelHe: string;
  hintEn: string;
  hintHe: string;
  descEn: string;
  descHe: string;
  insideEn: string[];
  insideHe: string[];
}

export const MYSTERY_ACCENT: Record<string, MysteryAccent> = {
  'retro-mystery': {
    symbol: "'90", accent: 'rgba(200,162,75,1)', glow: 'rgba(200,162,75,0.35)', bg: '#120e04',
    labelEn: 'Retro Mystery', labelHe: 'רטרו מיסטרי',
    hintEn: '1980s — 2005', hintHe: '1980 — 2005',
    descEn: 'A legendary kit from the golden eras. Could be 98 World Cup, a 90s Milan, a classic Barcelona.',
    descHe: 'ערכה אגדית מתקופות הזהב. יכול להיות מונדיאל 98, מילאן של שנות ה-90, ברצלונה קלאסית.',
    insideEn: ['Classic club jersey', 'Pre-2006 era', 'Could be any team'],
    insideHe: ['חולצת מועדון קלאסית', 'עידן לפני 2006', 'יכולה להיות כל קבוצה'],
  },
  '2526-mystery': {
    symbol: '25', accent: 'rgba(15,200,110,1)', glow: 'rgba(15,200,110,0.3)', bg: '#03100b',
    labelEn: '25/26 Season Mystery', labelHe: 'מיסטרי עונת 25/26',
    hintEn: 'Current Season', hintHe: 'עונה נוכחית',
    descEn: 'Fresh from the 25/26 season. Premier League, La Liga, Serie A — any top club. Brand new.',
    descHe: 'טרי מעונת 25/26. פרמייר ליג, לה ליגה, סרייה A — כל מועדון מוביל.',
    insideEn: ['Current season jersey', 'Top 5 leagues', 'Any club'],
    insideHe: ['חולצת עונה נוכחית', '5 הליגות המובילות', 'כל מועדון'],
  },
  'world-cup-mystery': {
    symbol: 'WC', accent: 'rgba(100,165,255,1)', glow: 'rgba(100,165,255,0.3)', bg: '#020c18',
    labelEn: 'World Cup 2026 Mystery', labelHe: 'מונדיאל 2026 מיסטרי',
    hintEn: 'USA · CAN · MEX', hintHe: 'ארה"ב · קנדה · מקסיקו',
    descEn: "A national team jersey from FIFA World Cup 2026. France? Brazil? Argentina?",
    descHe: 'חולצת נבחרת לאומית ממונדיאל 2026. צרפת? ברזיל? ארגנטינה?',
    insideEn: ['National team jersey', 'FIFA World Cup 2026', 'Any nation'],
    insideHe: ['חולצת נבחרת לאומית', 'מונדיאל FIFA 2026', 'כל מדינה'],
  },
  'mixed-mystery': {
    symbol: '∞', accent: 'rgba(255,77,46,1)', glow: 'rgba(255,77,46,0.35)', bg: '#100302',
    labelEn: 'Mixed Mystery', labelHe: 'מיקס מיסטרי',
    hintEn: 'Total Surprise', hintHe: 'הפתעה מוחלטת',
    descEn: "Our wildcard. Could be retro, current season, World Cup, or special. Maximum surprise.",
    descHe: "הג'וקר שלנו. יכול להיות רטרו, עונה נוכחית, מונדיאל, או מיוחד.",
    insideEn: ['Any era, any league', 'Highest surprise factor', 'Always worth more'],
    insideHe: ['כל עידן, כל ליגה', 'גורם ההפתעה הגבוה ביותר', 'תמיד שווה יותר'],
  },
  'special-edition-mystery': {
    symbol: '★', accent: 'rgba(210,130,255,1)', glow: 'rgba(180,80,255,0.3)', bg: '#0c0515',
    labelEn: 'Special Edition Mystery', labelHe: 'מהדורה מיוחדת מיסטרי',
    hintEn: 'Limited & Rare', hintHe: 'מוגבל ונדיר',
    descEn: 'Limited and special edition jerseys — collabs, anniversary editions, unique designs.',
    descHe: 'חולצות מהדורה מיוחדת ומוגבלת — שיתופי פעולה, מהדורות יובל.',
    insideEn: ['Limited edition jersey', 'Special collab or design', 'Rare drop'],
    insideHe: ['חולצת מהדורה מוגבלת', 'שיתוף פעולה מיוחד', 'דרופ נדיר'],
  },
  'player-version-mystery': {
    symbol: 'PV', accent: 'rgba(255,205,55,1)', glow: 'rgba(255,200,50,0.3)', bg: '#120a00',
    labelEn: 'Player Version Mystery', labelHe: 'גרסת שחקן מיסטרי',
    hintEn: 'Premium Quality', hintHe: 'איכות פרימיום',
    descEn: 'The exact jersey worn on the pitch. Better materials, tighter fit, authentic stitching.',
    descHe: 'אותה חולצה שמשחקים בה במגרש. חומרים טובים יותר, תפירה אמיתית.',
    insideEn: ['Player-version quality', 'Authentic materials', 'Any team or league'],
    insideHe: ['איכות גרסת שחקן', 'חומרים אותנטיים', 'כל קבוצה או ליגה'],
  },
  'england-mystery': {
    symbol: 'PL', accent: 'rgba(110,40,170,1)', glow: 'rgba(88,28,135,0.4)', bg: '#0e0a17',
    labelEn: 'Premier League Mystery', labelHe: 'מיסטרי פרמייר ליג',
    hintEn: 'England · 20 Clubs', hintHe: 'אנגליה · 20 קבוצות',
    descEn: "A surprise Premier League jersey — could be any of England's 20 top-flight clubs.",
    descHe: 'חולצת פרמייר ליג הפתעה — יכולה להיות כל אחת מ-20 הקבוצות.',
    insideEn: ['Premier League club', 'Current or retro season', 'England top flight'],
    insideHe: ['מועדון פרמייר ליג', 'עונה נוכחית או רטרו', 'הליגה האנגלית'],
  },
  'spain-mystery': {
    symbol: 'LL', accent: 'rgba(200,50,18,1)', glow: 'rgba(180,50,18,0.35)', bg: '#180a05',
    labelEn: 'La Liga Mystery', labelHe: 'מיסטרי לה ליגה',
    hintEn: 'Spain · 20 Clubs', hintHe: 'ספרד · 20 קבוצות',
    descEn: "A surprise La Liga jersey — Barcelona, Real Madrid, Atletico, or any Spanish club.",
    descHe: 'חולצת לה ליגה הפתעה — ברצלונה, ריאל מדריד, אטלטיקו, או כל קבוצה ספרדית.',
    insideEn: ['La Liga club jersey', 'Spain top flight', 'Any club'],
    insideHe: ['חולצת מועדון לה ליגה', 'הליגה הספרדית', 'כל קבוצה'],
  },
  'italy-mystery': {
    symbol: 'SA', accent: 'rgba(50,80,200,1)', glow: 'rgba(30,58,180,0.35)', bg: '#060d1f',
    labelEn: 'Serie A Mystery', labelHe: 'מיסטרי סרייה A',
    hintEn: 'Italy · 20 Clubs', hintHe: 'איטליה · 20 קבוצות',
    descEn: "A surprise Serie A jersey — Inter, Juventus, Milan, Napoli, or any Italian club.",
    descHe: 'חולצת סרייה A הפתעה — אינטר, יובנטוס, מילאן, נאפולי, או כל קבוצה איטלקית.',
    insideEn: ['Serie A club jersey', 'Italy top flight', 'Any club'],
    insideHe: ['חולצת מועדון סרייה A', 'הליגה האיטלקית', 'כל קבוצה'],
  },
  'germany-mystery': {
    symbol: 'BL', accent: 'rgba(200,20,20,1)', glow: 'rgba(180,20,20,0.3)', bg: '#170505',
    labelEn: 'Bundesliga Mystery', labelHe: 'מיסטרי בונדסליגה',
    hintEn: 'Germany · 18 Clubs', hintHe: 'גרמניה · 18 קבוצות',
    descEn: "A surprise Bundesliga jersey — Bayern, Dortmund, Leverkusen, or any German club.",
    descHe: 'חולצת בונדסליגה הפתעה — באירן, דורטמונד, לברקוזן, או כל קבוצה גרמנית.',
    insideEn: ['Bundesliga club jersey', 'Germany top flight', 'Any club'],
    insideHe: ['חולצת מועדון בונדסליגה', 'הליגה הגרמנית', 'כל קבוצה'],
  },
  'france-mystery': {
    symbol: 'L1', accent: 'rgba(15,140,60,1)', glow: 'rgba(15,120,50,0.35)', bg: '#030f08',
    labelEn: 'Ligue 1 Mystery', labelHe: 'מיסטרי ליג 1',
    hintEn: 'France · 18 Clubs', hintHe: 'צרפת · 18 קבוצות',
    descEn: "A surprise Ligue 1 jersey — PSG, Monaco, Marseille, or any French club.",
    descHe: "חולצת ליג 1 הפתעה — פריז, מונקו, מרסיי, או כל קבוצה צרפתית.",
    insideEn: ['Ligue 1 club jersey', 'France top flight', 'Any club'],
    insideHe: ['חולצת מועדון ליג 1', 'הליגה הצרפתית', 'כל קבוצה'],
  },
  'national-teams-mystery': {
    symbol: 'INT', accent: 'rgba(160,100,20,1)', glow: 'rgba(140,80,18,0.35)', bg: '#130a02',
    labelEn: 'International Mystery', labelHe: 'מיסטרי נבחרות',
    hintEn: 'FIFA · 211 Nations', hintHe: 'FIFA · 211 מדינות',
    descEn: "A national team jersey from anywhere in the world — Europe, South America, Asia.",
    descHe: 'חולצת נבחרת לאומית מכל מקום בעולם — אירופה, דרום אמריקה, אסיה.',
    insideEn: ['Any national team', 'FIFA member nation', 'Any continent'],
    insideHe: ['כל נבחרת לאומית', 'חברה ב-FIFA', 'כל יבשת'],
  },
  'rest-of-world-mystery': {
    symbol: '∞', accent: 'rgba(17,110,100,1)', glow: 'rgba(15,94,89,0.35)', bg: '#030f10',
    labelEn: 'Rest of World Mystery', labelHe: 'מיסטרי שאר העולם',
    hintEn: 'Global · All Leagues', hintHe: 'גלובלי · כל הליגות',
    descEn: "A club jersey from leagues outside the top 5 — South America, Asia, Africa, MLS.",
    descHe: 'חולצת מועדון מליגות מחוץ ל-5 המובילות — דרום אמריקה, אסיה, אפריקה, MLS.',
    insideEn: ['Non-top-5 league club', 'South America / Asia / Africa', 'Global football'],
    insideHe: ['מועדון מחוץ ל-5 מובילות', 'דרום אמריקה / אסיה / אפריקה', 'כדורגל גלובלי'],
  },
  'israeli-mystery': {
    symbol: 'IL', accent: 'rgba(0,100,230,1)', glow: 'rgba(0,100,230,0.3)', bg: '#010818',
    labelEn: 'Israeli League Mystery', labelHe: "מיסטרי ליגת העל",
    hintEn: "Israel · Ligat Ha'Al", hintHe: "ישראל · ליגת העל",
    descEn: "A surprise Israeli Premier League jersey — Maccabi, Hapoel, Beitar, or any Israeli club.",
    descHe: "חולצת ליגת העל הפתעה — מכבי, הפועל, בית\"ר, או כל קבוצה ישראלית.",
    insideEn: ['Israeli Premier League club', "Ligat Ha'Al", 'Any club'],
    insideHe: ['קבוצת ליגת העל', 'הליגה הישראלית', 'כל קבוצה'],
  },
  'kids-mystery': {
    symbol: 'K', accent: 'rgba(50,80,200,1)', glow: 'rgba(50,80,180,0.3)', bg: '#060d1f',
    labelEn: 'Kids Mystery Box', labelHe: 'קופסת הפתעה ילדים',
    hintEn: 'Sizes 16–28', hintHe: 'מידות 16–28',
    descEn: "A surprise kids jersey — any top club or national team, sizes 16–28.",
    descHe: 'חולצת ילדים הפתעה — כל קבוצה מובילה או נבחרת, מידות 16–28.',
    insideEn: ["Kids jersey (sizes 16–28)", 'Any club or national team', 'New with tags'],
    insideHe: ["חולצת ילדים (מידות 16–28)", 'כל קבוצה או נבחרת', 'חדש עם תגיות'],
  },
  'drip-mystery': {
    symbol: 'D', accent: 'rgba(220,60,30,1)', glow: 'rgba(200,60,30,0.3)', bg: '#120302',
    labelEn: 'Drip Mystery Box', labelHe: 'קופסת הפתעה דריפ',
    hintEn: 'Street · Culture', hintHe: 'רחוב · תרבות',
    descEn: "A surprise drip/streetwear jersey — bold graphics, oversized culture.",
    descHe: 'חולצת דריפ הפתעה — גרפיקה נועזת, תרבות streetwear.',
    insideEn: ['Drip / streetwear style', 'Bold graphics', 'Culture drop'],
    insideHe: ['סגנון דריפ / streetwear', 'גרפיקה נועזת', 'תרבות'],
  },
};

const ADULT_SIZES: Size[] = ['S', 'M', 'L', 'XL', 'XXL'];
const KIDS_SIZES_ARR = ['16', '18', '20', '22', '24', '26', '28'];

function mkMystery(
  id: string,
  nameHe: string,
  league: League,
  price: number,
  tags: string[],
  isKids = false,
): Jersey {
  return {
    id,
    teamName: nameHe,
    nameEn: MYSTERY_ACCENT[id]?.labelEn ?? id,
    league,
    season: '25/26',
    type: 'mystery',
    category: 'mystery-box',
    imageUrl: '',
    additionalImages: [],
    isWorldCup: false,
    internationalTeam: '',
    availableSizes: isKids ? (KIDS_SIZES_ARR as unknown as Size[]) : ADULT_SIZES,
    tags: ['mystery-box', ...tags],
    isLongSleeve: false,
    createdAt: '2025-01-01T00:00:00Z',
    price,
    slug: id,
  };
}

// ─── Main 6 (shown prominently on mystery-box page + in their collection) ──
const MAIN_MYSTERY: Jersey[] = [
  mkMystery('retro-mystery',            'רטרו מיסטרי',          'rest_of_world',   100, ['mystery-main', 'for:retro']),
  mkMystery('2526-mystery',             'מיסטרי עונת 25/26',    'rest_of_world',    90, ['mystery-main', 'for:season-2526']),
  mkMystery('world-cup-mystery',        'מונדיאל 2026 מיסטרי',  'national_teams',   90, ['mystery-main', 'for:world-cup-2026']),
  mkMystery('mixed-mystery',            'מיקס מיסטרי',          'rest_of_world',   100, ['mystery-main']),
  mkMystery('special-edition-mystery',  'מהדורה מיוחדת מיסטרי', 'rest_of_world',    90, ['mystery-main', 'for:special']),
  mkMystery('player-version-mystery',   'גרסת שחקן מיסטרי',     'rest_of_world',   100, ['mystery-main']),
];

// ─── League-specific (shown first in each league/collection page) ──────────
const LEAGUE_MYSTERY: Jersey[] = [
  mkMystery('england-mystery',         'מיסטרי פרמייר ליג',   'england',         90, []),
  mkMystery('spain-mystery',           'מיסטרי לה ליגה',      'spain',           90, []),
  mkMystery('italy-mystery',           'מיסטרי סרייה A',      'italy',           90, []),
  mkMystery('germany-mystery',         'מיסטרי בונדסליגה',    'germany',         90, []),
  mkMystery('france-mystery',          'מיסטרי ליג 1',        'france',          90, []),
  mkMystery('national-teams-mystery',  'מיסטרי נבחרות',       'national_teams',  90, []),
  mkMystery('rest-of-world-mystery',   'מיסטרי שאר העולם',    'rest_of_world',   90, []),
  mkMystery('israeli-mystery',         "מיסטרי ליגת העל",     'israeli_league',  90, []),
  mkMystery('kids-mystery',            'קופסת הפתעה ילדים',   'rest_of_world',   90, ['for:kids'], true),
  mkMystery('drip-mystery',            'קופסת הפתעה דריפ',    'rest_of_world',  100, ['for:drip']),
];

export const ALL_MYSTERY_JERSEYS: Jersey[] = [...MAIN_MYSTERY, ...LEAGUE_MYSTERY];
export const MAIN_MYSTERY_IDS = new Set(MAIN_MYSTERY.map((j) => j.id));
