'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SearchX, ChevronDown } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Reveal } from '@/components/ui/reveal';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { saveRecentSearch, matchesQuery, findSuggestion, buildTeamIndex } from '@/components/search/SearchBar';
import { getJerseyName } from '@/lib/utils';
import type { Jersey } from '@/types';
import { useRouter } from 'next/navigation';

// ─── Sort ───────────────────────────────────────────────────────────────────

type SortKey = 'relevance' | 'newest' | 'price-asc' | 'price-desc';

const SORT_OPTIONS: { key: SortKey; en: string; he: string }[] = [
  { key: 'relevance',  en: 'Relevance',          he: 'רלוונטיות' },
  { key: 'newest',     en: 'Newest',              he: 'חדש ביותר' },
  { key: 'price-asc',  en: 'Price: Low to High',  he: 'מחיר: נמוך לגבוה' },
  { key: 'price-desc', en: 'Price: High to Low',  he: 'מחיר: גבוה לנמוך' },
];

function relevanceScore(jersey: Jersey, q: string, locale: 'en' | 'he'): number {
  const lower = q.toLowerCase();
  let score = 0;
  const name = getJerseyName(jersey, locale).toLowerCase();
  const teamName = jersey.teamName.toLowerCase();
  const altName = getJerseyName(jersey, locale === 'he' ? 'en' : 'he').toLowerCase();

  if (name === lower || teamName === lower || altName === lower) score += 100;
  if (name.startsWith(lower) || teamName.startsWith(lower) || altName.startsWith(lower)) score += 50;
  if (name.includes(lower) || teamName.includes(lower) || altName.includes(lower)) score += 20;
  if (jersey.tags.join(' ').toLowerCase().includes(lower)) score += 10;
  if (jersey.league.toLowerCase().includes(lower)) score += 10;
  if (jersey.category.toLowerCase().includes(lower)) score += 5;

  return score;
}

function sortJerseys(jerseys: Jersey[], sortKey: SortKey, query: string, locale: 'en' | 'he'): Jersey[] {
  const sorted = [...jerseys];
  switch (sortKey) {
    case 'relevance':
      sorted.sort((a, b) => relevanceScore(b, query, locale) - relevanceScore(a, query, locale));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
  }
  return sorted;
}

// ─── Sort Dropdown ──────────────────────────────────────────────────────────

function SortDropdown({ value, onChange, isHe }: {
  value: SortKey;
  onChange: (v: SortKey) => void;
  isHe: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.key === value)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors"
        style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
      >
        {isHe ? current.he : current.en}
        <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 200ms' }} />
      </button>
      {open && (
        <div
          className="absolute top-full mt-1 min-w-[180px] rounded-xl overflow-hidden z-20"
          style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', [isHe ? 'left' : 'right']: 0 } as React.CSSProperties}
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); setOpen(false); }}
              className="w-full text-start px-4 py-2.5 text-sm transition-colors"
              style={{
                color: opt.key === value ? 'var(--gold)' : 'var(--text-secondary)',
                backgroundColor: opt.key === value ? 'rgba(200,162,75,0.08)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (opt.key !== value) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(e) => { if (opt.key !== value) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              {isHe ? opt.he : opt.en}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page Size ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Component ──────────────────────────────────────────────────────────────

export function SearchPageClient() {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') ?? '';

  const [allJerseys, setAllJerseys] = useState<Jersey[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('relevance');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch jerseys
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((json) => setAllJerseys(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Save query to recent searches
  useEffect(() => {
    if (query.trim()) saveRecentSearch(query.trim());
  }, [query]);

  // Reset visible count when query or sort changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [query, sort]);

  // Filter + sort
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const filtered = allJerseys.filter((j) => matchesQuery(j, query, locale));
    return sortJerseys(filtered, sort, query, locale);
  }, [allJerseys, query, sort, locale]);

  // "Did you mean?" suggestion
  const suggestion = useMemo(() => {
    if (!query.trim() || results.length > 0) return null;
    const teamNames = buildTeamIndex(allJerseys, locale);
    return findSuggestion(query, teamNames);
  }, [query, results.length, allJerseys, locale]);

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount((prev) => prev + PAGE_SIZE); },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, visibleCount]);

  const breadcrumbs = [
    { label: isHe ? 'בית' : 'Home', href: `/${locale}` },
    { label: isHe ? 'חיפוש' : 'Search' },
  ];

  return (
    <div className="min-h-screen py-8 md:py-12" style={{ backgroundColor: 'var(--ink)' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        {/* Title */}
        <div className="mb-8">
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
            {query
              ? (isHe ? `תוצאות חיפוש עבור "${query}"` : `Search results for "${query}"`)
              : (isHe ? 'חיפוש' : 'Search')}
          </h1>
          {!loading && query && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {results.length} {isHe ? 'חולצות נמצאו' : 'jerseys found'}
            </p>
          )}
        </div>

        {/* Sort */}
        {!loading && results.length > 0 && (
          <div className="flex items-center justify-end mb-6">
            <SortDropdown value={sort} onChange={setSort} isHe={isHe} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Results grid */}
        {!loading && results.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {visibleResults.map((jersey, i) => (
                <Reveal key={jersey.id} delay={Math.min(i * 50, 300)}>
                  <ProductCard jersey={jersey} priority={i < 8} />
                </Reveal>
              ))}
            </div>
            {hasMore && <div ref={sentinelRef} className="h-10" />}
          </>
        )}

        {/* Empty state */}
        {!loading && query && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <SearchX className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-semibold text-white">
              {isHe ? `אין תוצאות עבור '${query}'` : `No results for '${query}'`}
            </p>
            {suggestion ? (
              <button
                onClick={() => router.push(`/${locale}/search?q=${encodeURIComponent(suggestion)}`)}
                className="text-base transition-colors"
                style={{ color: 'var(--gold)' }}
              >
                {isHe ? `התכוונת ל"${suggestion}"?` : `Did you mean "${suggestion}"?`}
              </button>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {isHe ? 'נסה חיפוש אחר או עיין בקטגוריות שלנו' : 'Try a different search or browse our categories'}
              </p>
            )}
            <Link
              href={`/${locale}/discover`}
              className="mt-2 px-8 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200"
              style={{ backgroundColor: 'var(--cta)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              {isHe ? 'גלה חולצות' : 'Explore Jerseys'}
            </Link>
          </div>
        )}

        {/* No query state */}
        {!loading && !query && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <SearchX className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-semibold text-white">
              {isHe ? 'הקלד מילת חיפוש' : 'Enter a search term'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {isHe ? 'חפש חולצות, קבוצות, ליגות...' : 'Search jerseys, teams, leagues...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
