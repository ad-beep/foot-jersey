'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Heart, ShoppingCart, ChevronDown, SearchX } from 'lucide-react';
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
import { Reveal } from '@/components/ui/reveal';
import { ProductGallery } from '@/components/product/ProductGallery';
import { SizeSelector } from '@/components/product/SizeSelector';
import { CustomizationOptions } from '@/components/product/CustomizationOptions';
import { Recommendations } from '@/components/product/Recommendations';
import { ProductSkeleton } from '@/components/product/ProductSkeleton';
import { getJerseyName, calculateCustomizationPrice } from '@/lib/utils';
import { CURRENCY, CATEGORIES, SPECIAL_SECTIONS, SHIPPING_POLICY } from '@/lib/constants';
import type { Jersey, Size, CartCustomization, JerseyType } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const BADGE_TYPES = new Set<JerseyType>(['retro', 'special', 'kids', 'drip']);

const TYPE_LABELS: Record<JerseyType, { en: string; he: string }> = {
  regular: { en: 'Regular', he: 'רגיל' },
  retro:   { en: 'Retro',   he: 'רטרו' },
  kids:    { en: 'Kids',    he: 'ילדים' },
  special: { en: 'Special', he: 'מיוחד' },
  coat:    { en: 'Coat',    he: 'מעיל' },
  drip:    { en: 'Drip',    he: 'דריפ' },
  scarf:   { en: 'Scarf',   he: 'צעיף' },
};

const LEAGUE_NAMES: Record<string, { en: string; he: string }> = {
  england:        { en: 'Premier League', he: 'פרמייר ליג' },
  spain:          { en: 'LaLiga',         he: 'לה ליגה' },
  italy:          { en: 'Serie A',        he: 'סרייה A' },
  germany:        { en: 'Bundesliga',     he: 'בונדסליגה' },
  france:         { en: 'Ligue 1',        he: 'ליג 1' },
  rest_of_world:  { en: 'Rest of World',  he: 'שאר העולם' },
  national_teams: { en: 'International',  he: 'נבחרות' },
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
        className="w-full flex items-center justify-between py-4 text-sm font-medium text-white transition-colors hover:text-[var(--accent)]"
      >
        {title}
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : undefined,
          }}
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
            <div className="pb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
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
}

export function ProductPageClient({ productId }: ProductPageClientProps) {
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
  const [allJerseys, setAllJerseys] = useState<Jersey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [customization, setCustomization] = useState<CartCustomization>(DEFAULT_CUSTOMIZATION);
  const [shakeSize, setShakeSize] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((json) => setAllJerseys(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const jersey = useMemo(() => allJerseys.find((j) => j.id === productId) ?? null, [allJerseys, productId]);

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
      setTimeout(() => setShakeSize(false), 500);
      toast({ title: isHe ? 'בחר מידה' : 'Please select a size', variant: 'error' });
      return;
    }
    addItem(jersey, selectedSize, customization);
    recordCartAdd(jersey.id);
    recordInteraction(jersey.id, 'cart');
    const displayName = getJerseyName(jersey, locale);
    toast({ title: isHe ? 'נוסף לסל!' : 'Added to cart!', description: displayName, variant: 'success' });
  }, [jersey, selectedSize, customization, addItem, recordCartAdd, recordInteraction, toast, isHe, locale]);

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite(productId);
    recordInteraction(productId, 'like');
    setHeartPulse(true);
    setTimeout(() => setHeartPulse(false), 300);
    const wasFav = useFavoritesStore.getState().isFavorite(productId);
    toast({
      title: wasFav
        ? (isHe ? 'נוסף למועדפים' : 'Added to favorites')
        : (isHe ? 'הוסר מהמועדפים' : 'Removed from favorites'),
      variant: 'info',
    });
  }, [productId, toggleFavorite, recordInteraction, toast, isHe]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return <ProductSkeleton />;

  // ── Not found ────────────────────────────────────────────────────────────
  if (!jersey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <SearchX className="w-16 h-16" style={{ color: 'var(--text-muted)' }} />
        <p className="text-xl font-semibold text-white">
          {isHe ? 'החולצה לא נמצאה' : 'Jersey not found'}
        </p>
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-12">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        <div className="lg:flex lg:gap-10">
          {/* ── LEFT: Image gallery ─────────────────────────────────── */}
          <Reveal className="lg:w-[55%] shrink-0 mb-8 lg:mb-0">
            <ProductGallery images={images} alt={displayName} />
          </Reveal>

          {/* ── RIGHT: Product info ─────────────────────────────────── */}
          <Reveal delay={100} className="flex-1">
            {/* Title + Like */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight" style={{ letterSpacing: '-0.02em' }}>
                {displayName}
              </h1>
              <button
                onClick={handleToggleFavorite}
                className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  color: hydrated && isFav ? '#FF4D6D' : 'var(--text-muted)',
                  transform: heartPulse ? 'scale(1.15)' : undefined,
                }}
                aria-label={isHe ? 'מועדפים' : 'Toggle favorite'}
              >
                <Heart className="w-5 h-5" fill={hydrated && isFav ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>
            </div>

            {/* League + type */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {leagueName ? (isHe ? leagueName.he : leagueName.en) : jersey.league}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {jersey.season}
              </span>
              {showBadge && (
                <Badge variant="accent" className="text-[10px] px-2 py-0.5">
                  {isHe ? typeLabel.he : typeLabel.en}
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="mb-6">
              <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                {CURRENCY}{totalPrice}
              </p>
              {extras > 0 && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {CURRENCY}{jersey.price} + {CURRENCY}{extras} {isHe ? 'התאמה' : 'customization'}
                </p>
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
                  className="mt-3 p-3 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(0,195,216,0.08)', color: 'var(--accent)' }}
                >
                  ⚠️ {SIZE_GUIDE.playerVersionNote[isHe ? 'he' : 'en']}
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
