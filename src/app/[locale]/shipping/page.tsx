import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'משלוח ומדיניות — FootJersey' : 'Shipping & Delivery — FootJersey',
    description: isHe
      ? 'מידע על משלוח FootJersey לכל ישראל. זמני אספקה, עלויות, מדיניות החזרות.'
      : 'FootJersey shipping info for all of Israel. Delivery times, costs, and return policy.',
  };
}

export default function ShippingPage({ params }: { params: { locale: string } }) {
  const isHe = params.locale === 'he';

  const sections = [
    {
      title: isHe ? '🚚 זמני משלוח' : '🚚 Delivery Times',
      items: isHe ? [
        'זמן אספקה רגיל: 2–4 שבועות מרגע ביצוע ההזמנה',
        'כל החולצות נשלחות ישירות מהספקים לדלת שלך',
        'תקבל מידע על מעקב אחרי שהזמנה תישלח',
        'זמני משלוח עשויים להשתנות בעונות שיא',
      ] : [
        'Standard delivery: 2–4 weeks from order date',
        'All jerseys shipped directly from suppliers to your door',
        'Tracking information provided once order ships',
        'Delivery times may vary during peak seasons',
      ],
    },
    {
      title: isHe ? '💰 עלויות משלוח' : '💰 Shipping Costs',
      items: isHe ? [
        'משלוח סטנדרטי: ₪15 לכל ישראל',
        'משלוח חינם: 3 חולצות ויותר בהזמנה אחת',
        'ניתן לשלב חולצות מקטגוריות שונות לקבלת משלוח חינם',
      ] : [
        'Standard shipping: ₪15 for all of Israel',
        'Free shipping: 3 or more jerseys in a single order',
        'Mix categories and types — free shipping still applies',
      ],
    },
    {
      title: isHe ? '📍 לאן אנחנו שולחים' : '📍 Where We Ship',
      items: isHe ? [
        'כל ישראל — תל אביב, ירושלים, חיפה, באר שבע, ראשון לציון, נתניה, אשדוד, פתח תקווה, ועוד',
        'כפרים, מושבים, קיבוצים — אנחנו מגיעים לכולם',
        'לכתובת פרטית בלבד (לא לתיבת דואר)',
      ] : [
        'All of Israel — Tel Aviv, Jerusalem, Haifa, Beer Sheva, Rishon LeZion, Netanya, Ashdod, Petah Tikva, and more',
        'Villages, moshavim, kibbutzim — we deliver everywhere',
        'To residential address only (not P.O. box)',
      ],
    },
    {
      title: isHe ? '↩️ מדיניות החזרות' : '↩️ Returns Policy',
      items: isHe ? [
        'ניתן להחזיר תוך 30 יום מיום קבלת ההזמנה',
        'פנה אלינו ב-WhatsApp כדי לתאם החזרה',
        'מוצרים פגומים או שגויים — מוחלפים בחינם, ללא שאלות',
        'חולצות שהותאמו אישית (שם/מספר) — לא ניתן להחזיר',
      ] : [
        'Returns accepted within 30 days of delivery',
        'Contact us on WhatsApp to arrange a return',
        'Damaged or incorrect items replaced for free, no questions asked',
        'Customized jerseys (name/number) cannot be returned',
      ],
    },
    {
      title: isHe ? '❓ שאלות נפוצות על משלוח' : '❓ Shipping FAQ',
      items: isHe ? [
        'ש: האם ניתן לקבל משלוח מהיר יותר? — לא, זמן האספקה הרגיל הוא 2-4 שבועות.',
        'ש: מה קורה אם ההזמנה לא הגיעה? — צור קשר ב-WhatsApp ונטפל בזה מיד.',
        'ש: האם ניתן לשנות את כתובת המשלוח לאחר ביצוע ההזמנה? — ניתן לבקש זאת תוך 24 שעות.',
      ] : [
        'Q: Can I get faster shipping? — No, standard delivery is 2-4 weeks.',
        'Q: What if my order never arrived? — Contact us on WhatsApp and we\'ll resolve it immediately.',
        'Q: Can I change my shipping address after ordering? — Yes, within 24 hours of the order.',
      ],
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>
      <div className="py-20 md:py-24" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className={`max-w-[700px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
          <p className="section-kicker mb-4">{isHe ? 'מידע משלוח' : 'Shipping Info'}</p>
          <h1
            className="font-playfair font-bold text-white mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            {isHe ? 'משלוח ואספקה' : 'Shipping & Delivery'}
          </h1>
          <p className="text-base" style={{ color: 'var(--muted)' }}>
            {isHe
              ? 'כל מה שצריך לדעת על משלוח FootJersey לכל ישראל.'
              : 'Everything you need to know about FootJersey delivery across Israel.'}
          </p>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto px-4 md:px-6 py-12 space-y-10">
        {sections.map((section, i) => (
          <div key={i} className={isHe ? 'text-right' : ''}>
            <h2 className="font-semibold text-white text-lg mb-4">{section.title}</h2>
            <ul className={`space-y-2 ${isHe ? 'pr-4' : 'pl-4'}`}>
              {section.items.map((item, j) => (
                <li key={j} className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
