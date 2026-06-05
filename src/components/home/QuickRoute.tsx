'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { Reveal } from '@/components/ui/reveal';

// One-tap routing for cold visitors who all land on the homepage. Search is
// first (the no-button way to find a specific club), then four collection
// tiles. Tiles link into the existing discover/category pages.
const TILES = [
  { emoji: '✨', en: 'Special Edition', he: 'מהדורה מיוחדת', subEn: 'Limited & unique',  subHe: 'מוגבל וייחודי', href: 'discover?collections=special',   tone: 'gold' },
  { emoji: '🏆', en: 'World Cup 2026',  he: 'מונדיאל 2026',  subEn: 'National teams',    subHe: 'נבחרות',        href: 'discover?collections=world-cup', tone: 'plain' },
  { emoji: '🕰️', en: 'Retro',           he: 'רטרו',          subEn: 'Golden-era kits',   subHe: 'חולצות מהזהב',   href: 'discover?collections=retro',     tone: 'plain' },
  { emoji: '🎁', en: 'Mystery Box',     he: 'קופסת הפתעה',   subEn: 'Surprise jersey',   subHe: 'חולצת הפתעה',    href: 'mystery-box',                    tone: 'flare' },
] as const;

function toneStyle(tone: string): React.CSSProperties {
  if (tone === 'gold') return { background: 'linear-gradient(150deg, rgba(200,162,75,0.16), rgba(200,162,75,0.03))', borderColor: 'rgba(200,162,75,0.3)' };
  if (tone === 'flare') return { background: 'linear-gradient(150deg, rgba(255,77,46,0.16), rgba(255,77,46,0.03))', borderColor: 'rgba(255,77,46,0.3)' };
  return { background: 'linear-gradient(150deg, #1a1a1e, #101013)', borderColor: 'var(--border)' };
}

export function QuickRoute() {
  const { locale, isRtl } = useLocale();
  const router = useRouter();
  const isHe = locale === 'he';
  const [query, setQuery] = useState('');

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/${locale}/discover?q=${encodeURIComponent(q)}` : `/${locale}/discover`);
  };

  return (
    <section
      className="px-4 md:px-6 py-10 md:py-12"
      style={{ background: 'linear-gradient(180deg, rgba(200,162,75,0.05), transparent)', borderBottom: '1px solid var(--border)' }}
      aria-label={isHe ? 'מה אתה מחפש' : 'What are you looking for'}
    >
      <div className="max-w-[760px] mx-auto">
        <Reveal>
          <h2
            className={`font-playfair font-bold text-white mb-5 ${isHe ? 'text-right' : ''}`}
            style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', letterSpacing: '-0.02em' }}
          >
            {isHe ? 'מה אתה מחפש?' : 'What are you looking for?'}
          </h2>
        </Reveal>

        {/* Search first */}
        <Reveal>
          <form onSubmit={submitSearch} className="mb-5">
            <div
              className="flex items-center gap-3 rounded-2xl px-4 md:px-5 py-3.5"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
            >
              <Search className="w-5 h-5 shrink-0" style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isHe ? 'חפש את הקבוצה שלך…' : 'Search your team…'}
                className="flex-1 bg-transparent text-white text-sm md:text-base outline-none placeholder:text-[var(--muted)]"
                style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                aria-label={isHe ? 'חיפוש' : 'Search'}
              />
              <button
                type="submit"
                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(200,162,75,0.14)', color: 'var(--gold)', border: '1px solid rgba(200,162,75,0.3)' }}
              >
                {isHe ? 'חפש' : 'Go'}
              </button>
            </div>
          </form>
        </Reveal>

        {/* Collection tiles */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {TILES.map((tile, i) => (
            <Reveal key={tile.href} className="h-full" delay={i * 80}>
              <Link
                href={`/${locale}/${tile.href}`}
                className={`block rounded-2xl p-4 md:p-5 h-full transition-all duration-200 active:scale-[0.98] hover:brightness-110 ${isHe ? 'text-right' : ''}`}
                style={{ border: '1px solid', ...toneStyle(tile.tone) }}
              >
                <span className="block text-2xl md:text-3xl mb-2.5">{tile.emoji}</span>
                <span className="block font-bold text-white text-sm md:text-base">{isHe ? tile.he : tile.en}</span>
                <span className="block text-[11px] md:text-xs mt-1" style={{ color: 'var(--muted)' }}>{isHe ? tile.subHe : tile.subEn}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
