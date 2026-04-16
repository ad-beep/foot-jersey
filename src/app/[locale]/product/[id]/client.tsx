'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, ChevronDown, SearchX, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '@/hooks/useLocale';
import { useHydration } from '@/hooks/useHydration';
import { useCartStore } from '@/stores/cart-store';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { useToast } from '@/components/ui/toast';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AGGREGATE_RATING } from '@/data/reviews';
import { Reveal } from '@/components/ui/reveal';
import { ProductGallery } from '@/components/product/ProductGallery';
import { SizeSelector } from '@/components/product/SizeSelector';
import { CustomizationOptions } from '@/components/product/CustomizationOptions';
import { Recommendations } from '@/components/product/Recommendations';
import { getJerseyName, calculateCustomizationPrice } from '@/lib/utils';
import { CURRENCY, CATEGORIES, SPECIAL_SECTIONS, SHIPPING_POLICY } from '@/lib/constants';
import type { Jersey, Size, CartCustomization, JerseyType } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const BADGE_TYPES = new Set<JerseyType>(['retro', 'special', 'kids', 'drip', 'world_cup', 'other_products']);

const TYPE_LABELS: Record<JerseyType, { en: string; he: string }> = {
  regular:        { en: 'Regular',   he: 'רגיל' },
  retro:          { en: 'Retro',     he: 'רטרו' },
  kids:           { en: 'Kids',      he: 'ילדים' },
  special:        { en: 'Special',   he: 'מיוחד' },
  drip:           { en: 'Drip',      he: 'דריפ' },
  world_cup:      { en: 'World Cup', he: 'מונדיאל' },
  other_products: { en: 'Other',     he: 'אחר' },
  stussy:         { en: 'Stussy',    he: 'סטוסי' },
};

const LEAGUE_NAMES: Record<string, { en: string; he: string }> = {
  england:        { en: 'Premier League', he: 'פרמייר ליג' },
  spain:          { en: 'LaLiga',         he: 'לה ליגה' },
  italy:          { en: 'Serie A',        he: 'סרייה A' },
  germany:        { en: 'Bundesliga',     he: 'בונדסליגה' },
  france:         { en: 'Ligue 1',        he: 'ליג 1' },
  rest_of_world:  { en: 'Rest of World',  he: 'שאר העולם' },
  national_teams: { en: 'International',  he: 'נבחרות' },
  israeli_league: { en: 'Israeli League', he: 'ליגת העל' },
};

const DEFAULT_CUSTOMIZATION: CartCustomization = {
  customName: '',
  customNumber: '',
  hasPatch: false,
  patchText: '',
  hasPants: false,
  isPlayerVersion: false,
};

const SIZE_GUIDE = {
  headers: {
    en: ['Size', 'Height (cm)', 'Weight (kg)', 'Chest (cm)'],
    he: ['מידה', 'גובה (ס"מ)', 'משקל (ק"ג)', 'חזה (ס"מ)'],
  },
  rows: [
    { size: 'S',   height: '165–170', weight: '55–65',  chest: '88–94' },
    { size: 'M',   height: '170–175', weight: '65–75',  chest: '94–100' },
    { size: 'L',   height: '175–180', weight: '75–85',  chest: '100–106' },
    { size: 'XL',  height: '180–186', weight: '85–95',  chest: '106–112' },
    { size: 'XXL', height: '186–192', weight: '95–105', chest: '112–120' },
  ],
  playerVersionNote: {
    en: 'We suggest taking a size up for Player Version jerseys.',
    he: 'אנו ממליצים לקחת מידה אחת למעלה עבור חולצות גרסת שחקן.',
  },
};

// ─── Accordion ───────────────────────────────────────────────────────────────

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 text-sm font-medium text-white transition-colors"
        style={{ color: open ? 'var(--gold)' : 'rgba(255,255,255,0.85)' }}
      >
        {title}
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200 shrink-0"
          style={{
            color: open ? 'var(--gold)' : 'var(--muted)',
            transform: open ? 'rotate(180deg)' : undefined,
          }}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ProductPageClientProps {
  productId: string;
  initialJersey: Jersey;
  initialJerseys: Jersey[];
}

export function ProductPageClient({ productId, initialJersey, initialJerseys }: ProductPageClientProps) {
  const { locale, isRtl } = useLocale();
  const hydrated = useHydration();
  const addItem = useCartStore((s) => s.addItem);
  const isFav = useFavoritesStore((s) => s.isFavorite(productId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const recordView = useAnalyticsStore((s) => s.recordView);
  const recordCartAdd = useAnalyticsStore((s) => s.recordCartAdd);
  const recordInteraction = useAnalyticsStore((s) => s.recordInteraction);
  const { toast } = useToast();

  const isHe = locale === 'he';

  // ── State ────────────────────────────────────────────────────────────────
  const [allJerseys] = useState<Jersey[]>(initialJerseys);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [customization, setCustomization] = useState<CartCustomization>(DEFAULT_CUSTOMIZATION);
  const [shakeSize, setShakeSize] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);
  const [nameNumberOpen, setNameNumberOpen] = useState(false);
  const [patchOpen, setPatchOpen] = useState(false);
  const [patchError, setPatchError] = useState(false);
  const [nameNumberError, setNameNumberError] = useState(false);

  // Timeout refs to prevent memory leaks on unmount
  const shakeSizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameNumberErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const patchErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shakeSizeTimeoutRef.current) clearTimeout(shakeSizeTimeoutRef.current);
      if (heartPulseTimeoutRef.current) clearTimeout(heartPulseTimeoutRef.current);
      if (nameNumberErrorTimeoutRef.current) clearTimeout(nameNumberErrorTimeoutRef.current);
      if (patchErrorTimeoutRef.current) clearTimeout(patchErrorTimeoutRef.current);
    };
  }, []);

  const jersey = useMemo(() => allJerseys.find((j) => j.id === productId) ?? initialJersey, [allJerseys, productId, initialJersey]);

  // ── Analytics: track view on mount ──────────────────────────────────────
  useEffect(() => {
    if (jersey) {
      recordView(jersey.id, 0);
      recordInteraction(jersey.id, 'view');
    }
  }, [jersey?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Price calculation ────────────────────────────────────────────────────
  const extras = useMemo(() => {
    if (!jersey) return 0;
    return calculateCustomizationPrice({
      hasNameNumber: !!(customization.customName || customization.customNumber),
      hasPatch: customization.hasPatch,
      hasPants: customization.hasPants,
      isPlayerVersion: customization.isPlayerVersion,
    });
  }, [customization, jersey]);

  const totalPrice = jersey ? jersey.price + extras : 0;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(() => {
    if (!jersey) return;
    if (!selectedSize) {
      setShakeSize(true);
      if (shakeSizeTimeoutRef.current) clearTimeout(shakeSizeTimeoutRef.current);
      shakeSizeTimeoutRef.current = setTimeout(() => setShakeSize(false), 500);
      toast({ title: isHe ? 'בחר מידה' : 'Please select a size', variant: 'error' });
      return;
    }
    if (nameNumberOpen && !customization.customName.trim() && !customization.customNumber.trim()) {
      setNameNumberError(true);
      if (nameNumberErrorTimeoutRef.current) clearTimeout(nameNumberErrorTimeoutRef.current);
      nameNumberErrorTimeoutRef.current = setTimeout(() => setNameNumberError(false), 800);
      toast({
        title: isHe ? 'אנא הזן שם או מספר' : 'Please enter a name or number',
        variant: 'error',
      });
      return;
    }
    if (customization.hasPatch && !customization.patchText.trim()) {
      setPatchError(true);
      if (patchErrorTimeoutRef.current) clearTimeout(patchErrorTimeoutRef.current);
      patchErrorTimeoutRef.current = setTimeout(() => setPatchError(false), 800);
      toast({
        title: isHe ? "אנא הזן טקסט לפאצ'" : 'Please enter patch text',
        variant: 'error',
      });
      return;
    }
    addItem(jersey, selectedSize, customization);
    recordCartAdd(jersey.id);
    recordInteraction(jersey.id, 'cart');
    const displayName = getJerseyName(jersey, locale);
    toast({ title: isHe ? 'נוסף לסל!' : 'Added to cart!', description: displayName, variant: 'success' });
  }, [jersey, selectedSize, customization, nameNumberOpen, addItem, recordCartAdd, recordInteraction, toast, isHe, locale]);

  const handleToggleFavorite = useCallback(() => {
    // Read state BEFORE toggling so we know which direction we're going
    const wasAlreadyFav = useFavoritesStore.getState().isFavorite(productId);
    toggleFavorite(productId);
    recordInteraction(productId, 'like');
    setHeartPulse(true);
    if (heartPulseTimeoutRef.current) clearTimeout(heartPulseTimeoutRef.current);
    heartPulseTimeoutRef.current = setTimeout(() => setHeartPulse(false), 300);
    toast({
      title: wasAlreadyFav
        ? (isHe ? 'הוסר מהמועדפים' : 'Removed from favorites')
        : (isHe ? 'נוסף למועדפים' : 'Added to favorites'),
      variant: 'info',
    });
  }, [productId, toggleFavorite, recordInteraction, toast, isHe]);

  // ── Not found ────────────────────────────────────────────────────────────
  if (!jersey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4" style={{ backgroundColor: 'var(--ink)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}>
          <SearchX className="w-7 h-7" style={{ color: 'var(--muted)' }} />
        </div>
        <p className="font-playfair font-bold text-xl text-white text-center">
          {isHe ? 'החולצה לא נמצאה' : 'Jersey not found'}
        </p>
        <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
          {isHe ? 'ייתכן שהמוצר הוסר או שהקישור שגוי' : 'The product may have been removed or the link is incorrect'}
        </p>
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-white"
          style={{ color: 'var(--gold)' }}
        >
          <ArrowLeft className="w-4 h-4" style={{ transform: isHe ? 'scaleX(-1)' : undefined }} />
          {isHe ? 'חזרה לדף הבית' : 'Back to Home'}
        </Link>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const displayName = getJerseyName(jersey, locale);
  const typeLabel = TYPE_LABELS[jersey.type];
  const leagueName = LEAGUE_NAMES[jersey.league];
  const showBadge = BADGE_TYPES.has(jersey.type);
  const images = [jersey.imageUrl, ...jersey.additionalImages].filter(Boolean);
  const shippingPolicy = SHIPPING_POLICY.policy[isHe ? 'he' : 'en'];

  // Breadcrumbs
  const leagueSlug = jersey.league;
  const breadcrumbs = [
    { label: isHe ? 'בית' : 'Home', href: `/${locale}` },
    { label: leagueName ? (isHe ? leagueName.he : leagueName.en) : jersey.league, href: `/${locale}/category/${leagueSlug}` },
    { label: displayName },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-12">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        <div className="lg:flex lg:gap-12">
          {/* ── LEFT: Image gallery ─────────────────────────────────── */}
          <Reveal className="lg:w-[52%] shrink-0 mb-8 lg:mb-0">
            <ProductGallery images={images} alt={displayName} />
          </Reveal>

          {/* ── RIGHT: Product info ─────────────────────────────────── */}
          <Reveal delay={100} className="flex-1 lg:pt-2">

            {/* League kicker */}
            <div className={`flex items-center gap-2 mb-3 ${isHe ? 'flex-row-reverse' : ''}`}>
              <div className="w-4 h-px" style={{ backgroundColor: 'var(--gold)' }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[0.25em]"
                style={{ color: 'var(--gold)' }}
              >
                {leagueName ? (isHe ? leagueName.he : leagueName.en) : jersey.league}
              </span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--border)' }}>·</span>
              <span
                className="font-mono text-[10px] uppercase tracking-[0.2em]"
                style={{ color: 'var(--muted)' }}
              >
                {jersey.season}
              </span>
              {showBadge && (
                <Badge variant="accent" className="text-[10px] px-2 py-0.5">
                  {isHe ? typeLabel.he : typeLabel.en}
                </Badge>
              )}
            </div>

            {/* Star rating */}
            <div
              className={`flex items-center gap-2 mb-3 ${isHe ? 'flex-row-reverse' : ''}`}
              aria-label={isHe
                ? `דירוג ${AGGREGATE_RATING.ratingValue} מתוך 5 (${AGGREGATE_RATING.reviewCount} ביקורות)`
                : `Rated ${AGGREGATE_RATING.ratingValue} out of 5 (${AGGREGATE_RATING.reviewCount} reviews)`}
            >
              <div className="flex items-center gap-0.5" aria-hidden="true">
                {[1,2,3,4,5].map((i) => (
                  <span key={i} className="text-xs" style={{ color: i <= Math.round(AGGREGATE_RATING.ratingValue) ? '#FFBE32' : 'rgba(255,190,50,0.35)' }}>★</span>
                ))}
              </div>
              <span className="font-mono text-xs font-bold" style={{ color: 'rgba(255,255,255,0.85)' }} aria-hidden="true">{AGGREGATE_RATING.ratingValue}</span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }} aria-hidden="true">
                {isHe ? `(${AGGREGATE_RATING.reviewCount} ביקורות)` : `(${AGGREGATE_RATING.reviewCount} reviews)`}
              </span>
            </div>

            {/* Title + Like */}
            <div className={`flex items-start justify-between gap-3 mb-5 ${isHe ? 'flex-row-reverse' : ''}`}>
              <h1
                className="font-playfair font-bold text-white leading-none"
                style={{ fontSize: 'clamp(1.7rem, 3.5vw, 2.6rem)', letterSpacing: '-0.03em', lineHeight: 1.0 }}
              >
                {displayName}
              </h1>
              <button
                onClick={handleToggleFavorite}
                className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  backgroundColor: hydrated && isFav ? 'rgba(255,77,109,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${hydrated && isFav ? 'rgba(255,77,109,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: hydrated && isFav ? '#FF4D6D' : 'var(--muted)',
                  transform: heartPulse ? 'scale(1.15)' : undefined,
                }}
                aria-label={
                  hydrated && isFav
                    ? (isHe ? 'הסר מהמועדפים' : 'Remove from favorites')
                    : (isHe ? 'הוסף למועדפים' : 'Add to favorites')
                }
              >
                <Heart className="w-5 h-5" fill={hydrated && isFav ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>
            </div>

            {/* Price */}
            <div className={`flex items-baseline gap-3 mb-7 pb-6 ${isHe ? 'flex-row-reverse' : ''}`} style={{ borderBottom: '1px solid var(--border)' }}>
              <span
                className="font-playfair font-bold"
                style={{ fontSize: '2.4rem', color: 'var(--gold)', letterSpacing: '-0.03em', lineHeight: 1 }}
              >
                {CURRENCY}{totalPrice}
              </span>
              {extras > 0 && (
                <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                  {CURRENCY}{jersey.price} + {CURRENCY}{extras} {isHe ? 'התאמה' : 'custom'}
                </span>
              )}
            </div>

            {/* Size selector */}
            <div className="mb-6">
              <SizeSelector
                availableSizes={jersey.availableSizes}
                selectedSize={selectedSize}
                onSelect={setSelectedSize}
                jerseyType={jersey.type}
                shake={shakeSize}
              />
            </div>

            {/* Customization */}
            <div className="mb-6">
              <CustomizationOptions
                customization={customization}
                onChange={setCustomization}
                jerseyType={jersey.type}
                nameNumberOpen={nameNumberOpen}
                setNameNumberOpen={setNameNumberOpen}
                patchOpen={patchOpen}
                setPatchOpen={setPatchOpen}
                patchError={patchError}
                nameNumberError={nameNumberError}
              />
            </div>

            {/* Add to Cart CTA */}
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              className="w-full h-14 text-base font-bold gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {isHe ? 'הוסף לסל' : 'Add to Cart'}
              <span className="mx-1">·</span>
              {CURRENCY}{totalPrice}
            </Button>

            {/* Trust row */}
            <div
              className={`flex flex-wrap items-center gap-4 mt-4 mb-1 pt-4 ${isHe ? 'flex-row-reverse' : ''}`}
              style={{ borderTop: '1px solid var(--border)' }}
            >
              {[
                {
                  icon: (
                    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 shrink-0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="7" width="10" height="8" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                    </svg>
                  ),
                  en: 'Secure Payment', he: 'תשלום מאובטח',
                },
                {
                  icon: (
                    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 shrink-0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3a6 6 0 1 1 0 8" /><path d="M3 7H1" />
                    </svg>
                  ),
                  en: 'Free Replacement on Damage', he: 'החלפה חינם על פגם',
                },
                {
                  icon: (
                    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 shrink-0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 3h9v8H1z" /><path d="M10 6h2.5L14 8.5V11h-4V6z" /><circle cx="4" cy="12.5" r="1.2" /><circle cx="12" cy="12.5" r="1.2" />
                    </svg>
                  ),
                  en: 'Ships Israel', he: 'משלוח לכל ישראל',
                },
              ].map((item) => (
                <div key={item.en} className="flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                  {item.icon}
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em]">
                    {isHe ? item.he : item.en}
                  </span>
                </div>
              ))}
            </div>

            {/* Accordions */}
            <div className="mt-8" style={{ borderTop: '1px solid var(--border)' }}>
              <Accordion title={isHe ? 'משלוח' : 'Shipping'}>
                <ul className="space-y-2 list-disc ps-5">
                  <li>{shippingPolicy.delivery}</li>
                  <li>{shippingPolicy.freeShipping}</li>
                  <li>{shippingPolicy.damaged}</li>
                  <li>{shippingPolicy.secure}</li>
                </ul>
              </Accordion>

              <Accordion title={isHe ? 'מדריך מידות' : 'Size Guide'}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {SIZE_GUIDE.headers[isHe ? 'he' : 'en'].map((h) => (
                          <th key={h} className="text-start py-2 pe-4 font-medium text-white">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_GUIDE.rows.map((row) => (
                        <tr key={row.size} style={{ borderTop: '1px solid var(--border)' }}>
                          <td className="py-2 pe-4 font-medium text-white">{row.size}</td>
                          <td className="py-2 pe-4">{row.height}</td>
                          <td className="py-2 pe-4">{row.weight}</td>
                          <td className="py-2">{row.chest}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p
                  className="mt-3 p-3 rounded-lg text-xs font-mono uppercase tracking-wide"
                  style={{ backgroundColor: 'rgba(200,162,75,0.08)', color: 'rgba(200,162,75,0.8)', border: '1px solid rgba(200,162,75,0.15)' }}
                >
                  {SIZE_GUIDE.playerVersionNote[isHe ? 'he' : 'en']}
                </p>
              </Accordion>
            </div>
          </Reveal>
        </div>

        {/* ── Recommendations ───────────────────────────────────────── */}
        <Recommendations currentJersey={jersey} allJerseys={allJerseys} />
      </div>
    </div>
  );
}
