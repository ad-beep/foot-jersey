'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';

const BOX_TYPES = [
  { label: { en: 'Retro',         he: 'רטרו' },         price: 100, color: 'rgba(200,162,75,1)',  glow: 'rgba(200,162,75,0.4)',  symbol: "'90" },
  { label: { en: '25/26 Season',  he: 'עונת 25/26' },   price: 90,  color: 'rgba(15,200,110,1)', glow: 'rgba(15,200,110,0.3)', symbol: '25' },
  { label: { en: 'World Cup',     he: 'מונדיאל' },       price: 90,  color: 'rgba(100,165,255,1)',glow: 'rgba(100,165,255,0.3)',symbol: 'WC' },
  { label: { en: 'Mixed',         he: 'מיקס' },          price: 100, color: 'rgba(255,77,46,1)',  glow: 'rgba(255,77,46,0.4)',  symbol: '∞' },
  { label: { en: 'Special Ed.',   he: 'מיוחדת' },        price: 90,  color: 'rgba(210,130,255,1)',glow: 'rgba(180,80,255,0.3)', symbol: '★' },
  { label: { en: 'Player Ver.',   he: 'גרסת שחקן' },     price: 100, color: 'rgba(255,205,55,1)', glow: 'rgba(255,200,50,0.35)',symbol: 'PV' },
];

export function MysteryBoxTeaser() {
  const { locale } = useLocale();
  const isHe = locale === 'he';

  return (
    <section
      className="relative overflow-hidden"
      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      aria-label={isHe ? 'קופסת הפתעה' : 'Mystery Box'}
    >
      {/* ── Background ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{ background: 'linear-gradient(160deg, #0d0303 0%, #0A0A0B 45%, #030d06 100%)' }} />

      {/* Central radial glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px]"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(255,77,46,0.1) 0%, transparent 65%)' }} />
      </div>

      {/* Floating "?" marks — edge decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {([
          { top: '8%',  left: '1.5%', size: '6rem',  opacity: 0.05, rotate: '-18deg', color: 'var(--gold)' },
          { top: '55%', left: '0.5%', size: '3.5rem', opacity: 0.07, rotate: '22deg',  color: 'var(--flare)' },
          { top: '80%', left: '3%',   size: '4.5rem', opacity: 0.04, rotate: '-8deg',  color: 'var(--gold)' },
          { top: '10%', right:'1.5%', size: '5rem',   opacity: 0.05, rotate: '14deg',  color: 'var(--gold)' },
          { top: '60%', right:'1%',   size: '4rem',   opacity: 0.06, rotate: '-20deg', color: 'var(--flare)' },
          { top: '85%', right:'3.5%', size: '3rem',   opacity: 0.04, rotate: '6deg',   color: 'var(--gold)' },
          // 3D-perspective cubes / gift marks at edges
          { top: '35%', left: '5%',   size: '2rem',   opacity: 0.09, rotate: '45deg',  color: 'rgba(200,162,75,1)' },
          { top: '45%', right:'5%',   size: '2rem',   opacity: 0.09, rotate: '-45deg', color: 'rgba(200,162,75,1)' },
        ] as Array<{top:string;left?:string;right?:string;size:string;opacity:number;rotate:string;color:string}>).map((q, i) => (
          <span key={i} className="absolute font-playfair font-black select-none" style={{
            top: q.top, left: q.left, right: q.right,
            fontSize: q.size, opacity: q.opacity,
            transform: `rotate(${q.rotate})`,
            color: q.color, lineHeight: 1,
          }}>?</span>
        ))}

        {/* 3D gift box corners — left edge */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:block select-none" style={{ opacity: 0.07 }}>
          <div style={{
            width: '52px', height: '52px',
            border: '1px solid var(--gold)',
            transform: 'rotate(15deg) skewX(-8deg)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: '-6px', right: '-6px',
              height: '1px', background: 'var(--gold)',
            }} />
            <div style={{
              position: 'absolute', left: '50%', top: '-6px', bottom: '-6px',
              width: '1px', background: 'var(--gold)',
            }} />
          </div>
        </div>

        {/* 3D gift box corners — right edge */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block select-none" style={{ opacity: 0.07 }}>
          <div style={{
            width: '52px', height: '52px',
            border: '1px solid var(--gold)',
            transform: 'rotate(-15deg) skewX(8deg)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: '-6px', right: '-6px',
              height: '1px', background: 'var(--gold)',
            }} />
            <div style={{
              position: 'absolute', left: '50%', top: '-6px', bottom: '-6px',
              width: '1px', background: 'var(--gold)',
            }} />
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────── */}
      <div className="relative max-w-[1200px] mx-auto px-4 md:px-8 py-14 md:py-20">

        {/* Top row: label + headline + CTA */}
        <div className={`flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12 ${isHe ? 'md:flex-row-reverse text-right' : ''}`}>
          <div className={isHe ? 'text-right' : ''}>
            <p className="section-kicker mb-3" style={{ color: 'rgba(255,77,46,0.8)' }}>
              {isHe ? '847+ קופסאות נמסרו · תמיד שווה יותר' : '847+ boxes delivered · always worth more'}
            </p>
            <h2
              className="font-playfair font-bold text-white"
              style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', letterSpacing: '-0.04em', lineHeight: 0.92 }}
            >
              {isHe ? (
                <>קופסת<br /><span style={{ color: 'var(--flare)' }}>הפתעה</span></>
              ) : (
                <>Mystery<br /><span style={{ color: 'var(--flare)' }}>Box</span></>
              )}
            </h2>
            <p className="mt-3 text-sm md:text-base max-w-[32ch]" style={{ color: 'var(--muted)' }}>
              {isHe
                ? 'בחר קטגוריה. קבל חולצה. הפתעה מובטחת.'
                : 'Pick a category. Get a jersey. Guaranteed surprise.'}
            </p>
          </div>

          {/* Giant "?" — desktop centrepiece */}
          <div className="hidden md:flex items-center justify-center flex-1" aria-hidden="true">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute inset-[-20px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(255,77,46,0.12) 0%, transparent 70%)' }} />
              <span className="font-playfair font-black select-none" style={{
                fontSize: 'clamp(6rem, 14vw, 10rem)', lineHeight: 0.85,
                color: 'transparent',
                WebkitTextStroke: '2px rgba(255,77,46,0.35)',
                display: 'block',
              }}>?</span>
              <span className="absolute inset-0 font-playfair font-black select-none flex items-center justify-center" style={{
                fontSize: 'clamp(6rem, 14vw, 10rem)', lineHeight: 0.85,
                background: 'linear-gradient(135deg, var(--flare) 0%, var(--gold) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                opacity: 0.85,
              }}>?</span>
            </div>
          </div>

          <div className={`flex flex-col gap-3 ${isHe ? 'items-end' : 'items-start'} md:shrink-0`}>
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              {isHe ? 'החל מ-' : 'From'}{' '}
              <span className="font-bold text-base" style={{ color: 'var(--gold)' }}>₪90</span>
            </p>
            <Link
              href={`/${locale}/mystery-box`}
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300"
              style={{
                backgroundColor: 'var(--flare)',
                color: '#fff',
                boxShadow: '0 0 0 0 rgba(255,77,46,0)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = 'var(--flare-hover)';
                el.style.boxShadow = '0 0 30px rgba(255,77,46,0.4)';
                el.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = 'var(--flare)';
                el.style.boxShadow = '0 0 0 0 rgba(255,77,46,0)';
                el.style.transform = '';
              }}
            >
              {isHe ? 'בחר קופסא' : 'Choose your box'}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
                className={`transition-transform duration-300 ${isHe ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
              {isHe ? '🔥 פופולרי — לרוב אוזל' : '🔥 Popular — often sells out'}
            </p>
          </div>
        </div>

        {/* Mobile "?" */}
        <div className="flex md:hidden items-center justify-center mb-8" aria-hidden="true">
          <div className="relative">
            <span className="font-playfair font-black select-none" style={{
              fontSize: '8rem', lineHeight: 0.85, color: 'transparent',
              WebkitTextStroke: '2px rgba(255,77,46,0.3)', display: 'block',
            }}>?</span>
            <span className="absolute inset-0 font-playfair font-black select-none flex items-center justify-center" style={{
              fontSize: '8rem', lineHeight: 0.85,
              background: 'linear-gradient(135deg, var(--flare) 0%, var(--gold) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              opacity: 0.85,
            }}>?</span>
          </div>
        </div>

        {/* Box type pills — horizontal scroll on mobile */}
        <div className={`flex gap-3 overflow-x-auto pb-1 scrollbar-hide ${isHe ? 'flex-row-reverse' : ''}`}>
          {BOX_TYPES.map((box) => {
            const label = isHe ? box.label.he : box.label.en;
            const faintBg = box.glow.replace(/[\d.]+\)$/, '0.1)');
            const border  = box.glow.replace(/[\d.]+\)$/, '0.28)');

            return (
              <Link
                key={box.symbol}
                href={`/${locale}/mystery-box`}
                className="group shrink-0 relative flex flex-col items-center gap-2 px-5 py-4 rounded-xl transition-all duration-300 overflow-hidden"
                style={{
                  backgroundColor: faintBg,
                  border: `1px solid ${border}`,
                  minWidth: '110px',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = box.glow.replace(/[\d.]+\)$/, '0.6)');
                  el.style.boxShadow = `0 0 24px ${box.glow.replace(/[\d.]+\)$/, '0.25)')}`;
                  el.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = border;
                  el.style.boxShadow = '';
                  el.style.transform = '';
                }}
              >
                {/* Background symbol */}
                <span className="absolute font-playfair font-black select-none pointer-events-none"
                  aria-hidden="true"
                  style={{
                    fontSize: '4.5rem', color: 'transparent',
                    WebkitTextStroke: `1px ${box.color.replace(/[\d.]+\)$/, '0.1)')}`,
                    top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    letterSpacing: '-0.06em', lineHeight: 0.82,
                  }}>
                  {box.symbol}
                </span>

                {/* Question mark */}
                <span className="relative font-playfair font-black text-2xl select-none transition-transform duration-300 group-hover:scale-110"
                  style={{ color: box.color, lineHeight: 1 }}>?</span>

                <span className="relative text-xs font-semibold text-white text-center leading-tight">{label}</span>
                <span className="relative font-mono text-[11px] font-bold" style={{ color: box.color }}>₪{box.price}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom trust strip */}
        <div className={`mt-8 flex flex-wrap items-center gap-4 ${isHe ? 'flex-row-reverse' : ''}`}>
          {[
            { icon: '📦', en: 'New with tags', he: 'חדש עם תגיות' },
            { icon: '✓',  en: 'Always worth more', he: 'תמיד שווה יותר' },
            { icon: '🚚', en: '2–3 weeks delivery', he: 'משלוח 2–3 שבועות' },
          ].map((t) => (
            <span key={t.en} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span>{t.icon}</span>
              {isHe ? t.he : t.en}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
