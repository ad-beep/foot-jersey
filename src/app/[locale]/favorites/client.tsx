'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useHydration } from '@/hooks/useHydration';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useAuthStore } from '@/stores/auth-store';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import type { Jersey, JerseyType } from '@/types';

// ─── Group definitions ───────────────────────────────────────────
interface GroupDef {
  key: string;
  label: { en: string; he: string };
  test: (j: Jersey) => boolean;
}

const GROUPS: GroupDef[] = [
  { key: 'retro',   label: { en: 'Retro',           he: 'רטרו' },           test: (j) => j.type === 'retro' },
  { key: 'special', label: { en: 'Special Edition',  he: 'מהדורה מיוחדת' },  test: (j) => j.type === 'special' },
  { key: 'worldcup',label: { en: 'World Cup',        he: 'מונדיאל' },        test: (j) => j.isWorldCup },
  { key: 'kids',    label: { en: 'Kids',             he: 'ילדים' },          test: (j) => j.type === 'kids' },
  { key: 'drip',    label: { en: 'Drip',             he: 'דריפ' },           test: (j) => j.type === 'drip' },
  { key: 'regular', label: { en: 'Regular',          he: 'רגיל' },           test: (j) => j.type === 'regular' && !j.isWorldCup },
];

// ─── Labels ──────────────────────────────────────────────────────
const L = {
  title:        { en: 'Liked Jerseys',   he: 'חולצות שאהבתי' },
  empty:        { en: 'No liked jerseys yet', he: 'אין חולצות שאהבת עדיין' },
  emptySub:     { en: 'Explore our collection and like the jerseys you love', he: 'גלה את הקולקציה שלנו ותסמן חולצות שאהבת' },
  explore:      { en: 'Explore Jerseys', he: 'גלה חולצות' },
  home:         { en: 'Home',            he: 'בית' },
  signInPrompt: { en: 'Sign in to see your liked jerseys', he: 'התחבר כדי לראות את החולצות שאהבת' },
  signInSub:    { en: 'Your favorites are saved per account and synced across all your devices', he: 'המועדפים שלך נשמרים לחשבון ומסונכרנים בכל המכשירים' },
  signIn:       { en: 'Sign In',         he: 'התחבר' },
} as const;

// ─── Props ───────────────────────────────────────────────────────
interface FavoritesClientProps {
  allJerseys: Jersey[];
}

// ─── Component ───────────────────────────────────────────────────
export default function FavoritesClient({ allJerseys }: FavoritesClientProps) {
  const { locale } = useLocale();
  const hydrated = useHydration();
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const user = useAuthStore((s) => s.user);
  const isHe = locale === 'he';

  const likedJerseys = useMemo(
    () => allJerseys.filter((j) => favoriteIds.includes(j.id)),
    [allJerseys, favoriteIds],
  );

  const groups = useMemo(() => {
    return GROUPS
      .map((g) => ({ ...g, jerseys: likedJerseys.filter(g.test) }))
      .filter((g) => g.jerseys.length > 0);
  }, [likedJerseys]);

  const breadcrumbs = [
    { label: isHe ? L.home.he : L.home.en, href: `/${locale}` },
    { label: isHe ? L.title.he : L.title.en },
  ];

  // Auth guard — show sign-in prompt for unauthenticated users
  if (hydrated && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--ink)' }}>
        <div className="text-center max-w-sm">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <Heart className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            {isHe ? L.signInPrompt.he : L.signInPrompt.en}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {isHe ? L.signInSub.he : L.signInSub.en}
          </p>
          <Link href={`/${locale}/auth`}>
            <Button variant="primary" size="lg">
              {isHe ? L.signIn.he : L.signIn.en}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-12" style={{ backgroundColor: 'var(--ink)' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-white">
            {isHe ? L.title.he : L.title.en}
          </h1>
          {hydrated && likedJerseys.length > 0 && (
            <span className="text-lg font-bold" style={{ color: 'var(--text-muted)' }}>
              ({likedJerseys.length})
            </span>
          )}
          <Heart className="w-6 h-6" style={{ color: '#FF4D6D' }} fill="#FF4D6D" />
        </div>

        {/* Loading skeleton */}
        {!hydrated && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {hydrated && likedJerseys.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <Heart className="w-16 h-16" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-semibold text-white">
              {isHe ? L.empty.he : L.empty.en}
            </p>
            <p className="text-sm max-w-md" style={{ color: 'var(--text-muted)' }}>
              {isHe ? L.emptySub.he : L.emptySub.en}
            </p>
            <Link href={`/${locale}/discover`}>
              <Button variant="primary" size="lg">
                {isHe ? L.explore.he : L.explore.en}
              </Button>
            </Link>
          </div>
        )}

        {/* Grouped favorites */}
        {hydrated && groups.map((group) => (
          <section key={group.key} className="mb-10">
            <Reveal>
              <div className="mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-playfair text-lg font-semibold pb-3" style={{ color: 'var(--text-secondary)' }}>
                  {isHe ? group.label.he : group.label.en} ({group.jerseys.length})
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {group.jerseys.map((jersey, i) => (
                <Reveal key={jersey.id} delay={Math.min(i * 50, 300)}>
                  <ProductCard jersey={jersey} />
                </Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
