'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Jersey, Locale } from '@/types';

// Hero — static import enables SSR → better LCP
import LandingHero from '@/components/home/LandingHero';

// Below-fold sections — lazy-loaded to reduce initial bundle
const QuickRoute       = dynamic(() => import('@/components/home/QuickRoute').then(m => ({ default: m.QuickRoute })));
const TrustBar         = dynamic(() => import('@/components/home/TrustBar').then(m => ({ default: m.TrustBar })));
const WhatsHot         = dynamic(() => import('@/components/home/WhatsHot').then(m => ({ default: m.WhatsHot })));
const MysteryBoxTeaser = dynamic(() => import('@/components/home/MysteryBoxTeaser').then(m => ({ default: m.MysteryBoxTeaser })));
const CategoryGrid     = dynamic(() => import('@/components/home/CategoryGrid').then(m => ({ default: m.CategoryGrid })));
const RetroSpotlight = dynamic(() => import('@/components/home/RetroSpotlight').then(m => ({ default: m.RetroSpotlight })));
const LockerRoom     = dynamic(() => import('@/components/home/LockerRoom').then(m => ({ default: m.LockerRoom })));
const FAQPreview     = dynamic(() => import('@/components/home/FAQPreview').then(m => ({ default: m.FAQPreview })));
const FounderMoment  = dynamic(() => import('@/components/home/FounderMoment').then(m => ({ default: m.FounderMoment })));
const Newsletter     = dynamic(() => import('@/components/home/Newsletter').then(m => ({ default: m.Newsletter })));

interface HomeClientProps {
  locale:     Locale;
  hotJerseys: Jersey[];
}

export default function HomeClient({ locale, hotJerseys }: HomeClientProps) {
  useEffect(() => {
    if (window.location.hash === '#collections-section') {
      const timer = setTimeout(() => {
        const el = document.getElementById('collections-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* 1. Hero — big centred brand moment */}
      <LandingHero />

      {/* 2. Quick-route band — one-tap routing for cold visitors */}
      <QuickRoute />

      {/* 3. Trust bar — quick trust signals */}
      <TrustBar />

      {/* 3. What's Hot — featured products */}
      <WhatsHot locale={locale} hotJerseys={hotJerseys} />

      {/* 4. Mystery Box teaser — full-width, before collections */}
      <MysteryBoxTeaser />

      {/* 5. Collections grid — category bento */}
      <div id="collections-section">
        <CategoryGrid />
      </div>

      {/* 6. Retro Classics spotlight — light editorial band */}
      <RetroSpotlight />

      {/* 7. The Locker Room — reviews wall */}
      <LockerRoom />

      {/* 8. FAQ Preview — trust + AI visibility */}
      <FAQPreview />

      {/* 9. Founder Moment — human story, trust */}
      <FounderMoment />

      {/* 10. Newsletter */}
      <Newsletter />
    </div>
  );
}
