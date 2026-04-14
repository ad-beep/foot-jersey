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
    israeliLeague: 'Israeli League',
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
    israeliLeague: 'ליגת העל',
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
  { id: 'israeli_league', labelKey: 'israeliLeague' },
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

// ─── Short sort labels (for compact buttons) ─────────────────────────────────

const SORT_SHORT: Record<string, { en: string; he: string }> = {
  suggested:   { en: 'Best',  he: 'מומלץ' },
  newest:      { en: 'New',   he: 'חדש'   },
  'price-asc': { en: '₪ ↑',  he: '₪ ↑'  },
  'price-desc':{ en: '₪ ↓',  he: '₪ ↓'  },
};

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
  const [searchFocused, setSearchFocused] = useState(false);

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
  const resultCount = filteredJerseys.length;

  // ── Pill label helper ──────────────────────────────────────────────────────
  const getPillLabel = (pill: Pill): string => {
    const val = t[pill.labelKey];
    return typeof val === 'function' ? '' : val;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>

      {/* ── Editorial page header ─────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-6 pb-6">
          <Breadcrumbs
            items={[
              { label: isHe ? 'בית' : 'Home', href: `/${locale}` },
              { label: isHe ? 'גלה' : 'Discover' },
            ]}
            className="mb-5"
          />

          <div className={`flex items-end justify-between gap-6 flex-wrap ${isHe ? 'flex-row-reverse' : ''}`}>
            <div className={isHe ? 'text-right' : ''}>
              <p className="section-kicker mb-2">
                {isHe ? 'כל החולצות' : 'All Jerseys'}
              </p>
              <h1
                className="font-playfair font-bold text-white"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.04em', lineHeight: 0.92 }}
              >
                {isHe ? (
                  <>כל ערכה.<br /><span style={{ color: 'var(--gold)' }}>כל ליגה.</span></>
                ) : (
                  <>Every kit.<br /><span style={{ color: 'var(--gold)' }}>Every league.</span></>
                )}
              </h1>
            </div>

            {/* Live count badge */}
            {!loading && (
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0"
                style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
              >
                <span
                  className="font-playfair font-bold"
                  style={{ fontSize: '1.5rem', color: 'var(--gold)', letterSpacing: '-0.03em', lineHeight: 1 }}
                >
                  {resultCount}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                  {isHe ? 'חולצות' : 'jerseys'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-16">

        {/* ── Sticky toolbar ──────────────────────────────────────────────── */}
        <div
          className="sticky top-16 z-30 pt-4 pb-3 -mx-4 px-4 md:-mx-6 md:px-6"
          style={{ backgroundColor: 'var(--ink)', borderBottom: '1px solid var(--border)' }}
        >
          {/* Search bar */}
          <div
            className="flex items-center h-11 rounded-xl overflow-hidden transition-all duration-200 mb-4"
            style={{
              backgroundColor: 'var(--steel)',
              border: `1px solid ${searchFocused ? 'rgba(200,162,75,0.45)' : 'rgba(255,255,255,0.07)'}`,
              boxShadow: searchFocused ? '0 0 22px rgba(200,162,75,0.09)' : 'none',
            }}
          >
            <Search
              className={`w-4 h-4 shrink-0 ${isRtl ? 'mr-4' : 'ml-4'}`}
              style={{ color: 'var(--muted)' }}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={t.searchPlaceholder}
              className={`flex-1 h-full bg-transparent text-sm text-white outline-none ${
                isRtl ? 'pr-3 pl-2' : 'pl-3 pr-2'
              }`}
              style={{ direction: isRtl ? 'rtl' : 'ltr', color: 'rgba(255,255,255,0.9)' }}
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10 ${
                  isRtl ? 'ml-1.5' : 'mr-1.5'
                }`}
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
              </button>
            )}
          </div>

          {/* ── Filter pills ── */}
          <div className="space-y-3">
            {/* League group */}
            <div>
              <p
                className="font-mono text-[9px] uppercase tracking-[0.25em] mb-2"
                style={{ color: 'rgba(200,162,75,0.5)' }}
              >
                {t.leagues}
              </p>
              <div
                className="flex flex-nowrap gap-1.5 overflow-x-auto scrollbar-hide pb-0.5"
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
                      className="shrink-0 rounded-lg px-3.5 font-mono text-[11px] uppercase tracking-wide transition-all duration-200"
                      style={{
                        height: 34,
                        backgroundColor: active ? 'rgba(200,162,75,0.12)' : 'rgba(255,255,255,0.04)',
                        color: active ? 'var(--gold)' : 'rgba(255,255,255,0.45)',
                        border: active
                          ? '1px solid rgba(200,162,75,0.45)'
                          : '1px solid rgba(255,255,255,0.07)',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {getPillLabel(pill)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collection group */}
            <div>
              <p
                className="font-mono text-[9px] uppercase tracking-[0.25em] mb-2"
                style={{ color: 'rgba(15,100,50,0.8)' }}
              >
                {t.collections}
              </p>
              <div
                className="flex flex-nowrap gap-1.5 overflow-x-auto scrollbar-hide pb-0.5"
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
                      className="shrink-0 rounded-lg px-3.5 font-mono text-[11px] uppercase tracking-wide transition-all duration-200"
                      style={{
                        height: 34,
                        backgroundColor: active ? 'rgba(15,80,46,0.25)' : 'rgba(255,255,255,0.04)',
                        color: active ? '#3ebd82' : 'rgba(255,255,255,0.45)',
                        border: active
                          ? '1px solid rgba(30,140,80,0.5)'
                          : '1px solid rgba(255,255,255,0.07)',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {getPillLabel(pill)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Result bar + sort ────────────────────────────────────────────── */}
        {!loading && (
          <div
            className={`flex items-center gap-3 pt-4 pb-4 flex-wrap ${isHe ? 'flex-row-reverse' : ''}`}
          >
            {/* Count */}
            <p
              className="font-mono text-[11px] uppercase tracking-[0.18em] flex-1"
              style={{ color: 'var(--muted)' }}
            >
              {hasFilters
                ? t.showingFiltered(resultCount)
                : t.showingSuggested(resultCount)}
            </p>

            {/* Sort pill buttons */}
            <div className={`flex gap-1 ${isHe ? 'flex-row-reverse' : ''}`}>
              {SORT_OPTIONS.map((opt) => {
                const active = sortBy === opt.value;
                const short  = SORT_SHORT[opt.value][isHe ? 'he' : 'en'];
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSortChange(opt.value)}
                    className="shrink-0 rounded-lg px-2.5 font-mono text-[10px] uppercase tracking-wide transition-all duration-200"
                    style={{
                      height: 30,
                      backgroundColor: active ? 'rgba(200,162,75,0.12)' : 'transparent',
                      color: active ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
                      border: active ? '1px solid rgba(200,162,75,0.35)' : '1px solid rgba(255,255,255,0.06)',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {short}
                  </button>
                );
              })}
            </div>

            {/* Clear all */}
            {hasAnyActive && (
              <button
                onClick={clearAll}
                className="font-mono text-[11px] uppercase tracking-wide transition-opacity hover:opacity-80 shrink-0"
                style={{ color: 'var(--flare)' }}
              >
                {t.clearAll}
              </button>
            )}
          </div>
        )}

        {/* ── Did you mean? ────────────────────────────────────────────────── */}
        {suggestion && (
          <div
            className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg"
            style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
          >
            <span className="font-mono text-[11px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              {t.didYouMean}
            </span>
            <button
              onClick={() => handleSearchChange(suggestion)}
              className="font-semibold text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--gold)' }}
            >
              {suggestion}
            </button>
          </div>
        )}

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredJerseys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
            >
              <SearchX className="w-7 h-7" style={{ color: 'var(--muted)' }} />
            </div>
            <div>
              <p className="font-playfair font-bold text-xl text-white mb-1">{t.noResults}</p>
              <p className="font-mono text-[11px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                {t.noResultsSub}
              </p>
            </div>
            {hasAnyActive && (
              <button
                onClick={clearAll}
                className="px-5 py-2.5 rounded-xl font-mono text-[11px] uppercase tracking-wide transition-all duration-200 hover:opacity-80"
                style={{
                  backgroundColor: 'rgba(200,162,75,0.1)',
                  border: '1px solid rgba(200,162,75,0.35)',
                  color: 'var(--gold)',
                }}
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
                  <ProductCard jersey={jersey} priority={i < 4} imageSizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
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
