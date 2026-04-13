import type { Metadata } from 'next';
import Link from 'next/link';
import { localBusinessSchema } from '@/lib/schema';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'אודות FootJersey' : 'About FootJersey',
    description: isHe
      ? 'הסיפור מאחורי FootJersey — חנות חולצות הכדורגל המובילה בישראל. מי אנחנו, מה אנחנו מוכרים, ולמה אנחנו שונים.'
      : "The story behind FootJersey — Israel's leading football jersey store. Who we are, what we sell, and why we're different.",
    alternates: {
      canonical: `https://shopfootjersey.com/${params.locale}/about`,
      languages: {
        en: 'https://shopfootjersey.com/en/about',
        he: 'https://shopfootjersey.com/he/about',
      },
    },
  };
}

export default function AboutPage({ params }: { params: { locale: string } }) {
  const isHe = params.locale === 'he';
  const locale = params.locale;
  const schema = localBusinessSchema();

  const copy = {
    kicker:    isHe ? 'הסיפור שלנו' : 'Our Story',
    headline:  isHe ? 'בנוי על ידי אוהדים,\nעבור אוהדים.' : 'Built by fans,\nfor fans.',
    mission: isHe
      ? 'FootJersey נוסדה ב-2023 מתוך תשוקה אמיתית לכדורגל ותסכול מהאפשרויות הקיימות בישראל. רצינו ליצור מקום אחד שבו כל אוהד יכול למצוא את החולצה שהוא מחפש — בין אם מדובר בחולצה חדשה של הקבוצה האהובה עליו, רטרו קלאסי מהשנות ה-90, חולצת מונדיאל 2026, או מהדורה מיוחדת שלא ניתן למצוא בשום מקום אחר.'
      : 'FootJersey was founded in 2023 out of a genuine passion for football and frustration with the existing options in Israel. We wanted to create one place where every fan could find the jersey they\'re looking for — whether it\'s a new kit from their favorite club, a 90s retro classic, a World Cup 2026 jersey, or a special edition you can\'t find anywhere else.',
    values: [
      {
        title: isHe ? 'איכות ראשונה' : 'Quality First',
        desc: isHe
          ? 'כל חולצה שאנחנו מוכרים היא כזו שהיינו לובשים בעצמנו. אנחנו לא מתפשרים על איכות.'
          : 'Every jersey we sell is one we\'d wear ourselves. We don\'t compromise on quality.',
      },
      {
        title: isHe ? 'שירות אמיתי' : 'Real Service',
        desc: isHe
          ? 'אנשים אמיתיים עונים ב-WhatsApp בעברית ואנגלית. לא בוטים, לא תסריטים.'
          : 'Real people reply on WhatsApp in Hebrew & English. No bots, no scripts.',
      },
      {
        title: isHe ? 'מחירים הוגנים' : 'Fair Prices',
        desc: isHe
          ? 'חולצות פרמיום מתחילות מ-₪100. אנחנו מאמינים שאוהדות לא צריכה לעלות הון.'
          : 'Premium jerseys starting from ₪100. We believe fandom shouldn\'t cost a fortune.',
      },
      {
        title: isHe ? 'אמינות' : 'Reliability',
        desc: isHe
          ? '30 יום להחזרה. החלפה חינמית למוצרים פגומים. אנחנו עומדים מאחורי כל הזמנה.'
          : '30-day returns. Free replacement for damaged goods. We stand behind every order.',
      },
    ],
    collectionTitle: isHe ? '17 קולקציות. קבוצה אחת.' : '17 Collections. One Team.',
    collectionDesc: isHe
      ? 'מהפרמיירליג ועד הליגה הישראלית, מהרטרו הקלאסי ועד מונדיאל 2026 — יש לנו הכל.'
      : 'From the Premier League to the Israeli League, from retro classics to World Cup 2026 — we carry it all.',
    ctaShop: isHe ? 'עיין בכל החולצות' : 'Browse All Jerseys',
    ctaContact: isHe ? 'צור קשר' : 'Contact Us',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>

        {/* Hero */}
        <div
          className="py-20 md:py-28"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className={`max-w-[900px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
            <p className="section-kicker mb-4">{copy.kicker}</p>
            <h1
              className="font-playfair font-bold text-white mb-6 whitespace-pre-line"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', letterSpacing: '-0.04em', lineHeight: 0.95 }}
            >
              {copy.headline}
            </h1>
            <p className="text-base md:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--muted)' }}>
              {copy.mission}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--steel)' }}>
          <div className="max-w-[900px] mx-auto px-4 md:px-6 py-10">
            <div className={`grid grid-cols-3 gap-8 ${isHe ? 'text-right' : 'text-center'}`}>
              {[
                { num: '2023',  label: isHe ? 'שנת הייסוד' : 'Founded' },
                { num: '17',    label: isHe ? 'קולקציות' : 'Collections' },
                { num: '120+',  label: isHe ? 'הזמנות שנשלחו' : 'Orders delivered' },
              ].map((stat) => (
                <div key={stat.num} className="text-center">
                  <div
                    className="font-playfair font-bold"
                    style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--gold)', letterSpacing: '-0.03em', lineHeight: 1 }}
                  >
                    {stat.num}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wide mt-1" style={{ color: 'var(--muted)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="max-w-[900px] mx-auto px-4 md:px-6 py-16">
          <h2
            className={`font-playfair font-bold text-white mb-10 ${isHe ? 'text-right' : ''}`}
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.02em' }}
          >
            {isHe ? 'הערכים שלנו' : 'What we stand for'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {copy.values.map((v, i) => (
              <div
                key={i}
                className={`p-6 rounded-xl ${isHe ? 'text-right' : ''}`}
                style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-semibold text-white mb-2">{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Collections section */}
        <div
          className="py-16"
          style={{ backgroundColor: 'var(--steel)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
        >
          <div className={`max-w-[900px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
            <h2
              className="font-playfair font-bold text-white mb-4"
              style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.02em' }}
            >
              {copy.collectionTitle}
            </h2>
            <p className="text-base mb-8" style={{ color: 'var(--muted)' }}>{copy.collectionDesc}</p>
            <div className={`flex flex-wrap gap-3 ${isHe ? 'flex-row-reverse' : ''}`}>
              {[
                { slug: 'england',          label: isHe ? 'פרמיירליג' : 'Premier League' },
                { slug: 'spain',            label: isHe ? 'לה ליגה' : 'La Liga' },
                { slug: 'italy',            label: isHe ? 'סריה א' : 'Serie A' },
                { slug: 'germany',          label: isHe ? 'בונדסליגה' : 'Bundesliga' },
                { slug: 'retro',            label: isHe ? 'רטרו קלאסיק' : 'Retro Classics' },
                { slug: 'world-cup-2026',   label: isHe ? 'מונדיאל 2026' : 'World Cup 2026' },
                { slug: 'drip',             label: 'Drip' },
                { slug: 'stussy-edition',   label: 'Stussy Edition' },
                { slug: 'kids',             label: isHe ? 'ילדים' : 'Kids' },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${locale}/category/${cat.slug}`}
                  className="px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wide transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="max-w-[900px] mx-auto px-4 md:px-6 py-16">
          <div className={`flex flex-col md:flex-row items-center gap-4 ${isHe ? 'flex-row-reverse' : ''}`}>
            <Link
              href={`/${locale}/discover`}
              className="px-7 py-4 rounded-full font-semibold text-sm text-white transition-all duration-200"
              style={{ backgroundColor: 'var(--flare)', boxShadow: '0 0 24px var(--flare-glow)' }}
            >
              {copy.ctaShop}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="px-7 py-4 rounded-full font-semibold text-sm transition-all duration-200"
              style={{ backgroundColor: 'var(--steel)', color: 'rgba(255,255,255,0.8)', border: '1px solid var(--border)' }}
            >
              {copy.ctaContact}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
