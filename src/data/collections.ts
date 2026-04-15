export interface CollectionData {
  slug: string;
  categorySlug: string; // maps to discover page filter
  en: {
    name: string;
    kicker: string;
    headline: string;
    description: string;
    body: string;
    ctaLabel: string;
    fact1Label: string;
    fact1Value: string;
    fact2Label: string;
    fact2Value: string;
    fact3Label: string;
    fact3Value: string;
  };
  he: {
    name: string;
    kicker: string;
    headline: string;
    description: string;
    body: string;
    ctaLabel: string;
    fact1Label: string;
    fact1Value: string;
    fact2Label: string;
    fact2Value: string;
    fact3Label: string;
    fact3Value: string;
  };
  accent: string;
  bgFrom: string;
}

export const COLLECTIONS: CollectionData[] = [
  {
    slug: 'retro',
    categorySlug: 'retro',
    accent: '#C8A24B',
    bgFrom: 'rgba(200,162,75,0.06)',
    en: {
      name: 'Retro Classics',
      kicker: 'Archive · 1990–2010',
      headline: 'Where legends\nlive forever.',
      description: 'The jerseys that shaped football history — now yours.',
      body: 'From the golden yellow of Brazil\'s 1994 squad to the iconic Baggio number 10, from Ajax\'s 1995 Champions League triumph to the Galacticos era at the Bernabéu. These aren\'t just jerseys — they\'re portals. Every stitch carries a moment that stopped the world. We source only authentic-quality reproductions, each true to the original cut, badge, and colourway.',
      ctaLabel: 'Shop Retro Collection',
      fact1Label: 'Era',
      fact1Value: '1990–2010',
      fact2Label: 'Kits available',
      fact2Value: '50+',
      fact3Label: 'Starting from',
      fact3Value: '₪110',
    },
    he: {
      name: 'רטרו קלאסיק',
      kicker: 'ארכיב · 1990–2010',
      headline: 'שם האגדות\nחיות לנצח.',
      description: 'החולצות שעיצבו את היסטוריית הכדורגל — עכשיו שלך.',
      body: 'מהצהוב הזהוב של ברזיל 94\' עד מספר 10 של באג\'ו האיקוני, מניצחון אייקס בליגת האלופות 95\' ועד עידן הגלקטיקוס בברנבאו. אלה לא סתם חולצות — הן שערים לרגעים שעצרו את העולם. אנחנו מספקים רק חולצות באיכות אותנטית, נאמנות לחיתוך המקורי, הסמל והצבעים.',
      ctaLabel: 'קנה קולקציית רטרו',
      fact1Label: 'תקופה',
      fact1Value: '1990–2010',
      fact2Label: 'ערכות זמינות',
      fact2Value: '50+',
      fact3Label: 'החל מ',
      fact3Value: '₪110',
    },
  },
  {
    slug: 'world-cup-2026',
    categorySlug: 'world-cup',
    accent: '#1A5C44',
    bgFrom: 'rgba(15,61,46,0.08)',
    en: {
      name: 'World Cup 2026',
      kicker: 'National Teams · USA / Canada / Mexico',
      headline: 'Your nation.\nYour colours.',
      description: 'Every national team jersey from the 2026 World Cup.',
      body: 'The 2026 FIFA World Cup will be the biggest in history — 48 nations, three host countries, and billions watching. We carry the official-quality jerseys for every participating nation. Whether you\'re backing your home country or picking a dark horse, we have every shirt. Brazil, Argentina, France, England, Israel, Morocco — all here.',
      ctaLabel: 'Shop World Cup 2026',
      fact1Label: 'Nations',
      fact1Value: '48',
      fact2Label: 'Host countries',
      fact2Value: '3',
      fact3Label: 'Starting from',
      fact3Value: '₪99',
    },
    he: {
      name: 'מונדיאל 2026',
      kicker: 'נבחרות לאומיות · ארה"ב / קנדה / מקסיקו',
      headline: 'המדינה שלך.\nהצבעים שלך.',
      description: 'כל חולצות הנבחרות הלאומיות ממונדיאל 2026.',
      body: 'מונדיאל FIFA 2026 יהיה הגדול ביותר בהיסטוריה — 48 נבחרות, שלוש מדינות מארחות, ומיליארדים צופים. יש לנו חולצות באיכות רשמית לכל נבחרת משתתפת. בין אם אתם תומכים במדינת מוצאכם או בוחרים סוס שחור — יש לנו את כל החולצות. ברזיל, ארגנטינה, צרפת, אנגליה, ישראל, מרוקו — הכל כאן.',
      ctaLabel: 'קנה מונדיאל 2026',
      fact1Label: 'נבחרות',
      fact1Value: '48',
      fact2Label: 'מדינות מארחות',
      fact2Value: '3',
      fact3Label: 'החל מ',
      fact3Value: '₪99',
    },
  },
  {
    slug: 'drip',
    categorySlug: 'drip',
    accent: '#FF4D2E',
    bgFrom: 'rgba(255,77,46,0.05)',
    en: {
      name: 'Drip',
      kicker: 'Street Culture · Limited Drops',
      headline: 'Football meets\nstreet culture.',
      description: 'Where football fashion meets the streets.',
      body: 'The Drip collection is for the style-forward fan. These aren\'t the jerseys you wear to the stadium — they\'re the ones you wear everywhere else. Mashups, cross-brand collabs, limited editions, and designs that blur the line between sport and streetwear. Not everyone will understand it. That\'s the point.',
      ctaLabel: 'Shop Drip Collection',
      fact1Label: 'Style',
      fact1Value: 'Street',
      fact2Label: 'Drops',
      fact2Value: 'Limited',
      fact3Label: 'Starting from',
      fact3Value: '₪105',
    },
    he: {
      name: 'דריפ',
      kicker: 'תרבות רחוב · דרופים מוגבלים',
      headline: 'כדורגל פוגש\nתרבות רחוב.',
      description: 'כאשר אופנת כדורגל פוגשת את הרחוב.',
      body: 'קולקציית הדריפ היא לאוהד שמוביל טרנד. אלה לא החולצות שלובשים לאצטדיון — אלה החולצות שלובשים בכל מקום אחר. שילובים, שיתופי פעולה בין-מותגיים, מהדורות מוגבלות ועיצובים שמטשטשים את הגבול בין ספורט לבין רחוב. לא כולם יבינו את זה. זה הרעיון.',
      ctaLabel: 'קנה קולקציית דריפ',
      fact1Label: 'סגנון',
      fact1Value: 'רחוב',
      fact2Label: 'דרופים',
      fact2Value: 'מוגבל',
      fact3Label: 'החל מ',
      fact3Value: '₪105',
    },
  },
  {
    slug: 'stussy-edition',
    categorySlug: 'stussy-edition',
    accent: '#C8A24B',
    bgFrom: 'rgba(30,20,60,0.15)',
    en: {
      name: 'Stussy Edition',
      kicker: 'Collab · Premium Streetwear',
      headline: 'The most sought\nafter kits.',
      description: 'Stussy x Football — the ultimate streetwear collab.',
      body: 'Stussy is the original streetwear brand. Football is the world\'s sport. When the two collide, the results are extraordinary. Our Stussy Edition jerseys blend the distinctive Stussy script with club crests and national colours — creating pieces that work on the pitch, on the court, and on the street. These sell out fast.',
      ctaLabel: 'Shop Stussy Edition',
      fact1Label: 'Brand',
      fact1Value: 'Stussy',
      fact2Label: 'Availability',
      fact2Value: 'Limited',
      fact3Label: 'Starting from',
      fact3Value: '₪115',
    },
    he: {
      name: 'מהדורת סטוסי',
      kicker: 'שיתוף פעולה · סטריטוור פרמיום',
      headline: 'הערכות\nהכי מבוקשות.',
      description: 'סטוסי x כדורגל — שיתוף הפעולה האולטימטיבי.',
      body: 'סטוסי היא מותג הסטריטוור המקורי. כדורגל הוא הספורט של העולם. כשהשניים נפגשים, התוצאות הן יוצאות דופן. חולצות מהדורת הסטוסי שלנו משלבות את הסקריפט הייחודי של סטוסי עם סמלי הקבוצות וצבעי הנבחרות — יוצרות פריטים שעובדים על המגרש, על המדרכה ובכל מקום. הן אוזלות מהר.',
      ctaLabel: 'קנה מהדורת סטוסי',
      fact1Label: 'מותג',
      fact1Value: 'Stussy',
      fact2Label: 'זמינות',
      fact2Value: 'מוגבל',
      fact3Label: 'החל מ',
      fact3Value: '₪115',
    },
  },
];

export function getCollection(slug: string): CollectionData | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
