import type { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'משלוח ומדיניות — FootJersey' : 'Shipping & Delivery — FootJersey',
    description: isHe
      ? 'מידע על משלוח FootJersey לכל ישראל. זמני אספקה, עלויות, ערבות על מוצרים פגומים.'
      : 'FootJersey shipping info for all of Israel. Delivery times, costs, and damage replacement policy.',
    alternates: {
      canonical: `https://shopfootjersey.com/${params.locale}/shipping`,
      languages: {
        en: 'https://shopfootjersey.com/en/shipping',
        he: 'https://shopfootjersey.com/he/shipping',
      },
    },
  };
}

export default function ShippingPage({ params }: { params: { locale: string } }) {
  const isHe   = params.locale === 'he';
  const locale = params.locale;

  const steps = [
    {
      num: '01',
      en: { title: 'Add to cart',    desc: 'Browse the store, pick your jersey, select your size and any customisation (name, number, patch), then add it to your cart.' },
      he: { title: 'הוסף לסל',       desc: 'עיין בחנות, בחר את החולצה שלך, בחר מידה וכל התאמה אישית (שם, מספר, תג), ולאחר מכן הוסף לסל.' },
    },
    {
      num: '02',
      en: { title: 'Checkout',       desc: 'Enter your shipping address and pay securely with PayPal or BIT. Your order is confirmed instantly — no WhatsApp needed.' },
      he: { title: 'תשלום',           desc: 'הזן את כתובת המשלוח ושלם בצורה מאובטחת עם PayPal או BIT. ההזמנה מאושרת מיד — ללא צורך ב-WhatsApp.' },
    },
    {
      num: '03',
      en: { title: 'We source it',   desc: 'We hand-pick your jersey from our supplier and quality-check it before it ships. You\'ll get a tracking number once dispatched.' },
      he: { title: 'אנחנו מספקים',   desc: 'אנחנו בוחרים ידנית את החולצה שלך מהספק ובודקים את איכותה לפני המשלוח. תקבל מספר מעקב ברגע שתישלח.' },
    },
    {
      num: '04',
      en: { title: 'Delivered',      desc: 'Arrives at your door within 2–4 weeks. Unbox it, wear it, love it.' },
      he: { title: 'נמסר',           desc: 'מגיע לדלת שלך תוך 2–4 שבועות. פתח, לבש, תהנה.' },
    },
  ];

  const faqItems = [
    {
      en: { q: 'Can I get faster shipping?',                    a: 'No — standard delivery from our international suppliers is 2–4 weeks. This is the nature of sourcing premium jerseys.' },
      he: { q: 'האם ניתן לקבל משלוח מהיר יותר?',               a: 'לא — אספקה סטנדרטית מהספקים הבינלאומיים שלנו היא 2–4 שבועות. זה אופי מכירת חולצות פרמיום.' },
    },
    {
      en: { q: 'What if my order never arrives?',               a: 'Contact us on WhatsApp immediately. We\'ll track it down and either locate the shipment or send a replacement — no questions asked.' },
      he: { q: 'מה קורה אם ההזמנה לא הגיעה?',                  a: 'צור קשר ב-WhatsApp מיד. נאתר אותה ונחזיר את המשלוח או נשלח תחליף — ללא שאלות.' },
    },
    {
      en: { q: 'Can I change my address after ordering?',       a: 'Yes, within 24 hours of placing the order. After that the shipment may already be in transit.' },
      he: { q: 'האם ניתן לשנות כתובת משלוח לאחר ביצוע ההזמנה?', a: 'כן, תוך 24 שעות מביצוע ההזמנה. לאחר מכן המשלוח כבר עשוי להיות בדרכו.' },
    },
    {
      en: { q: 'Do you ship outside Israel?',                   a: 'Currently we ship to Israeli addresses only. Stay tuned — international shipping is on our roadmap.' },
      he: { q: 'האם אתם שולחים מחוץ לישראל?',                   a: 'כרגע אנחנו שולחים לכתובות בישראל בלבד. אנחנו עובדים על משלוח בינלאומי.' },
    },
    {
      en: { q: 'What if the jersey I receive is defective?',    a: 'Contact us with a photo on WhatsApp. We\'ll ship a replacement at no extra cost within days.' },
      he: { q: 'מה קורה אם החולצה שהתקבלה פגומה?',              a: 'צור קשר עם תמונה ב-WhatsApp. נשלח תחליף ללא עלות נוספת תוך ימים ספורים.' },
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="py-16 md:py-24" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className={`max-w-[800px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
          <p className="section-kicker mb-4">{isHe ? 'מידע משלוח' : 'Shipping Info'}</p>
          <h1
            className="font-playfair font-bold text-white mb-4"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            {isHe ? 'משלוח\nואספקה.' : 'Shipping\n& Delivery.'}
          </h1>
          <p className="text-base" style={{ color: 'var(--muted)', maxWidth: '48ch' }}>
            {isHe
              ? 'כל מה שצריך לדעת על איך החולצה שלך מגיעה לדלת שלך.'
              : 'Everything you need to know about how your jersey arrives at your door.'}
          </p>
        </div>
      </div>

      {/* ── Cost matrix ─────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: 'var(--steel)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[800px] mx-auto px-4 md:px-6 py-10">
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isHe ? 'text-right' : ''}`}>
            {[
              { en: 'Delivery time',        he: 'זמן אספקה',       value: isHe ? '2–4 שבועות' : '2–4 Weeks',    accent: 'var(--gold)' },
              { en: 'Shipping cost',        he: 'עלות משלוח',      value: '₪15',                                  accent: 'var(--gold)' },
              { en: 'Free on',              he: 'חינם על',         value: isHe ? '3+ חולצות' : '3+ jerseys',    accent: '#1A5C44' },
              { en: 'Damaged item?',        he: 'מוצר פגום?',      value: isHe ? 'החלפה חינם' : 'Free Replace', accent: '#1A5C44' },
            ].map((item) => (
              <div key={item.en} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--ink)', border: '1px solid var(--border)' }}>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                  {isHe ? item.he : item.en}
                </p>
                <p className="font-mono font-bold text-xl" style={{ color: item.accent }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works: visual timeline ───────────────────────────────── */}
      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-16 md:py-20">
        <div className={`mb-10 ${isHe ? 'text-right' : ''}`}>
          <p className="section-kicker mb-3">{isHe ? 'תהליך המשלוח' : 'Delivery process'}</p>
          <h2
            className="font-playfair font-bold text-white"
            style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.03em' }}
          >
            {isHe ? 'מהזמנה לדלת.' : 'From order to door.'}
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Gold hairline */}
          <div
            className="absolute top-4 bottom-4 pointer-events-none"
            style={{
              left: isHe ? 'auto' : '16px',
              right: isHe ? '16px' : 'auto',
              width: '1px',
              background: 'linear-gradient(to bottom, var(--gold), rgba(200,162,75,0.1))',
            }}
            aria-hidden="true"
          />

          <div className="space-y-0">
            {steps.map((step, i) => {
              const c = isHe ? step.he : step.en;
              return (
                <div
                  key={step.num}
                  className={`flex gap-8 pb-10 ${isHe ? 'flex-row-reverse' : ''} ${i === steps.length - 1 ? '' : ''}`}
                >
                  {/* Node */}
                  <div className="shrink-0 relative z-10">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[10px]"
                      style={{
                        backgroundColor: i === steps.length - 1 ? 'var(--gold)' : 'var(--steel)',
                        border: `1px solid ${i === steps.length - 1 ? 'var(--gold)' : 'rgba(200,162,75,0.4)'}`,
                        color: i === steps.length - 1 ? '#000' : 'var(--gold)',
                      }}
                    >
                      {step.num}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pt-1 ${isHe ? 'text-right' : ''}`}>
                    <h3 className="font-semibold text-white mb-1.5" style={{ fontSize: '0.95rem' }}>
                      {c.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '54ch' }}>
                      {c.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Damage guarantee ────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--steel)' }}>
        <div className="max-w-[800px] mx-auto px-4 md:px-6 py-12">
          <div className={`grid md:grid-cols-2 gap-6 ${isHe ? 'text-right' : ''}`}>
            <div>
              <p className="section-kicker mb-3">{isHe ? 'ערבות איכות' : 'Quality guarantee'}</p>
              <h2
                className="font-playfair font-bold text-white mb-4"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.02em' }}
              >
                {isHe ? 'מוצר פגום? נחליף. חינם.' : 'Damaged item? We replace it. Free.'}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {isHe
                  ? 'אם קיבלת מוצר פגום, שגוי, או שאינו תואם להזמנה — נשלח לך החלפה חינמית מיידית. שלח לנו תמונה ב-WhatsApp ונטפל בזה.'
                  : 'If you receive a damaged, defective, or incorrect item — we send you a free replacement immediately. Just send us a photo on WhatsApp and we\'ll sort it.'}
              </p>
            </div>
            <div className="space-y-3">
              {[
                { en: '✓ Free replacement for damaged goods',    he: '✓ החלפה חינמית לחולצות פגומות' },
                { en: '✓ Wrong item? We sort it immediately',    he: '✓ פריט שגוי? אנחנו מסדרים מיד' },
                { en: '✓ Just send a WhatsApp photo — no forms', he: '✓ רק תמונה ב-WhatsApp — ללא טפסים' },
                { en: '✗ No general returns (damage only)',       he: '✗ אין החזרות כלליות (רק פגמים)' },
              ].map((item) => (
                <p key={item.en} className="text-sm flex items-start gap-2" style={{ color: item.en.startsWith('✗') ? 'var(--muted)' : 'rgba(255,255,255,0.75)' }}>
                  {isHe ? item.he : item.en}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ accordion ───────────────────────────────────────────────── */}
      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className={`mb-8 ${isHe ? 'text-right' : ''}`}>
          <p className="section-kicker mb-2">{isHe ? 'שאלות נפוצות' : 'FAQ'}</p>
          <h2
            className="font-playfair font-bold text-white"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.02em' }}
          >
            {isHe ? 'שאלות על משלוח' : 'Shipping questions'}
          </h2>
        </div>

        <div className="space-y-0" style={{ borderTop: '1px solid var(--border)' }}>
          {faqItems.map((item, i) => {
            const c = isHe ? item.he : item.en;
            return (
              <details
                key={i}
                className="group"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <summary
                  className={`flex items-center justify-between py-5 cursor-pointer list-none ${isHe ? 'flex-row-reverse' : ''}`}
                  style={{ color: 'white' }}
                >
                  <span className="font-medium text-sm pr-4">{c.q}</span>
                  <svg
                    viewBox="0 0 16 16"
                    className="w-4 h-4 shrink-0 transition-transform duration-200 group-open:rotate-45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ color: 'var(--gold)' }}
                  >
                    <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                  </svg>
                </summary>
                <p
                  className={`pb-5 text-sm leading-relaxed ${isHe ? 'text-right' : ''}`}
                  style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '60ch' }}
                >
                  {c.a}
                </p>
              </details>
            );
          })}
        </div>

        {/* Contact nudge */}
        <div
          className={`mt-10 p-5 rounded-xl flex items-center gap-4 ${isHe ? 'flex-row-reverse text-right' : ''}`}
          style={{ backgroundColor: 'rgba(15,61,46,0.2)', border: '1px solid rgba(15,61,46,0.4)' }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#25D366' }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm mb-0.5">
              {isHe ? 'עוד שאלות?' : 'Still have questions?'}
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {isHe
                ? 'שלח לנו הודעה ב-WhatsApp — נחזור תוך שעתיים.'
                : 'Send us a WhatsApp message — we reply within 2 hours.'}
            </p>
          </div>
          <Link
            href="https://wa.me/972584140508"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#25D366', color: '#000' }}
          >
            WhatsApp
          </Link>
        </div>
      </div>

    </div>
  );
}
