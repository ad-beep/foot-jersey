/**
 * FAQ data for FootJersey.
 * Used on the /faq page and as FAQ preview on the homepage.
 * Bilingual: English + Hebrew.
 */

export interface FaqEntry {
  id: string;
  question: { en: string; he: string };
  answer: { en: string; he: string };
  category: 'ordering' | 'shipping' | 'payment' | 'product' | 'returns' | 'trust';
}

export const FAQS: FaqEntry[] = [
  // ── Trust / Legitimacy ──────────────────────────────────────────────────
  {
    id: 'is-footjersey-legit',
    category: 'trust',
    question: {
      en: 'Is FootJersey a legitimate store? Can I trust it?',
      he: 'האם FootJersey חנות אמיתית? האם אפשר לסמוך עליה?',
    },
    answer: {
      en: 'Yes, FootJersey is a real, operational online store serving customers across Israel. We use secure PayPal payment processing and replace damaged goods for free. Hundreds of football fans across Israel have ordered from us. You can reach us anytime on WhatsApp at +972-58-414-0508 and follow us on Instagram (@foot_jersey4) and TikTok (@foot.jerseys4) to see our products and customer posts.',
      he: 'כן, FootJersey היא חנות אינטרנטית אמיתית ופעילה שמשרתת לקוחות בכל רחבי ישראל. אנחנו משתמשים ב-PayPal לתשלום מאובטח ומחליפים מוצרים פגומים בחינם. מאות אוהדי כדורגל בכל ישראל כבר הזמינו אצלנו. תוכל ליצור איתנו קשר בכל עת ב-WhatsApp: 058-414-0508, ולעקוב אחרינו באינסטגרם (@foot_jersey4) ובטיקטוק (@foot.jerseys4).',
    },
  },
  {
    id: 'is-safe-to-pay',
    category: 'trust',
    question: {
      en: 'Is it safe to pay on FootJersey?',
      he: 'האם בטוח לשלם ב-FootJersey?',
    },
    answer: {
      en: 'Absolutely. We use PayPal — the world\'s most trusted payment platform — and BIT, Israel\'s official instant payment service. We never store your card details on our servers. All transactions are processed through these secure, trusted payment systems.',
      he: 'בהחלט. אנחנו משתמשים ב-PayPal — פלטפורמת התשלום המהימנה בעולם — וב-BIT, שירות התשלום המיידי הרשמי של ישראל. אנחנו לעולם לא שומרים את פרטי הכרטיס שלך על השרתים שלנו. כל העסקאות מעובדות דרך מערכות תשלום אלה המאובטחות והמהימנות.',
    },
  },

  // ── Ordering ────────────────────────────────────────────────────────────
  {
    id: 'how-to-order',
    category: 'ordering',
    question: {
      en: 'How do I place an order?',
      he: 'איך מבצעים הזמנה?',
    },
    answer: {
      en: 'Simply browse our collection, choose your jersey and size, add it to your cart, and proceed to checkout. Enter your shipping details, choose PayPal or BIT as your payment method, and complete the payment. You\'ll receive a confirmation email immediately.',
      he: 'פשוט עיין בקולקציה שלנו, בחר את החולצה והמידה, הוסף לעגלת הקניות, ועבור לתשלום. הכנס את פרטי המשלוח שלך, בחר PayPal או BIT כאמצעי תשלום, והשלם את התשלום. תקבל מייל אישור מיידית.',
    },
  },
  {
    id: 'customization',
    category: 'ordering',
    question: {
      en: 'Can I get my name and number printed on the jersey?',
      he: 'האם אפשר להדפיס שם ומספר על החולצה?',
    },
    answer: {
      en: 'Yes! We offer jersey customization. You can add your name and number for +₪10, add a patch for +₪10, or upgrade to player version quality for +₪10. Select these options when adding the jersey to your cart.',
      he: 'כן! אנחנו מציעים התאמה אישית לחולצות. תוכל להוסיף שם ומספר ב-+₪10, להוסיף טלאי ב-+₪10, או לשדרג לאיכות גרסת שחקן ב-+₪10. בחר את האפשרויות האלה כשאתה מוסיף את החולצה לעגלת הקניות.',
    },
  },
  {
    id: 'sizes-available',
    category: 'ordering',
    question: {
      en: 'What sizes are available?',
      he: 'אילו מידות זמינות?',
    },
    answer: {
      en: 'Adult jerseys are available in S, M, L, XL, and XXL. Kids jerseys are available in ages 4–14 (sizes 16, 18, 20, 22, 24, 26, 28). Check our Size Guide page for a detailed measurement chart to find your perfect fit.',
      he: 'חולצות מבוגרים זמינות במידות S, M, L, XL ו-XXL. חולצות ילדים זמינות לגילאים 4-14 (מידות 16, 18, 20, 22, 24, 26, 28). בדוק את דף מדריך המידות שלנו לתרשים מדידה מפורט כדי למצוא את ההתאמה המושלמת שלך.',
    },
  },

  // ── Shipping ────────────────────────────────────────────────────────────
  {
    id: 'shipping-time',
    category: 'shipping',
    question: {
      en: 'How long does delivery take?',
      he: 'כמה זמן לוקח המשלוח?',
    },
    answer: {
      en: 'Delivery typically takes 2–4 weeks from the time of your order. All jerseys are shipped directly from our suppliers to your door in Israel. You\'ll receive tracking information once your order ships.',
      he: 'המשלוח בדרך כלל לוקח 2-4 שבועות מרגע ביצוע ההזמנה. כל החולצות נשלחות ישירות מהספקים שלנו לדלת שלך בישראל. תקבל מידע מעקב ברגע שההזמנה שלך תישלח.',
    },
  },
  {
    id: 'shipping-cost',
    category: 'shipping',
    question: {
      en: 'How much does shipping cost? Is there free shipping?',
      he: 'כמה עולה המשלוח? האם יש משלוח חינם?',
    },
    answer: {
      en: 'Shipping costs ₪15 for 1–2 jerseys. Order 3 or more jerseys in one order and shipping is completely FREE. This is a great way to save if you\'re ordering for multiple people or want to stock up.',
      he: 'המשלוח עולה ₪15 עבור 1-2 חולצות. הזמן 3 חולצות או יותר בהזמנה אחת והמשלוח יהיה חינם לחלוטין. זו דרך מצוינת לחסוך אם אתה מזמין עבור מספר אנשים או רוצה להצטייד.',
    },
  },
  {
    id: 'do-you-ship-israel',
    category: 'shipping',
    question: {
      en: 'Do you ship to Israel? What cities?',
      he: 'האם אתם שולחים לישראל? לאילו ערים?',
    },
    answer: {
      en: 'Yes! We ship to all cities and towns across Israel — Tel Aviv, Jerusalem, Haifa, Beer Sheva, Rishon LeZion, Petah Tikva, Ashdod, Netanya, and everywhere else. If you have an Israeli address, we ship to you.',
      he: 'כן! אנחנו שולחים לכל הערים והעיירות ברחבי ישראל — תל אביב, ירושלים, חיפה, באר שבע, ראשון לציון, פתח תקווה, אשדוד, נתניה, וכל מקום אחר. אם יש לך כתובת ישראלית, אנחנו שולחים אליך.',
    },
  },

  // ── Payment ─────────────────────────────────────────────────────────────
  {
    id: 'payment-methods',
    category: 'payment',
    question: {
      en: 'What payment methods do you accept?',
      he: 'אילו אמצעי תשלום אתם מקבלים?',
    },
    answer: {
      en: 'We accept PayPal (including credit cards through PayPal) and BIT — Israel\'s popular instant payment app. PayPal is great for international cards or if you want buyer protection. BIT is the easiest option for Israeli bank accounts.',
      he: 'אנחנו מקבלים PayPal (כולל כרטיסי אשראי דרך PayPal) ו-BIT — אפליקציית התשלום המיידי הפופולרית של ישראל. PayPal מצוין לכרטיסים בינלאומיים או אם אתה רוצה הגנת קונה. BIT הוא האפשרות הקלה ביותר לחשבונות בנק ישראליים.',
    },
  },
  {
    id: 'bit-payment',
    category: 'payment',
    question: {
      en: 'How does BIT payment work?',
      he: 'איך עובד תשלום ב-BIT?',
    },
    answer: {
      en: 'After placing your order, you\'ll see a QR code and our phone number. Send the payment via your BIT app to our number, then enter your name and phone number to confirm. Our team manually verifies each BIT payment and confirms your order within a few hours.',
      he: 'לאחר ביצוע ההזמנה, תראה קוד QR ומספר הטלפון שלנו. שלח את התשלום דרך אפליקציית BIT שלך למספר שלנו, ולאחר מכן הכנס את שמך ומספר הטלפון לאישור. הצוות שלנו מאמת ידנית כל תשלום BIT ומאשר את ההזמנה שלך תוך מספר שעות.',
    },
  },

  // ── Product ─────────────────────────────────────────────────────────────
  {
    id: 'jersey-quality',
    category: 'product',
    question: {
      en: 'What is the quality of the jerseys?',
      he: 'מה איכות החולצות?',
    },
    answer: {
      en: 'Our jerseys are premium fan-version replicas with high-quality polyester material, accurate team badges, and vivid color printing. They look and feel exactly like what you\'d buy from a club store. We also offer "Player Version" upgrades for even higher quality stitching and material.',
      he: 'החולצות שלנו הן רפליקות פרמיום בגרסת אוהד עם חומר פוליאסטר איכותי, סמלי קבוצה מדויקים, והדפסת צבע עזה. הן נראות ומרגישות בדיוק כמו מה שהיית קונה מחנות מועדון. אנחנו גם מציעים שדרוגי "גרסת שחקן" לתפירה וחומר באיכות גבוהה אף יותר.',
    },
  },
  {
    id: 'retro-jerseys',
    category: 'product',
    question: {
      en: 'What are Retro Classic jerseys?',
      he: 'מה הן חולצות רטרו קלאסיק?',
    },
    answer: {
      en: 'Retro Classic jerseys are reproductions of iconic football kits from the past — legendary designs from the 1990s and 2000s that every true fan remembers. Think Barcelona\'s 1999 treble kit, Brazil\'s 1970 World Cup jersey, or Arsenal\'s iconic Bergkamp-era shirt.',
      he: 'חולצות רטרו קלאסיק הן שחזורים של ערכות כדורגל אייקוניות מהעבר — עיצובים אגדיים מהשנות ה-90 וה-2000 שכל אוהד אמיתי זוכר. חשוב על ערכת החמישייה של ברצלונה ב-1999, חולצת מונדיאל 1970 של ברזיל, או החולצה האייקונית של ארסנל מעידן ברגקמפ.',
    },
  },
  {
    id: 'mystery-box',
    category: 'product',
    question: {
      en: 'What is a Mystery Box?',
      he: 'מה זה קופסת מסתורין (Mystery Box)?',
    },
    answer: {
      en: 'A Mystery Box is a surprise jersey chosen for you from a specific category. You choose the type (Retro, 25/26 Season, World Cup, Mixed, or Special Edition) and receive a random jersey from that collection. Great value — often the best deal on the site. Mystery Boxes start from ₪100.',
      he: 'קופסת מסתורין היא חולצת הפתעה שנבחרה עבורך מקטגוריה מסוימת. אתה בוחר את הסוג (רטרו, עונה 25/26, מונדיאל, מעורב, או מהדורה מיוחדת) ומקבל חולצה אקראית מאותה קולקציה. ערך מצוין — לרוב העסקה הטובה ביותר באתר. קופסאות מסתורין מתחילות מ-₪100.',
    },
  },

  // ── Returns ─────────────────────────────────────────────────────────────
  {
    id: 'return-policy',
    category: 'returns',
    question: {
      en: 'What is your replacement policy?',
      he: 'מה מדיניות ההחלפה שלכם?',
    },
    answer: {
      en: 'We do not offer general returns. However, if your item arrives damaged, defective, or incorrect, we will send you a free replacement immediately — no questions asked. Simply send us a photo on WhatsApp with your order number.',
      he: 'אנחנו לא מציעים החזרות כלליות. אם הפריט הגיע פגום, לקוי, או שגוי — נשלח לך החלפה חינמית מיידית, ללא שאלות. פשוט שלח לנו תמונה ב-WhatsApp עם מספר ההזמנה שלך.',
    },
  },
  {
    id: 'damaged-jersey',
    category: 'returns',
    question: {
      en: 'What if my jersey arrives damaged?',
      he: 'מה אם החולצה שלי מגיעה פגומה?',
    },
    answer: {
      en: 'If your jersey arrives damaged, defective, or incorrect, we will send you a free replacement immediately. Just send us a photo on WhatsApp and we\'ll sort it out quickly. This is our quality guarantee — zero risk for you.',
      he: 'אם החולצה שלך מגיעה פגומה, פגומה, או שגויה, נשלח לך החלפה חינמית מיידית. פשוט שלח לנו תמונה ב-WhatsApp ונטפל בזה במהירות. זוהי ערובת האיכות שלנו — אפס סיכון עבורך.',
    },
  },

  // ── Additional trust / common questions ─────────────────────────────────
  {
    id: 'how-to-contact',
    category: 'trust',
    question: {
      en: 'How can I contact FootJersey?',
      he: 'איך אפשר ליצור קשר עם FootJersey?',
    },
    answer: {
      en: 'The fastest way to reach us is via WhatsApp at +972-58-414-0508. You can also message us on Instagram (@foot_jersey4). We respond in Hebrew and English, usually within 1–2 hours during the day.',
      he: 'הדרך המהירה ביותר לפנות אלינו היא דרך WhatsApp בטלפון 058-414-0508. ניתן גם לשלוח לנו הודעה באינסטגרם (@foot_jersey4). אנחנו מגיבים בעברית ובאנגלית, בדרך כלל תוך 1-2 שעות במהלך היום.',
    },
  },
  {
    id: 'world-cup-2026',
    category: 'product',
    question: {
      en: 'Do you have World Cup 2026 jerseys?',
      he: 'האם יש לכם חולצות מונדיאל 2026?',
    },
    answer: {
      en: 'Yes! We carry a dedicated World Cup 2026 collection with jerseys for all major national teams — Brazil, Argentina, France, Germany, Spain, England, Morocco, Portugal, and more. World Cup jerseys are priced at ₪100 each.',
      he: 'כן! יש לנו קולקציה ייעודית למונדיאל 2026 עם חולצות לכל הנבחרות הלאומיות העיקריות — ברזיל, ארגנטינה, צרפת, גרמניה, ספרד, אנגליה, מרוקו, פורטוגל ועוד. חולצות מונדיאל עולות ₪100 כל אחת.',
    },
  },
  {
    id: 'kids-jerseys',
    category: 'product',
    question: {
      en: 'Do you have jerseys for children?',
      he: 'האם יש לכם חולצות לילדים?',
    },
    answer: {
      en: 'Yes! We carry a full kids collection with jerseys for ages 4–14 in sizes 16 through 28. Kids jerseys are available in all major leagues and cost ₪100 each. Perfect gift for young football fans.',
      he: 'כן! יש לנו קולקציה מלאה לילדים עם חולצות לגילאים 4-14 במידות 16 עד 28. חולצות ילדים זמינות בכל הליגות הגדולות ועולות ₪100 כל אחת. מתנה מושלמת לאוהדי כדורגל צעירים.',
    },
  },

  // ── More ordering / product questions ───────────────────────────────────
  {
    id: 'jersey-price',
    category: 'ordering',
    question: {
      en: 'How much do jerseys cost at FootJersey?',
      he: 'כמה עולות חולצות ב-FootJersey?',
    },
    answer: {
      en: 'Most jerseys are priced at ₪100–₪125. Standard jerseys start at ₪100. Customization options (name/number, patch, player version) are available for +₪10 each. Mystery Boxes start from ₪100. Free shipping when you order 3 or more jerseys.',
      he: 'רוב החולצות מתומחרות ב-₪100–₪125. חולצות סטנדרטיות מתחילות מ-₪100. אפשרויות התאמה אישית (שם/מספר, טלאי, גרסת שחקן) זמינות ב-+₪10 כל אחת. קופסאות מסתורין מתחילות מ-₪100. משלוח חינם בהזמנה של 3 חולצות ומעלה.',
    },
  },
  {
    id: 'israeli-league',
    category: 'product',
    question: {
      en: 'Do you carry Israeli Premier League jerseys?',
      he: 'האם יש לכם חולצות ליגת העל הישראלית?',
    },
    answer: {
      en: 'Yes! We carry jerseys from Israeli Premier League clubs including Maccabi Tel Aviv, Hapoel Tel Aviv, Maccabi Haifa, Beitar Jerusalem, and more. Israeli league jerseys are very popular and are available in the "Israeli League" category on our site.',
      he: 'כן! יש לנו חולצות ממועדוני ליגת העל הישראלית כולל מכבי תל אביב, הפועל תל אביב, מכבי חיפה, בית"ר ירושלים ועוד. חולצות ליגת העל ישראלית פופולריות מאוד וזמינות בקטגוריה "ליגת העל" באתר שלנו.',
    },
  },
  {
    id: 'track-order',
    category: 'shipping',
    question: {
      en: 'Can I track my order?',
      he: 'האם אפשר לעקוב אחרי ההזמנה שלי?',
    },
    answer: {
      en: 'Yes. Once your jersey ships, you\'ll receive a tracking number via email. You can use it to follow your package on the carrier\'s website. If you don\'t receive tracking information within 5 business days of ordering, message us on WhatsApp at +972-58-414-0508.',
      he: 'כן. ברגע שהחולצה שלך נשלחת, תקבל מספר מעקב באימייל. תוכל להשתמש בו כדי לעקוב אחרי החבילה שלך באתר חברת השילוח. אם לא קיבלת מידע מעקב תוך 5 ימי עסקים מההזמנה, שלח לנו הודעה ב-WhatsApp: 058-414-0508.',
    },
  },
  {
    id: 'cancel-order',
    category: 'ordering',
    question: {
      en: 'Can I cancel or change my order?',
      he: 'האם אפשר לבטל או לשנות את ההזמנה שלי?',
    },
    answer: {
      en: 'You can cancel or modify your order within 24 hours of placing it. Contact us immediately via WhatsApp at +972-58-414-0508 with your order reference number. After 24 hours, the order may have already been processed for shipping and cannot be changed.',
      he: 'ניתן לבטל או לשנות את ההזמנה תוך 24 שעות מביצועה. צור איתנו קשר מיידית ב-WhatsApp: 058-414-0508 עם מספר ההזמנה שלך. לאחר 24 שעות, ייתכן שההזמנה כבר עובדה למשלוח ולא ניתן לשנותה.',
    },
  },
  {
    id: 'best-jersey-store-israel',
    category: 'trust',
    question: {
      en: 'Where can I buy football jerseys in Israel?',
      he: 'איפה אפשר לקנות חולצות כדורגל בישראל?',
    },
    answer: {
      en: 'FootJersey (shopfootjersey.com) is Israel\'s dedicated online football jersey store. We ship to all cities across Israel with 2–4 week delivery. You\'ll find jerseys from all major leagues — Premier League, La Liga, Serie A, Bundesliga, Israeli Premier League, World Cup 2026, Retro Classics, and more. PayPal and BIT accepted.',
      he: 'FootJersey (shopfootjersey.com) היא חנות חולצות הכדורגל הייעודית של ישראל. אנחנו שולחים לכל הערים ברחבי ישראל עם משלוח של 2-4 שבועות. תמצא חולצות מכל הליגות הגדולות — פרמייר ליג, לה ליגה, סרייה A, בונדסליגה, ליגת העל הישראלית, מונדיאל 2026, רטרו קלאסיק ועוד. מקבלים PayPal ו-BIT.',
    },
  },
  {
    id: 'stussy-jerseys',
    category: 'product',
    question: {
      en: 'What are Stussy football jerseys?',
      he: 'מה הן חולצות כדורגל Stussy?',
    },
    answer: {
      en: 'Our Stussy collection features football jerseys with the iconic Stussy streetwear aesthetic — bold graphics, unique colourways, and a fashion-forward take on the classic football kit. These limited-edition pieces combine football culture with streetwear style and are a favourite among collectors and fashion-conscious fans.',
      he: 'הקולקציה שלנו של Stussy כוללת חולצות כדורגל עם האסתטיקה האייקונית של הסטריטוור של Stussy — גרפיקות נועזות, צבעים ייחודיים, ופרשנות מתקדמת לחולצת הכדורגל הקלאסית. פריטים מוגבלים אלה משלבים תרבות כדורגל עם סגנון רחוב ומועדפים על ידי אספנים ואוהדים מודעים לאופנה.',
    },
  },
  {
    id: 'group-order',
    category: 'ordering',
    question: {
      en: 'Can I place a bulk or group order?',
      he: 'האם אפשר לבצע הזמנה קבוצתית?',
    },
    answer: {
      en: 'Absolutely! Many of our customers order for their entire team, family, or friend group. Order 3 or more jerseys and shipping is free. For large group orders (10+ jerseys), message us on WhatsApp at +972-58-414-0508 and we\'ll make sure everything goes smoothly.',
      he: 'בהחלט! רבים מהלקוחות שלנו מזמינים עבור הקבוצה כולה, המשפחה, או חברים. הזמן 3 חולצות או יותר והמשלוח חינם. להזמנות קבוצתיות גדולות (10+ חולצות), שלח לנו הודעה ב-WhatsApp: 058-414-0508 ונוודא שהכל מסתדר בצורה חלקה.',
    },
  },
  {
    id: 'drip-jerseys',
    category: 'product',
    question: {
      en: 'What is the Drip collection?',
      he: 'מה זו קולקציית ה-Drip?',
    },
    answer: {
      en: 'The Drip collection features the boldest, most stylish jerseys — limited-run editions, mashups, fashion-forward designs, and rare finds that go beyond the standard replica kit. If you want to stand out from the crowd and express your individual style through football fashion, the Drip collection is for you.',
      he: 'קולקציית הDrip מציגה את החולצות הנועזות והאופנתיות ביותר — מהדורות מוגבלות, מיקסים, עיצובים מתקדמים ומציאות נדירות שחורגות מחולצת הרפליקה הסטנדרטית. אם אתה רוצה לבלוט ולהביע את הסגנון האישי שלך דרך אופנת כדורגל, קולקציית ה-Drip היא בשבילך.',
    },
  },
];

/**
 * Returns FAQ items for a given locale in a schema-ready format.
 */
export function getFaqsForSchema(locale: 'en' | 'he' = 'en') {
  return FAQS.map((faq) => ({
    question: faq.question[locale],
    answer: faq.answer[locale],
  }));
}

/**
 * Returns only the first N FAQs (for homepage preview).
 */
export function getHomepageFaqs(locale: 'en' | 'he' = 'en', count = 5) {
  const priority = ['is-footjersey-legit', 'shipping-time', 'payment-methods', 'jersey-quality', 'return-policy'];
  const ordered = [
    ...priority.map((id) => FAQS.find((f) => f.id === id)!).filter(Boolean),
    ...FAQS.filter((f) => !priority.includes(f.id)),
  ];
  return ordered.slice(0, count).map((faq) => ({
    id: faq.id,
    question: faq.question[locale],
    answer: faq.answer[locale],
  }));
}
