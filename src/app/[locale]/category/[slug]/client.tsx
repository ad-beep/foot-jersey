'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchX, Package } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useCartStore } from '@/stores/cart-store';
import { useToast } from '@/components/ui/toast';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from '@/components/ui/reveal';
import { CATEGORIES, SPECIAL_SECTIONS, MYSTERY_BOX_OPTIONS, PRICES, CURRENCY } from '@/lib/constants';
import { calculateCustomizationPrice } from '@/lib/utils';
import type { Jersey, JerseyType } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const EXCLUSIVE_TYPES: JerseyType[] = ['kids', 'drip', 'other_products'];

// ─── Bilingual labels ────────────────────────────────────────────────────────

const CATEGORY_NAMES: Record<string, { en: string; he: string }> = {
  // Leagues
  england:        { en: 'Premier League', he: 'פרמייר ליג' },
  spain:          { en: 'LaLiga',         he: 'לה ליגה' },
  italy:          { en: 'Serie A',        he: 'סרייה A' },
  germany:        { en: 'Bundesliga',     he: 'בונדסליגה' },
  france:         { en: 'Ligue 1',        he: 'ליג 1' },
  rest_of_world:  { en: 'Rest of World',  he: 'שאר העולם' },
  national_teams: { en: 'International',  he: 'נבחרות' },
  israeli_league: { en: 'Israeli League', he: 'ליגת העל' },
  // Collections
  'season-2526':    { en: '25/26 Season',    he: 'עונת 25/26' },
  'retro':          { en: 'Retro',           he: 'רטרו' },
  'special':        { en: 'Special Edition', he: 'מהדורה מיוחדת' },
  'world-cup-2026': { en: 'World Cup 2026',  he: 'מונדיאל 2026' },
  'long-sleeve':    { en: 'Long Sleeve',     he: 'שרוול ארוך' },
  'kids':           { en: 'Kids',            he: 'ילדים' },
  'drip':           { en: 'Drip',            he: 'דריפ' },
  'mystery-box':    { en: 'Mystery Box',     he: 'קופסת הפתעה' },
  'other-products': { en: 'Other Products',  he: 'מוצרים נוספים' },
  'stussy-edition': { en: 'Stussy Edition',  he: 'מהדורת סטוסי' },
};

const TYPE_LABELS: Record<string, { en: string; he: string }> = {
  all:     { en: 'All',     he: 'הכל' },
  regular: { en: 'Regular', he: 'רגיל' },
  retro:   { en: 'Retro',   he: 'רטרו' },
  special: { en: 'Special', he: 'מיוחד' },
  kids:    { en: 'Kids',    he: 'ילדים' },
  drip:    { en: 'Drip',    he: 'דריפ' },
  world_cup:       { en: 'World Cup', he: 'מונדיאל' },
  other_products:  { en: 'Other',    he: 'אחר' },
};

const SORT_OPTIONS = [
  { value: 'newest',    en: 'Newest First',        he: 'חדש ביותר' },
  { value: 'price-asc', en: 'Price: Low to High',  he: 'מחיר: מהנמוך לגבוה' },
  { value: 'price-desc',en: 'Price: High to Low',  he: 'מחיר: מהגבוה לנמוך' },
  { value: 'name-az',   en: 'Name A-Z',            he: 'שם א-ת' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isLeagueSlug(slug: string): boolean {
  return CATEGORIES.some((c) => c.slug === slug);
}

function filterByCategory(jerseys: Jersey[], slug: string): Jersey[] {
  // League categories
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (cat) {
    return jerseys.filter((j) => j.league === cat.slug && !EXCLUSIVE_TYPES.includes(j.type));
  }

  // Special sections
  const section = SPECIAL_SECTIONS.find((s) => s.slug === slug);
  if (!section) return [];

  switch (section.filterMode) {
    case 'type':
      if (slug === 'other-products') return jerseys.filter((j) => j.type === 'other_products');
      return jerseys.filter((j) => j.type === section.typeMatch);
    case 'tag':
      // For stussy-edition, also catch jerseys whose type was promoted to 'stussy'
      if (slug === 'stussy-edition') {
        return jerseys.filter(
          (j) => j.type === 'stussy' || j.tags.some((t) => t.toLowerCase().includes('stussy')),
        );
      }
      // For long-sleeve, use the dedicated isLongSleeve field + tag fallback
      if (slug === 'long-sleeve') {
        return jerseys.filter(
          (j) => j.isLongSleeve || j.tags.some((t) => t.includes('ארוך') || t === 'long_sleeve'),
        );
      }
      if (!section.tagMatch) return [];
      return jerseys.filter((j) => j.tags.some((t) => t.includes(section.tagMatch!)));
    case 'season':
      return jerseys.filter((j) => j.type === 'regular' && j.season.includes('25/26'));
    default:
      return [];
  }
}

function sortJerseys(jerseys: Jersey[], sort: string): Jersey[] {
  const sorted = [...jerseys];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'name-az':
      return sorted.sort((a, b) => a.teamName.localeCompare(b.teamName));
    case 'newest':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// ─── Mystery Box Card ────────────────────────────────────────────────────────

function MysteryBoxCard({
  box,
  isHe,
  isRtl,
  index,
}: {
  box: typeof MYSTERY_BOX_OPTIONS[number];
  isHe: boolean;
  isRtl: boolean;
  index: number;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();

  const [nameNumberOpen, setNameNumberOpen] = useState(false);
  const [patchOpen, setPatchOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');

  const isPlayerVersion = box.slug === 'player-version-mystery';

  const extras = calculateCustomizationPrice({
    hasNameNumber: nameNumberOpen && !!(customName || customNumber),
    hasPatch: patchOpen,
    hasPants: false,
    isPlayerVersion: false,
  });
  const totalPrice = box.price + extras;

  const handleAdd = () => {
    const jersey: Jersey = {
      id: box.slug,
      teamName: isHe ? box.labelHe : box.labelEn,
      league: 'rest_of_world',
      season: '',
      type: 'regular',
      category: 'mystery-box',
      imageUrl: '',
      additionalImages: [],
      isWorldCup: false,
      internationalTeam: '',
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
      tags: [],
      isLongSleeve: false,
      createdAt: new Date().toISOString(),
      price: box.price,
      slug: box.slug,
    };
    addItem(jersey, 'M', {
      customName: nameNumberOpen ? customName.trim() : '',
      customNumber: nameNumberOpen ? customNumber.trim() : '',
      hasPatch: patchOpen,
      patchText: '',
      hasPants: false,
      isPlayerVersion,
    });
    toast({
      title: isHe ? 'נוסף לסל' : 'Added to cart',
      description: isHe ? box.labelHe : box.labelEn,
      variant: 'success',
    });
    setNameNumberOpen(false);
    setPatchOpen(false);
    setCustomName('');
    setCustomNumber('');
  };

  const inputStyle = {
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border)',
  };

  const toggleOptions = [
    {
      key: 'nameNumber' as const,
      en: 'Name & Number',
      he: 'שם ומספר',
      price: PRICES.customization.nameAndNumber,
      active: nameNumberOpen,
      onToggle: () => {
        if (nameNumberOpen) {
          setNameNumberOpen(false);
          setCustomName('');
          setCustomNumber('');
        } else {
          setNameNumberOpen(true);
        }
      },
    },
    {
      key: 'patch' as const,
      en: 'Patch',
      he: "פאצ'",
      price: PRICES.customization.patch,
      active: patchOpen,
      onToggle: () => setPatchOpen(!patchOpen),
    },
  ];

  return (
    <Reveal delay={index * 100}>
      <div
        className="relative rounded-xl p-6 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.01]"
        style={{
          backgroundColor: 'var(--steel)',
          border: '1px solid rgba(255,140,0,0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <Package className="w-8 h-8 shrink-0 mt-0.5" style={{ color: 'var(--cta)' }} />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">
              {isHe ? box.labelHe : box.labelEn}
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {isHe ? box.description.he : box.description.en}
            </p>
            <p className="text-2xl font-bold mt-2 font-mono" style={{ color: 'var(--gold)' }}>
              {CURRENCY}{box.price}
            </p>
          </div>
        </div>

        {/* Customization toggles — same pattern as product page */}
        <div>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            {isHe ? 'התאמה אישית' : 'Customize'}
          </p>

          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {toggleOptions.map((opt, i) => (
              <div key={opt.key}>
                {/* Toggle row */}
                <button
                  onClick={opt.onToggle}
                  className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.02]"
                  aria-checked={opt.active}
                  role="switch"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0"
                      style={{ backgroundColor: opt.active ? 'var(--gold)' : 'rgba(255,255,255,0.1)' }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200"
                        style={{ [isRtl ? 'right' : 'left']: opt.active ? 18 : 2 }}
                      />
                    </div>
                    <span className="text-sm text-white">{isHe ? opt.he : opt.en}</span>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    +{CURRENCY}{opt.price}
                  </span>
                </button>

                {/* Name & Number inputs */}
                {opt.key === 'nameNumber' && opt.active && (
                  <div className="px-4 pb-3 flex gap-2">
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value.slice(0, 12))}
                      placeholder={isHe ? 'שם' : 'Name'}
                      maxLength={12}
                      className="flex-1 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--gold)]"
                      style={{ ...inputStyle, direction: isRtl ? 'rtl' : 'ltr' }}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customNumber}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                        setCustomNumber(v);
                      }}
                      placeholder="#"
                      maxLength={2}
                      className="w-16 rounded-lg px-3 py-2 text-sm text-white text-center placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--gold)]"
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* Divider */}
                {i < toggleOptions.length - 1 && (
                  <div style={{ borderBottom: '1px solid var(--border)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Button variant="primary" size="md" className="w-full mt-auto" onClick={handleAdd}>
          {isHe ? `הוסף לסל` : 'ADD TO CART'}
          <span className="mx-1">·</span>
          {CURRENCY}{totalPrice}
        </Button>
      </div>
    </Reveal>
  );
}

// ─── Mystery Box Page ────────────────────────────────────────────────────────

function MysteryBoxPage({ isHe, isRtl }: { isHe: boolean; isRtl: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {MYSTERY_BOX_OPTIONS.map((box, i) => (
        <MysteryBoxCard key={box.slug} box={box} isHe={isHe} isRtl={isRtl} index={i} />
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface CategoryPageClientProps {
  slug: string;
}

export function CategoryPageClient({ slug }: CategoryPageClientProps) {
  const { locale, isRtl } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHe = locale === 'he';
  const isMysteryBox = slug === 'mystery-box';
  const isLeague = isLeagueSlug(slug);

  // ─── State ──────────────────────────────────────────────────────────────
  const [allJerseys, setAllJerseys] = useState<Jersey[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ─── Read filters from URL ──────────────────────────────────────────────
  const urlTypes = searchParams.get('type')?.split(',').filter(Boolean) ?? [];
  const urlTeam = searchParams.get('team') ?? '';
  const urlSort = searchParams.get('sort') ?? 'newest';

  const [selectedTypes, setSelectedTypes] = useState<string[]>(urlTypes);
  const [selectedTeam, setSelectedTeam] = useState(urlTeam);
  const [sortBy, setSortBy] = useState(urlSort);

  // Sync state from URL on mount / URL change
  useEffect(() => {
    const types = searchParams.get('type')?.split(',').filter(Boolean) ?? [];
    const team = searchParams.get('team') ?? '';
    const sort = searchParams.get('sort') ?? 'newest';
    setSelectedTypes(types);
    setSelectedTeam(team);
    setSortBy(sort);
  }, [searchParams]);

  // ─── Fetch jerseys ─────────────────────────────────────────────────────
  useEffect(() => {
    // For league pages, request only that league from the API to reduce payload
    const endpoint = isLeagueSlug(slug) ? `/api/products?league=${slug}` : '/api/products';
    fetch(endpoint)
      .then((r) => r.json())
      .then((json) => setAllJerseys(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  // ─── Filter pipeline ───────────────────────────────────────────────────
  const categoryJerseys = useMemo(
    () => filterByCategory(allJerseys, slug),
    [allJerseys, slug],
  );

  // Available types in this category (for pills)
  const availableTypes = useMemo(() => {
    const types = new Set(categoryJerseys.map((j) => j.type));
    return Array.from(types).sort();
  }, [categoryJerseys]);

  // Available teams (for league categories)
  const availableTeams = useMemo(() => {
    const teams = new Set(categoryJerseys.map((j) => j.teamName));
    return Array.from(teams).sort();
  }, [categoryJerseys]);

  // Apply user filters
  const filteredJerseys = useMemo(() => {
    let result = categoryJerseys;

    // Type filter
    if (selectedTypes.length > 0) {
      result = result.filter((j) => selectedTypes.includes(j.type));
    }

    // Team filter
    if (selectedTeam) {
      result = result.filter((j) => j.teamName === selectedTeam);
    }

    // Sort
    return sortJerseys(result, sortBy);
  }, [categoryJerseys, selectedTypes, selectedTeam, sortBy]);

  // Visible slice for infinite scroll
  const visibleJerseys = useMemo(
    () => filteredJerseys.slice(0, visibleCount),
    [filteredJerseys, visibleCount],
  );

  const hasMore = visibleCount < filteredJerseys.length;
  const hasActiveFilters = selectedTypes.length > 0 || selectedTeam !== '' || sortBy !== 'newest';

  // ─── URL syncing ────────────────────────────────────────────────────────
  const updateURL = useCallback(
    (types: string[], team: string, sort: string) => {
      const params = new URLSearchParams();
      if (types.length > 0) params.set('type', types.join(','));
      if (team) params.set('team', team);
      if (sort && sort !== 'newest') params.set('sort', sort);
      const qs = params.toString();
      router.replace(`/${locale}/category/${slug}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, locale, slug],
  );

  // ─── Filter handlers ───────────────────────────────────────────────────
  const toggleType = useCallback(
    (type: string) => {
      const next = selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type];
      setSelectedTypes(next);
      setVisibleCount(PAGE_SIZE);
      updateURL(next, selectedTeam, sortBy);
    },
    [selectedTypes, selectedTeam, sortBy, updateURL],
  );

  const handleTeamChange = useCallback(
    (team: string) => {
      setSelectedTeam(team);
      setVisibleCount(PAGE_SIZE);
      updateURL(selectedTypes, team, sortBy);
    },
    [selectedTypes, sortBy, updateURL],
  );

  const handleSortChange = useCallback(
    (sort: string) => {
      setSortBy(sort);
      setVisibleCount(PAGE_SIZE);
      updateURL(selectedTypes, selectedTeam, sort);
    },
    [selectedTypes, selectedTeam, updateURL],
  );

  const clearAll = useCallback(() => {
    setSelectedTypes([]);
    setSelectedTeam('');
    setSortBy('newest');
    setVisibleCount(PAGE_SIZE);
    updateURL([], '', 'newest');
  }, [updateURL]);

  // ─── Infinite scroll ───────────────────────────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredJerseys.length));
        }
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [filteredJerseys.length]);

  // ─── Category display name ─────────────────────────────────────────────
  const names = CATEGORY_NAMES[slug];
  const categoryName = names ? (isHe ? names.he : names.en) : slug;

  const breadcrumbs = [
    { label: isHe ? 'בית' : 'Home', href: `/${locale}` },
    { label: isHe ? 'גלה' : 'Discover', href: `/${locale}/discover` },
    { label: categoryName },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-8 md:py-12" style={{ backgroundColor: 'var(--ink)' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        <div className="mb-6">
          <h1 className="font-playfair text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
            {categoryName}
          </h1>
          {!isMysteryBox && !loading && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isHe ? `מציג ${filteredJerseys.length} חולצות` : `Showing ${filteredJerseys.length} jerseys`}
            </p>
          )}
        </div>

        {/* Mystery Box — special layout */}
        {isMysteryBox ? (
          <MysteryBoxPage isHe={isHe} isRtl={isRtl} />
        ) : loading ? (
          /* Loading skeleton */
          <div>
            {/* Skeleton pills */}
            <div className="flex gap-2 mb-6">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-20 rounded-full" />
              ))}
            </div>
            {/* Skeleton grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ─── Filters ────────────────────────────────────────── */}
            <div className="mb-6 space-y-3">
              {/* Type pills — horizontal scroll */}
              {availableTypes.length > 1 && (
                <div
                  className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
                  role="group"
                  aria-label={isHe ? 'סינון לפי סוג' : 'Filter by type'}
                  style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                >
                  {availableTypes.map((type) => {
                    const active = selectedTypes.includes(type);
                    const label = TYPE_LABELS[type];
                    return (
                      <button
                        key={type}
                        onClick={() => toggleType(type)}
                        aria-pressed={active}
                        className="shrink-0 rounded-full px-4 text-sm font-medium transition-all duration-200"
                        style={{
                          height: 44,
                          backgroundColor: active ? 'rgba(200,162,75,0.15)' : 'rgba(255,255,255,0.05)',
                          color: active ? 'var(--gold)' : 'var(--text-secondary)',
                          border: active
                            ? '1px solid rgba(200,162,75,0.4)'
                            : '1px solid var(--border)',
                        }}
                      >
                        {label ? (isHe ? label.he : label.en) : type}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sort + Team pills row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Sort pills */}
                <div className="flex gap-1.5">
                  {SORT_OPTIONS.map((opt) => {
                    const active = sortBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSortChange(opt.value)}
                        aria-pressed={active}
                        className="shrink-0 rounded-full px-3 text-xs font-medium transition-all duration-200"
                        style={{
                          height: 36,
                          backgroundColor: active ? 'rgba(200,162,75,0.15)' : 'rgba(255,255,255,0.05)',
                          color: active ? 'var(--gold)' : 'var(--text-secondary)',
                          border: active ? '1px solid rgba(200,162,75,0.4)' : '1px solid var(--border)',
                        }}
                      >
                        {isHe ? opt.he : opt.en}
                      </button>
                    );
                  })}
                </div>

                {/* Team pills — league pages only */}
                {isLeague && availableTeams.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide max-w-[60vw]">
                    <button
                      onClick={() => handleTeamChange('')}
                      aria-pressed={selectedTeam === ''}
                      className="shrink-0 rounded-full px-3 text-xs font-medium transition-all duration-200"
                      style={{
                        height: 36,
                        backgroundColor: selectedTeam === '' ? 'rgba(200,162,75,0.15)' : 'rgba(255,255,255,0.05)',
                        color: selectedTeam === '' ? 'var(--gold)' : 'var(--text-secondary)',
                        border: selectedTeam === '' ? '1px solid rgba(200,162,75,0.4)' : '1px solid var(--border)',
                      }}
                    >
                      {isHe ? 'כל הקבוצות' : 'All Teams'}
                    </button>
                    {availableTeams.map((team) => {
                      const active = selectedTeam === team;
                      return (
                        <button
                          key={team}
                          onClick={() => handleTeamChange(team)}
                          aria-pressed={active}
                          className="shrink-0 rounded-full px-3 text-xs font-medium transition-all duration-200"
                          style={{
                            height: 36,
                            backgroundColor: active ? 'rgba(200,162,75,0.15)' : 'rgba(255,255,255,0.05)',
                            color: active ? 'var(--gold)' : 'var(--text-secondary)',
                            border: active ? '1px solid rgba(200,162,75,0.4)' : '1px solid var(--border)',
                          }}
                        >
                          {team}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Clear all */}
                {hasActiveFilters && (
                  <button
                    onClick={clearAll}
                    className="text-xs font-medium transition-colors hover:underline"
                    style={{ color: 'var(--gold)', height: 36, display: 'flex', alignItems: 'center' }}
                  >
                    {isHe ? 'נקה הכל' : 'Clear All'}
                  </button>
                )}
              </div>
            </div>

            {/* ─── Product Grid ────────────────────────────────────── */}
            {filteredJerseys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <SearchX className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
                <p className="text-lg font-semibold text-white">
                  {isHe ? 'לא נמצאו חולצות התואמות לסינון' : 'No jerseys found matching your filters'}
                </p>
                <button
                  onClick={clearAll}
                  className="text-sm font-medium transition-colors hover:underline"
                  style={{ color: 'var(--gold)' }}
                >
                  {isHe ? 'נקה סינון' : 'Clear filters'}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {visibleJerseys.map((jersey, i) => (
                    <Reveal key={jersey.id} delay={Math.min(i * 50, 300)}>
                      <ProductCard jersey={jersey} priority={i < 8} imageSizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                    </Reveal>
                  ))}
                </div>

                {/* Infinite scroll sentinel — always rendered so observer doesn't detach */}
                <div ref={sentinelRef} className="mt-4">
                  {hasMore && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                      {Array.from({ length: 4 }, (_, i) => (
                        <ProductCardSkeleton key={i} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
