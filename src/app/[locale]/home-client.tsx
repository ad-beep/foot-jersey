'use client';

import dynamic from 'next/dynamic';
import type { Jersey, Locale } from '@/types';

// Lazy-load heavy components (framer-motion, 3D carousel, marquee animations)
const LandingHero  = dynamic(() => import('@/components/home/LandingHero'), { ssr: false });
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
