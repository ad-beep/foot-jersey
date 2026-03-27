'use client';

import dynamic from 'next/dynamic';
import type { Jersey, Locale } from '@/types';

// Hero loads eagerly for fast LCP — it's the first visible content
const LandingHero  = dynamic(() => import('@/components/home/LandingHero'), {
  ssr: false,
  loading: () => (
    <section
      className="flex flex-col items-center justify-center"
      style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-primary)' }}
    >
      <h1 className="font-bold text-white text-4xl md:text-5xl lg:text-6xl text-center px-6 max-w-3xl">
        Buying a Jersey is an Experience Worth Having
      </h1>
      <p className="text-lg mt-4 max-w-xl mx-auto text-center" style={{ color: 'var(--text-secondary)' }}>
        Premium football jerseys, crafted for true fans
      </p>
    </section>
  ),
});
// Below-fold components — lazy-loaded with no SSR
const WhatsHot     = dynamic(() => import('@/components/home/WhatsHot').then(m => ({ default: m.WhatsHot })), { ssr: false });
const CategoryGrid = dynamic(() => import('@/components/home/CategoryGrid').then(m => ({ default: m.CategoryGrid })), { ssr: false });
const AboutUs      = dynamic(() => import('@/components/home/AboutUs').then(m => ({ default: m.AboutUs })), { ssr: false });

interface HomeClientProps {
  locale:     Locale;
  jerseys:    Jersey[];
  hotJerseys: Jersey[];
}

export default function HomeClient({ locale, jerseys, hotJerseys }: HomeClientProps) {
  return (
    <div
      className="overflow-y-auto scrollbar-hide"
      style={{
        height: 'calc(100vh - 64px)',
        scrollSnapType: 'y proximity',
        willChange: 'scroll-position',
      }}
    >
      <LandingHero jerseys={jerseys} />
      <WhatsHot locale={locale} hotJerseys={hotJerseys} />
      <div id="collections-section">
        <CategoryGrid />
      </div>
      <AboutUs />
    </div>
  );
}
