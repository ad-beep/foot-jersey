'use client';

import { useLocale } from '@/hooks/useLocale';
import { Reveal } from '@/components/ui/reveal';
import { RefreshCw, Truck, MessageCircle, Shield } from 'lucide-react';

const GUARANTEES = [
  {
    icon: RefreshCw,
    en: { title: 'Free Replacement',     desc: 'Damaged item? We replace it. Free, no questions asked.' },
    he: { title: 'החלפה חינם',           desc: 'קיבלת מוצר פגום? נחליף. חינם, ללא שאלות.' },
  },
  {
    icon: Truck,
    en: { title: 'Free Shipping on 3+',  desc: 'Order 3 or more jerseys and shipping is on us.' },
    he: { title: 'משלוח חינם מ-3 חולצות', desc: 'הזמן 3 חולצות או יותר והמשלוח עלינו.' },
  },
  {
    icon: MessageCircle,
    en: { title: 'WhatsApp Support',     desc: 'Real humans reply in Hebrew & English within 2 hours.' },
    he: { title: 'תמיכה ב-WhatsApp',    desc: 'אנשים אמיתיים עונים בעברית ואנגלית תוך שעתיים.' },
  },
  {
    icon: Shield,
    en: { title: 'Secure Payment',       desc: 'PayPal and BIT — Israel\'s most trusted payment methods.' },
    he: { title: 'תשלום מאובטח',         desc: 'PayPal ו-BIT — אמצעי התשלום המהימנים ביותר בישראל.' },
  },
];

// ── Founder section (user will fill in real details) ─────────────────────────
// Replace the placeholder text with real founder info when available
const FOUNDER = {
  en: {
    name: 'The FootJersey Team',
    title: 'Israel · Est. 2023',
    letter: `We started FootJersey for one simple reason: as football fans in Israel, we couldn't find a reliable, affordable place to get premium jerseys. Every store was either too expensive, too slow, or sold low-quality fakes.

We wanted something different — a store built by fans, for fans. Every jersey we carry is one we'd wear ourselves. Every policy we have is the one we'd want as customers.

That's why we offer 30-day returns, free replacement for damaged goods, and real WhatsApp support — because we know what it feels like to spend your money and get disappointed.

Thank you for trusting us.`,
    signature: 'The FootJersey Team',
  },
  he: {
    name: 'צוות FootJersey',
    title: 'ישראל · מאז 2023',
    letter: `הקמנו את FootJersey מסיבה אחת פשוטה: כאוהדי כדורגל בישראל, לא מצאנו מקום אמין וסביר לקנות חולצות פרמיום. כל חנות הייתה יקרה מדי, איטית מדי, או מכרה זיופים באיכות נמוכה.

רצינו משהו אחר — חנות שנבנתה על ידי אוהדים, עבור אוהדים. כל חולצה שאנחנו מוכרים היא כזו שהיינו לובשים בעצמנו. כל מדיניות שיש לנו היא זו שהיינו רוצים כלקוחות.

לכן אנחנו מציעים החזרה של 30 יום, החלפה חינמית עבור מוצרים פגומים, ותמיכה אמיתית ב-WhatsApp — כי אנחנו יודעים איך זה מרגיש להוציא כסף ולהתאכזב.

תודה שאתם סומכים עלינו.`,
    signature: 'צוות FootJersey',
  },
};

export function FounderMoment() {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const content = isHe ? FOUNDER.he : FOUNDER.en;

  return (
    <section
      id="about-us"
      className="py-16 md:py-24 chalk-band"
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">

        {/* Section label */}
        <Reveal>
          <p
            className={`section-kicker mb-10 ${isHe ? 'text-right' : ''}`}
            style={{ color: '#6B6B6F' }}
          >
            {isHe ? 'הסיפור שלנו' : 'Why FootJersey'}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left: Founder letter */}
          <Reveal>
            <div className={isHe ? 'text-right' : ''}>
              <h2
                className="font-playfair font-bold mb-8"
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                  color: '#111',
                }}
              >
                {isHe ? 'למה FootJersey?' : 'Built by fans,\nfor fans.'}
              </h2>

              <div className={`space-y-4 text-sm leading-relaxed mb-8 ${isHe ? 'text-right' : ''}`} style={{ color: '#444' }}>
                {content.letter.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Signature */}
              <div
                className={`pt-6 border-t ${isHe ? 'text-right' : ''}`}
                style={{ borderColor: '#e0ddd6' }}
              >
                <p
                  className="font-playfair italic text-2xl"
                  style={{ color: '#111' }}
                >
                  {content.signature}
                </p>
                <p className="font-mono text-xs mt-1" style={{ color: '#888' }}>
                  {content.title}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Right: Guarantees grid */}
          <div>
            {/* Stats row */}
            <Reveal delay={100}>
              <div className={`grid grid-cols-3 gap-4 mb-8 ${isHe ? 'text-right' : ''}`}>
                {[
                  { num: '120+', en: 'Orders delivered', he: 'הזמנות שנשלחו' },
                  { num: '4.8★', en: 'Avg. rating',     he: 'דירוג ממוצע' },
                  { num: '17',   en: 'Collections',     he: 'קולקציות' },
                ].map((stat) => (
                  <div key={stat.num} className="text-center">
                    <div
                      className="font-playfair font-bold text-3xl mb-1"
                      style={{ color: '#111', letterSpacing: '-0.02em' }}
                    >
                      {stat.num}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#888' }}>
                      {isHe ? stat.he : stat.en}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Guarantee cards */}
            <div className="grid grid-cols-2 gap-3">
              {GUARANTEES.map((g, i) => {
                const Icon = g.icon;
                const c = isHe ? g.he : g.en;
                return (
                  <Reveal key={g.en.title} delay={150 + i * 60}>
                    <div
                      className={`p-4 rounded-xl flex flex-col gap-3 ${isHe ? 'items-end text-right' : ''}`}
                      style={{ backgroundColor: '#fff', border: '1px solid #e8e4d9', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: 'var(--pitch)' }} />
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#111' }}>{c.title}</p>
                        <p className="text-xs mt-1" style={{ color: '#666' }}>{c.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
