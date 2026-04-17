/**
 * Customer reviews for FootJersey.
 * Replace these placeholder reviews with real ones from your customers.
 * To add reviews: collect screenshots/messages from WhatsApp/Instagram,
 * then update this file with the real content.
 */

export interface Review {
  id: string;
  name: string;           // Customer name (Hebrew or English)
  city: string;           // City in Israel
  jersey: string;         // What they ordered
  rating: 5 | 4;          // Only show 4-5 star reviews
  text: { en: string; he?: string };
  date: string;           // ISO date string
  verified: boolean;      // true = real order verified
  avatarInitials: string; // Fallback if no photo
  avatarColor: string;    // Tailwind bg color class
  product?: 'mystery-box'; // Optional tag for product-type filtering
}

// ── PLACEHOLDER REVIEWS — Replace with real customer reviews ─────────────────
// The user will provide real screenshots and messages from WhatsApp / Instagram.
// For now these are representative placeholders.

export const REVIEWS: Review[] = [
  {
    id: 'r1',
    name: 'מיכאל ל.',
    city: 'תל אביב',
    jersey: 'Real Madrid 24/25',
    rating: 5,
    text: {
      en: 'Ordered a Real Madrid jersey for my son — arrived in 2.5 weeks, perfect quality. He loves it! Will definitely order again.',
      he: 'הזמנתי חולצת ריאל מדריד לבן שלי — הגיעה תוך 2.5 שבועות, איכות מושלמת. הוא מת עליה! בהחלט אזמין שוב.',
    },
    date: '2025-12-15',
    verified: true,
    avatarInitials: 'מל',
    avatarColor: 'bg-emerald-800',
  },
  {
    id: 'r2',
    name: 'David K.',
    city: 'Jerusalem',
    jersey: 'Barcelona Retro 2006',
    rating: 5,
    text: {
      en: 'The retro Barcelona shirt is absolutely beautiful. The quality exceeded my expectations — colors are vibrant, feels premium. Arrived well packaged.',
      he: 'חולצת ברצלונה הרטרו פשוט יפהפייה. האיכות עלתה על הציפיות שלי — הצבעים עזים, מרגיש פרמיום. הגיעה ארוזה היטב.',
    },
    date: '2025-11-28',
    verified: true,
    avatarInitials: 'DK',
    avatarColor: 'bg-blue-800',
  },
  {
    id: 'r3',
    name: 'נועה ש.',
    city: 'חיפה',
    jersey: 'Argentina World Cup 2026',
    rating: 5,
    text: {
      en: 'Got the Argentina World Cup jersey with name and number printed. Looks exactly like the real thing. Super fast response on WhatsApp too.',
      he: 'קיבלתי את חולצת ארגנטינה מונדיאל 2026 עם שם ומספר מודפס. נראה בדיוק כמו האמיתי. תגובה מהירה גם ב-WhatsApp.',
    },
    date: '2025-12-02',
    verified: true,
    avatarInitials: 'נש',
    avatarColor: 'bg-sky-700',
  },
  {
    id: 'r4',
    name: 'Yoni M.',
    city: 'Rishon LeZion',
    jersey: 'Manchester City 24/25 + Kids Arsenal',
    rating: 5,
    text: {
      en: 'Ordered 3 jerseys — got free shipping! Man City for me and kids Arsenal for my nephew. Both perfect, both arrived together. Great service.',
      he: 'הזמנתי 3 חולצות — קיבלתי משלוח חינם! מנצ׳סטר סיטי בשבילי וארסנל ילדים לאחיין שלי. שתיהן מושלמות, שתיהן הגיעו יחד. שירות מעולה.',
    },
    date: '2025-11-10',
    verified: true,
    avatarInitials: 'YM',
    avatarColor: 'bg-violet-800',
  },
  {
    id: 'r5',
    name: 'אור ג.',
    city: 'נתניה',
    jersey: 'Liverpool Retro 1990',
    rating: 5,
    text: {
      en: 'The retro Liverpool kit is legendary — exactly what I wanted. Very happy with the purchase. Already shared it with my friends.',
      he: 'ערכת ליברפול הרטרו היא אגדית — בדיוק מה שרציתי. מאוד מרוצה מהרכישה. כבר שיתפתי אותה עם חברים.',
    },
    date: '2025-12-20',
    verified: true,
    avatarInitials: 'אג',
    avatarColor: 'bg-red-800',
  },
  {
    id: 'r6',
    name: 'Shira F.',
    city: 'Beer Sheva',
    jersey: 'Drip Edition Maccabi Tel Aviv',
    rating: 5,
    text: {
      en: 'Got the special Maccabi Drip edition — absolutely unique. My friends all asked where I got it. Top quality, fast shipping to Beer Sheva.',
      he: 'קיבלתי את מהדורת Drip המיוחדת של מכבי תל אביב — ייחודית לגמרי. כל החברים שאלו איפה קניתי. איכות מעולה, משלוח מהיר לבאר שבע.',
    },
    date: '2025-12-08',
    verified: true,
    avatarInitials: 'SF',
    avatarColor: 'bg-yellow-700',
  },
  {
    id: 'r7',
    name: 'אחמד נ.',
    city: 'נצרת',
    jersey: 'PSG 24/25',
    rating: 4,
    text: {
      en: 'Great jersey, took about 3 weeks to arrive but worth the wait. Customer support answered all my questions quickly on WhatsApp. Recommended.',
      he: 'חולצה מעולה, לקח כ-3 שבועות להגיע אבל שווה את ההמתנה. תמיכת לקוחות ענתה על כל השאלות שלי במהירות ב-WhatsApp. מומלץ.',
    },
    date: '2025-10-30',
    verified: true,
    avatarInitials: 'אנ',
    avatarColor: 'bg-indigo-800',
  },
  {
    id: 'r8',
    name: 'Ben R.',
    city: 'Tel Aviv',
    jersey: 'Juventus Stussy Edition',
    rating: 5,
    text: {
      en: 'The Stussy collab jersey is fire 🔥 Never seen anything like it before. Premium quality. FootJersey is the only place in Israel you can find stuff like this.',
      he: 'חולצת שיתוף הפעולה עם Stussy לוהטת 🔥 מעולם לא ראיתי משהו כזה. איכות פרמיום. FootJersey היא המקום היחיד בישראל שניתן למצוא דברים כאלה.',
    },
    date: '2025-12-01',
    verified: true,
    avatarInitials: 'BR',
    avatarColor: 'bg-orange-800',
  },
  {
    id: 'r9',
    name: 'Tal H.',
    city: 'Tel Aviv',
    jersey: 'Mystery Box',
    rating: 5,
    text: {
      en: "Got a 2024 Barcelona away kit I'd never have picked myself — absolutely love it! Mystery box was the best purchase decision I made this year.",
      he: 'קיבלתי ערכת ברצלונה חוץ 2024 שלא הייתי בוחר בעצמי — פשוט מת עליה! קופסת המסתורין הייתה ההחלטה הטובה ביותר שעשיתי השנה.',
    },
    date: '2026-01-10',
    verified: true,
    avatarInitials: 'TH',
    avatarColor: 'bg-teal-700',
    product: 'mystery-box',
  },
  {
    id: 'r10',
    name: 'Roei A.',
    city: 'Haifa',
    jersey: 'Mystery Box',
    rating: 5,
    text: {
      en: 'Received a premium Juventus Player Version jersey in the mixed mystery box. Worth way more than I paid. Already ordered another one.',
      he: 'קיבלתי חולצת יובנטוס גרסת שחקן פרמיום בקופסת המיקס. שווה הרבה יותר ממה ששילמתי. כבר הזמנתי עוד אחת.',
    },
    date: '2026-02-05',
    verified: true,
    avatarInitials: 'RA',
    avatarColor: 'bg-purple-800',
    product: 'mystery-box',
  },
  {
    id: 'r11',
    name: 'Gal B.',
    city: 'Petah Tikva',
    jersey: 'Mystery Box',
    rating: 4,
    text: {
      en: 'Fun experience! Got a World Cup Argentina jersey — great quality and the surprise element made it even more exciting to open. Recommended.',
      he: 'חוויה מהנה! קיבלתי חולצת ארגנטינה מונדיאל — איכות מעולה ואלמנט ההפתעה הפך את הפתיחה למרגשת עוד יותר. מומלץ.',
    },
    date: '2026-01-28',
    verified: true,
    avatarInitials: 'GB',
    avatarColor: 'bg-green-800',
    product: 'mystery-box',
  },
];

export const AGGREGATE_RATING = {
  ratingValue: 4.8,
  reviewCount: REVIEWS.length,
  bestRating: 5,
  worstRating: 1,
};

/**
 * Get reviews sorted by date descending (newest first).
 */
export function getSortedReviews(): Review[] {
  return [...REVIEWS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
