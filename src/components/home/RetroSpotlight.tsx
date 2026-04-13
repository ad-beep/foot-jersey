'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { Reveal } from '@/components/ui/reveal';
import { ChevronRight } from 'lucide-react';

const RETRO_COPY = {
  en: {
    kicker: 'Retro Classics',
    headline: 'Where legends\nlive forever.',
    body: 'The jerseys that shaped football history. From Brazil\'s golden yellow to Ajax\'s iconic red and white — wear the kits that defined an era.',
    cta: 'Browse Retro Collection',
    caption: 'Vintage designs from the 90s & 2000s',
  },
  he: {
    kicker: 'רטרו קלאסיק',
    headline: 'שם האגדות\nחיות לנצח.',
    body: 'החולצות שעיצבו את היסטוריית הכדורגל. מהצהוב הזהוב של ברזיל ועד האדום והלבן האייקוני של אייקס — לבש את הערכות שהגדירו עידן.',
    cta: 'עיין בקולקציית הרטרו',
    caption: 'עיצובים וינטג\u2019 מהשנות ה-90 וה-2000',
  },
};

// Retro badge facts
const FACTS = [
  { en: '1990–2010', he: '1990–2010', label: { en: 'Era covered', he: 'תקופה' } },
  { en: '50+', he: '50+', label: { en: 'Classic kits', he: 'ערכות קלאסיות' } },
  { en: '₪110', he: '₪110', label: { en: 'From', he: 'מתחיל מ' } },
];

export function RetroSpotlight() {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const copy = isHe ? RETRO_COPY.he : RETRO_COPY.en;

  return (
    <section
      className="chalk-band py-16 md:py-24"
      style={{ borderTop: '1px solid #e0ddd6', borderBottom: '1px solid #e0ddd6' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${isHe ? 'direction-rtl' : ''}`}>

          {/* Left: Content */}
          <Reveal>
            <div className={isHe ? 'text-right' : ''}>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-6 h-px"
                  style={{ backgroundColor: 'var(--gold)' }}
                />
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.25em]"
                  style={{ color: 'var(--gold)' }}
                >
                  {copy.kicker}
                </span>
              </div>

              <h2
                className="font-playfair font-bold mb-6 whitespace-pre-line"
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  letterSpacing: '-0.04em',
                  lineHeight: 0.95,
                  color: '#111',
                }}
              >
                {copy.headline}
              </h2>

              <p className="text-sm leading-relaxed mb-8" style={{ color: '#555', maxWidth: '38ch' }}>
                {copy.body}
              </p>

              {/* Stats */}
              <div className={`flex items-center gap-8 mb-8 ${isHe ? 'flex-row-reverse justify-end' : ''}`}>
                {FACTS.map((fact, i) => (
                  <div key={i} className={`text-center ${isHe ? 'text-right' : ''}`}>
                    <div
                      className="font-playfair font-bold text-2xl"
                      style={{ color: 'var(--gold)', letterSpacing: '-0.02em' }}
                    >
                      {isHe ? fact.he : fact.en}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-wide mt-0.5" style={{ color: '#888' }}>
                      {isHe ? fact.label.he : fact.label.en}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href={`/${locale}/category/retro`}
                className={`group inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-300 ${isHe ? 'flex-row-reverse' : ''}`}
                style={{
                  backgroundColor: '#111',
                  boxShadow: '0 0 24px rgba(200,162,75,0.2)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#000';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(200,162,75,0.35)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#111';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(200,162,75,0.2)';
                }}
              >
                {copy.cta}
                <ChevronRight className={`w-4 h-4 group-hover:translate-x-0.5 transition-transform ${isHe ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </Reveal>

          {/* Right: Visual stamp */}
          <Reveal delay={150}>
            <div
              className="relative rounded-2xl overflow-hidden flex items-center justify-center aspect-square max-w-sm mx-auto lg:mx-0"
              style={{
                backgroundColor: '#111',
                border: '2px solid var(--gold)',
                boxShadow: '0 0 80px rgba(200,162,75,0.12)',
              }}
            >
              {/* Archive texture */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div
                    className="font-playfair font-black italic"
                    style={{
                      fontSize: 'clamp(4rem, 12vw, 8rem)',
                      color: 'rgba(200,162,75,0.15)',
                      lineHeight: 0.8,
                      letterSpacing: '-0.06em',
                    }}
                  >
                    RETRO
                  </div>
                  <div
                    className="font-playfair font-black italic"
                    style={{
                      fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                      color: 'rgba(200,162,75,0.12)',
                      lineHeight: 0.8,
                      letterSpacing: '-0.06em',
                      marginTop: '-0.1em',
                    }}
                  >
                    CLASSICS
                  </div>
                </div>
              </div>

              {/* Archive badge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div
                  className="font-mono text-[9px] uppercase tracking-[0.3em]"
                  style={{ color: 'var(--gold)' }}
                >
                  {isHe ? 'ארכיון' : 'Archive'}
                </div>
                <div
                  className="font-playfair font-bold text-white"
                  style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}
                >
                  {isHe ? 'ערכות שעיצבו היסטוריה' : 'Kits that shaped history'}
                </div>
                <div
                  className="w-8 h-px"
                  style={{ backgroundColor: 'rgba(200,162,75,0.5)' }}
                />
                <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(200,162,75,0.6)' }}>
                  {isHe ? 'FootJersey · 2023' : 'FootJersey · Est. 2023'}
                </div>
              </div>

              {/* Corner accents */}
              {[
                'top-3 left-3',
                'top-3 right-3 rotate-90',
                'bottom-3 left-3 -rotate-90',
                'bottom-3 right-3 rotate-180',
              ].map((cls, i) => (
                <div key={i} className={`absolute ${cls} w-4 h-4`}>
                  <div className="w-4 h-0.5" style={{ backgroundColor: 'var(--gold)', opacity: 0.5 }} />
                  <div className="w-0.5 h-4" style={{ backgroundColor: 'var(--gold)', opacity: 0.5 }} />
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Caption */}
        <Reveal delay={200}>
          <p
            className={`font-mono text-[10px] uppercase tracking-[0.2em] mt-8 ${isHe ? 'text-right' : ''}`}
            style={{ color: '#999' }}
          >
            {copy.caption}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
