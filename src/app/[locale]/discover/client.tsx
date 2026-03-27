'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, SearchX } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Reveal } from '@/components/ui/reveal';
import Fuse from 'fuse.js';
import { getJerseyName } from '@/lib/utils';
import type { Jersey } from '@/types';

// ─── Fuse.js searchable shape ────────────────────────────────────────────────

interface SearchableJersey {
  id: string;
  nameEn: string;
  nameHe: string;
  tags: string;
  intlTeam: string;
  league: string;
  category: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;
const SUGGESTED_LIMIT = 100;

// ─── Bilingual labels ────────────────────────────────────────────────────────

const labels = {
  en: {
    leagues: 'Leagues',
    collections: 'Collections',
    premierLeague: 'Premier League',
    laliga: 'LaLiga',
    serieA: 'Serie A',
    bundesliga: 'Bundesliga',
    ligue1: 'Ligue 1',
    restOfWorld: 'Rest of World',
    international: 'International',
    retro: 'Retro',
    season2526: '25/26 Season',
    special: 'Special Edition',
    worldCup: 'World Cup',
    kids: 'Kids',
    longSleeve: 'Long Sleeve',
    drip: 'Drip',
    otherProducts: 'Other Products',
    stussyEdition: 'Stussy Edition',
    clearAll: 'Clear All',
    showingSuggested: (n: number) => `Showing ${n} suggested jerseys`,
    showingFiltered: (n: number) => `Showing ${n} jerseys`,
    searchPlaceholder: 'Search jerseys, teams, leagues...',
    suggested: 'Suggested',
    newest: 'Newest',
    priceLow: 'Price: Low to High',
    priceHigh: 'Price: High to Low',
    noResults: 'No jerseys found',
    noResultsSub: 'Try adjusting your filters',
    didYouMean: 'Did you mean',
  },
  he: {
    leagues: 'ליגות',
    collections: 'קולקציות',
    premierLeague: 'פרמייר ליג',
    laliga: 'לה ליגה',
    serieA: 'סרייה A',
    bundesliga: 'בונדסליגה',
    ligue1: 'ליג 1',
    restOfWorld: 'שאר העולם',
    international: 'נבחרות',
    retro: 'רטרו',
    season2526: 'עונת 25/26',
    special: 'מהדורה מיוחדת',
    worldCup: 'מונדיאל',
    kids: 'ילדים',
    longSleeve: 'שרוול ארוך',
    drip: 'דריפ',
    otherProducts: 'מוצרים נוספים',
    stussyEdition: 'מהדורת סטוסי',
    clearAll: 'נקה הכל',
    showingSuggested: (n: number) => `מציג ${n} חולצות מומלצות`,
    showingFiltered: (n: number) => `מציג ${n} חולצות`,
    searchPlaceholder: '...חפש חולצות, קבוצות, ליגות',
    suggested: 'מומלץ',
    newest: 'חדש ביותר',
    priceLow: 'מחיר: נמוך לגבוה',
    priceHigh: 'מחיר: גבוה לנמוך',
    noResults: 'לא נמצאו חולצות',
    noResultsSub: 'נסה לשנות את הסינון',
    didYouMean: 'האם התכוונת ל',
  },
} as const;

// ─── Pill definitions ────────────────────────────────────────────────────────

interface Pill {
  id: string;
  labelKey: keyof typeof labels.en;
}

const LEAGUE_PILLS: Pill[] = [
  { id: 'england',        labelKey: 'premierLeague' },
  { id: 'spain',          labelKey: 'laliga' },
  { id: 'italy',          labelKey: 'serieA' },
  { id: 'germany',        labelKey: 'bundesliga' },
  { id: 'france',         labelKey: 'ligue1' },
  { id: 'rest_of_world',  labelKey: 'restOfWorld' },
  { id: 'national_teams', labelKey: 'international' },
];

const COLLECTION_PILLS: Pill[] = [
  { id: 'retro',          labelKey: 'retro' },
  { id: 'season-2526',    labelKey: 'season2526' },
  { id: 'special',        labelKey: 'special' },
  { id: 'stussy-edition', labelKey: 'stussyEdition' },
  { id: 'world-cup',      labelKey: 'worldCup' },
  { id: 'kids',           labelKey: 'kids' },
  { id: 'long-sleeve',    labelKey: 'longSleeve' },
  { id: 'drip',           labelKey: 'drip' },
  { id: 'other-products', labelKey: 'otherProducts' },
];

const SORT_OPTIONS = [
  { value: 'suggested',  labelKey: 'suggested' as const },
  { value: 'newest',     labelKey: 'newest' as const },
  { value: 'price-asc',  labelKey: 'priceLow' as const },
  { value: 'price-desc', labelKey: 'priceHigh' as const },
];

// ─── Hype Score (fallback for jerseys with no analytics data) ────────────────

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function computeFallbackScore(jersey: Jersey, minTime: number, maxTime: number): number {
  const created = new Date(jersey.createdAt).getTime();
  const range = maxTime - minTime || 1;
  const newness = (created - minTime) / range;
  const deterministicRandom = (hashCode(jersey.id) % 10000) / 10000;
  return newness * 0.5 + deterministicRandom * 0.5;
}

function getSuggestedJerseys(all: Jersey[], getScore: (id: string) => number): Jersey[] {
  if (all.length === 0) return [];
  const times = all.map((j) => new Date(j.createdAt).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const scored = all
    .map((j) => {
      const analyticsScore = getScore(j.id);
      const fallback = computeFallbackScore(j, minTime, maxTime);
      return { jersey: j, score: analyticsScore > 0 ? analyticsScore + fallback : fallback };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, SUGGESTED_LIMIT).map((s) => s.jersey);
}

// ─── Filtering helpers ───────────────────────────────────────────────────────

function leagueMatchesJersey(leagueId: string, j: Jersey): boolean {
  return j.league === leagueId;
}

function collectionMatchesJersey(colId: string, j: Jersey): boolean {
  switch (colId) {
    case 'retro':          return j.type === 'retro';
    case 'season-2526':    return j.type === 'regular' && (j.season.includes('24/25') || j.season.includes('25/26'));
    case 'special':        return j.type === 'special';
    case 'stussy-edition': return j.tags.some((t) => t.toLowerCase().includes('stussy'));
    case 'world-cup':      return j.type === 'world_cup';
    case 'kids':           return j.type === 'kids';
    case 'long-sleeve':    return j.tags.some((t) => t.includes('ארוך'));
    case 'drip':           return j.type === 'drip';
    case 'other-products': return j.type === 'other_products';
    default:               return false;
  }
}

function searchMatchesJersey(j: Jersey, q: string): boolean {
  const en   = getJerseyName(j, 'en').toLowerCase();
  const he   = j.teamName.toLowerCase();
  const tags = j.tags.join(' ').toLowerCase();
  const intl = (j.internationalTeam || '').toLowerCase();
  const league = j.league.toLowerCase();
  const cat  = j.category.toLowerCase();
  return en.includes(q) || he.includes(q) || tags.includes(q) || intl.includes(q) || league.includes(q) || cat.includes(q);
}

// ─── Sort ────────────────────────────────────────────────────────────────────

function sortJerseys(jerseys: Jersey[], sort: string): Jersey[] {
  if (sort === 'suggested') return jerseys; // already in hype/filter order
  const sorted = [...jerseys];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'newest':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DiscoverClient() {
  const { locale, isRtl } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHe = locale === 'he';
  const t = labels[isHe ? 'he' : 'en'];
  const getScore = useAnalyticsStore((s) => s.getScore);
  const recordSearch = useAnalyticsStore((s) => s.recordSearch);
  const recordSearchMatches = useAnalyticsStore((s) => s.recordSearchMatches);

  // ── State ──────────────────────────────────────────────────────────────────
  const [allJerseys, setAllJerseys] = useState<Jersey[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [transitioning, setTransitioning] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const urlUpdateTimer = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Read initial state from URL
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(
    () => searchParams.get('leagues')?.split(',').filter(Boolean) ?? [],
  );
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    () => searchParams.get('collections')?.split(',').filter(Boolean) ?? [],
  );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get('q') ?? '',
  );
  const [sortBy, setSortBy] = useState(
    () => searchParams.get('sort') ?? 'suggested',
  );

  // Debounced search for actual filtering
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((json) => setAllJerseys(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Are filters active? ────────────────────────────────────────────────────
  const hasFilters =
    selectedLeagues.length > 0 ||
    selectedCollections.length > 0 ||
    debouncedQuery.trim() !== '';

  const hasAnyActive = hasFilters || sortBy !== 'suggested';

  // ── Suggested jerseys (analytics + hype fallback) ──────────────────────────
  const suggestedJerseys = useMemo(() => getSuggestedJerseys(allJerseys, getScore), [allJerseys, getScore]);

  // ── Fuse.js indexes ────────────────────────────────────────────────────────

  // Searchable jersey data for fuzzy matching
  const searchData = useMemo<SearchableJersey[]>(
    () =>
      allJerseys.map((j) => ({
        id: j.id,
        nameEn: getJerseyName(j, 'en'),
        nameHe: j.teamName,
        tags: j.tags.join(' '),
        intlTeam: j.internationalTeam || '',
        league: j.league,
        category: j.category,
      })),
    [allJerseys],
  );

  const jerseyFuse = useMemo(
    () =>
      new Fuse(searchData, {
        keys: [
          { name: 'nameEn', weight: 2 },
          { name: 'nameHe', weight: 2 },
          { name: 'tags', weight: 1 },
          { name: 'intlTeam', weight: 1 },
          { name: 'league', weight: 0.5 },
          { name: 'category', weight: 0.5 },
        ],
        threshold: 0.35,
        distance: 200,
        includeScore: true,
        minMatchCharLength: 2,
      }),
    [searchData],
  );

  // Unique terms index for "Did you mean?" suggestions
  const termsFuse = useMemo(() => {
    const seen = new Set<string>();
    const terms: { term: string }[] = [];
    allJerseys.forEach((j) => {
      const en = getJerseyName(j, 'en');
      [en, j.teamName, ...j.tags, j.internationalTeam || ''].forEach((raw) => {
        const clean = raw.trim();
        if (clean.length >= 2 && !seen.has(clean.toLowerCase())) {
          seen.add(clean.toLowerCase());
          terms.push({ term: clean });
        }
      });
    });
    return new Fuse(terms, {
      keys: ['term'],
      threshold: 0.4,
      includeScore: true,
    });
  }, [allJerseys]);

  // ── Filter pipeline ────────────────────────────────────────────────────────
  const { filteredJerseys, suggestion } = useMemo(() => {
    // Default state: no filters → show suggested jerseys
    if (!hasFilters) {
      return { filteredJerseys: sortJerseys(suggestedJerseys, sortBy), suggestion: null as string | null };
    }

    let pool = allJerseys;

    // League filters (OR within)
    if (selectedLeagues.length > 0) {
      pool = pool.filter((j) => selectedLeagues.some((l) => leagueMatchesJersey(l, j)));
    }

    // Collection filters (AND with leagues, OR within collections)
    if (selectedCollections.length > 0) {
      pool = pool.filter((j) => selectedCollections.some((c) => collectionMatchesJersey(c, j)));
    }

    // Search (stacks on everything)
    let suggestion: string | null = null;
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();

      // Try exact matching first
      const exactResults = pool.filter((j) => searchMatchesJersey(j, q));

      if (exactResults.length > 0) {
        pool = exactResults;
      } else {
        // Fuzzy fallback — search all jerseys, then intersect with current pool
        const fuseHits = jerseyFuse.search(debouncedQuery.trim());
        const fuzzyIds = new Set(fuseHits.map((r) => r.item.id));
        const fuzzyPool = pool.filter((j) => fuzzyIds.has(j.id));

        if (fuzzyPool.length > 0) {
          pool = fuzzyPool;
        }

        // Find "Did you mean?" term
        const termHits = termsFuse.search(debouncedQuery.trim());
        if (termHits.length > 0 && (termHits[0].score ?? 1) < 0.4) {
          const best = termHits[0].item.term;
          if (best.toLowerCase() !== q) {
            suggestion = best;
          }
        }
      }
    }

    return { filteredJerseys: sortJerseys(pool, sortBy), suggestion };
  }, [allJerseys, suggestedJerseys, selectedLeagues, selectedCollections, debouncedQuery, sortBy, hasFilters, jerseyFuse, termsFuse]);

  // ── Analytics: track search queries & matches ──────────────────────────────
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2 && filteredJerseys.length > 0) {
      recordSearch(debouncedQuery.trim());
      recordSearchMatches(filteredJerseys.slice(0, 20).map((j) => j.id));
    }
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Visible slice
  const visibleJerseys = useMemo(
    () => filteredJerseys.slice(0, visibleCount),
    [filteredJerseys, visibleCount],
  );
  const hasMore = visibleCount < filteredJerseys.length;

  // ── URL syncing ────────────────────────────────────────────────────────────
  const updateURL = useCallback(
    (leagues: string[], collections: string[], q: string, sort: string) => {
      clearTimeout(urlUpdateTimer.current);
      urlUpdateTimer.current = setTimeout(() => {
        const params = new URLSearchParams();
        if (leagues.length > 0) params.set('leagues', leagues.join(','));
        if (collections.length > 0) params.set('collections', collections.join(','));
        if (q.trim()) params.set('q', q.trim());
        if (sort && sort !== 'suggested') params.set('sort', sort);
        const qs = params.toString();
        router.replace(`/${locale}/discover${qs ? `?${qs}` : ''}`, { scroll: false });
      }, 300);
    },
    [router, locale],
  );

  // ── Transition helper ──────────────────────────────────────────────────────
  const triggerTransition = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => setTransitioning(false), 150);
  }, []);

  // ── Filter handlers ────────────────────────────────────────────────────────
  const toggleLeague = useCallback(
    (id: string) => {
      triggerTransition();
      setSelectedLeagues((prev) => {
        const next = prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id];
        setVisibleCount(PAGE_SIZE);
        updateURL(next, selectedCollections, searchQuery, sortBy);
        return next;
      });
    },
    [selectedCollections, searchQuery, sortBy, updateURL, triggerTransition],
  );

  const toggleCollection = useCallback(
    (id: string) => {
      triggerTransition();
      setSelectedCollections((prev) => {
        const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
        setVisibleCount(PAGE_SIZE);
        updateURL(selectedLeagues, next, searchQuery, sortBy);
        return next;
      });
    },
    [selectedLeagues, searchQuery, sortBy, updateURL, triggerTransition],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setVisibleCount(PAGE_SIZE);
      updateURL(selectedLeagues, selectedCollections, value, sortBy);
    },
    [selectedLeagues, selectedCollections, sortBy, updateURL],
  );

  const handleSortChange = useCallback(
    (sort: string) => {
      triggerTransition();
      setSortBy(sort);
      setVisibleCount(PAGE_SIZE);
      updateURL(selectedLeagues, selectedCollections, searchQuery, sort);
    },
    [selectedLeagues, selectedCollections, searchQuery, updateURL, triggerTransition],
  );

  const clearAll = useCallback(() => {
    triggerTransition();
    setSelectedLeagues([]);
    setSelectedCollections([]);
    setSearchQuery('');
    setSortBy('suggested');
    setVisibleCount(PAGE_SIZE);
    updateURL([], [], '', 'suggested');
  }, [updateURL, triggerTransition]);

  // ── Infinite scroll ────────────────────────────────────────────────────────
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

  // ── Build result description ───────────────────────────────────────────────
  const resultText = hasFilters
    ? t.showingFiltered(filteredJerseys.length)
    : t.showingSuggested(filteredJerseys.length);

  // ── Pill label helper ──────────────────────────────────────────────────────
  const getPillLabel = (pill: Pill): string => {
    const val = t[pill.labelKey];
    return typeof val === 'function' ? '' : val;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-12">

        <Breadcrumbs
          items={[
            { label: isHe ? 'בית' : 'Home', href: `/${locale}` },
            { label: isHe ? 'גלה' : 'Discover' },
          ]}
          className="mb-4 pt-6"
        />

        {/* ── Sticky search bar ─────────────────────────────────────────── */}
        <div className="sticky top-16 z-30 py-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="max-w-2xl mx-auto relative">
            <div
              className="flex items-center h-12 rounded-full overflow-hidden transition-all duration-200 focus-within:shadow-[0_0_20px_rgba(0,195,216,0.12)]"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Search
                className={`w-5 h-5 shrink-0 ${isRtl ? 'mr-4' : 'ml-4'}`}
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`flex-1 h-full bg-transparent text-base text-white placeholder:text-[var(--text-muted)] outline-none ${
                  isRtl ? 'pr-3 pl-2' : 'pl-3 pr-2'
                }`}
                style={{ direction: isRtl ? 'rtl' : 'ltr' }}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10 ${
                    isRtl ? 'ml-2' : 'mr-2'
                  }`}
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Filter pills ──────────────────────────────────────────────── */}
        <div className="space-y-4 mb-5">
          {/* League pills */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              {t.leagues}
            </p>
            <div
              className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide pb-1"
              role="group"
              aria-label={t.leagues}
              style={{ direction: isRtl ? 'rtl' : 'ltr' }}
            >
              {LEAGUE_PILLS.map((pill) => {
                const active = selectedLeagues.includes(pill.id);
                return (
                  <button
                    key={pill.id}
                    onClick={() => toggleLeague(pill.id)}
                    aria-pressed={active}
                    className="shrink-0 rounded-full px-4 text-sm font-medium transition-all duration-200"
                    style={{
                      minHeight: 44,
                      backgroundColor: active ? 'rgba(0,195,216,0.15)' : 'rgba(255,255,255,0.05)',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      border: active
                        ? '1px solid rgba(0,195,216,0.4)'
                        : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {getPillLabel(pill)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collection pills */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              {t.collections}
            </p>
            <div
              className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide pb-1"
              role="group"
              aria-label={t.collections}
              style={{ direction: isRtl ? 'rtl' : 'ltr' }}
            >
              {COLLECTION_PILLS.map((pill) => {
                const active = selectedCollections.includes(pill.id);
                return (
                  <button
                    key={pill.id}
                    onClick={() => toggleCollection(pill.id)}
                    aria-pressed={active}
                    className="shrink-0 rounded-full px-4 text-sm font-medium transition-all duration-200"
                    style={{
                      minHeight: 44,
                      backgroundColor: active ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.05)',
                      color: active ? 'var(--cta)' : 'var(--text-secondary)',
                      border: active
                        ? '1px solid rgba(255,140,0,0.4)'
                        : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {getPillLabel(pill)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Result bar ────────────────────────────────────────────────── */}
        {!loading && (
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {resultText}
            </p>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                aria-label={isHe ? 'מיון' : 'Sort'}
                className="rounded-lg px-3 text-sm outline-none"
                style={{
                  height: 36,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  direction: isRtl ? 'rtl' : 'ltr',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t[opt.labelKey] as string}
                  </option>
                ))}
              </select>

              {hasAnyActive && (
                <button
                  onClick={clearAll}
                  className="text-sm font-medium transition-colors hover:underline shrink-0"
                  style={{ color: 'var(--accent)' }}
                >
                  {t.clearAll}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Did you mean? ────────────────────────────────────────────── */}
        {suggestion && (
          <div className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t.didYouMean}{' '}
            <button
              onClick={() => handleSearchChange(suggestion)}
              className="font-semibold underline underline-offset-2 transition-colors hover:brightness-125"
              style={{ color: 'var(--accent)' }}
            >
              {suggestion}
            </button>
            ?
          </div>
        )}

        {/* ── Grid ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredJerseys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <SearchX className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-semibold text-white">{t.noResults}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.noResultsSub}</p>
            {hasAnyActive && (
              <button
                onClick={clearAll}
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                {t.clearAll}
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 transition-opacity duration-150"
              style={{ opacity: transitioning ? 0.5 : 1 }}
            >
              {visibleJerseys.map((jersey, i) => (
                <Reveal key={jersey.id} delay={i < 4 ? i * 50 : 0}>
                  <ProductCard jersey={jersey} priority={i < 4} />
                </Reveal>
              ))}
            </div>

            {/* Infinite scroll sentinel + skeleton row */}
            {hasMore && (
              <div ref={sentinelRef} className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            )}
            {!hasMore && <div ref={sentinelRef} />}
          </>
        )}
      </div>
    </div>
  );
}
