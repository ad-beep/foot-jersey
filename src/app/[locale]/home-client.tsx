'use client';

import LandingHero from '@/components/home/LandingHero';
import { WhatsHot } from '@/components/home/WhatsHot';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { AboutUs } from '@/components/home/AboutUs';
import type { Jersey, Locale } from '@/types';

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
      }}
    >
      <LandingHero jerseys={hotJerseys} />
      <WhatsHot locale={locale} hotJerseys={hotJerseys.slice(0, 15)} />
      <CategoryGrid />
      <AboutUs />
    </div>
  );
}
