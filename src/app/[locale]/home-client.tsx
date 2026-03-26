'use client';

import { lazy, Suspense } from 'react';
import LandingHero from '@/components/home/LandingHero';
import { WhatsHot } from '@/components/home/WhatsHot';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import type { Jersey, Locale } from '@/types';

const AboutUs = lazy(() => import('@/components/home/AboutUs').then(m => ({ default: m.AboutUs })));

interface HomeClientProps {
  locale:     Locale;
  hotJerseys: Jersey[];
}

export default function HomeClient({ locale, hotJerseys }: HomeClientProps) {
  return (
    <div
      className="overflow-y-auto scrollbar-hide"
      style={{
        height: 'calc(100vh - 64px)',
        scrollSnapType: 'y mandatory',
        willChange: 'scroll-position',
      }}
    >
      <LandingHero jerseys={hotJerseys} />
      <WhatsHot locale={locale} hotJerseys={hotJerseys.slice(0, 15)} />
      <div id="collections-section">
        <CategoryGrid />
      </div>
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <AboutUs />
      </Suspense>
    </div>
  );
}
