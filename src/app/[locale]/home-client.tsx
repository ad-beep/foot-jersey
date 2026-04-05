'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Jersey, Locale } from '@/types';

// Hero loads eagerly for fast LCP — it's the first visible content
const LandingHero  = dynamic(() => import('@/components/home/LandingHero'), { ssr: false });
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
  useEffect(() => {
    if (window.location.hash === '#collections-section') {
      // Small delay to allow dynamic components to mount before scrolling
      const timer = setTimeout(() => {
        const el = document.getElementById('collections-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

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
