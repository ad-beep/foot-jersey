'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getJerseyName } from '@/lib/utils';
import { CURRENCY } from '@/lib/constants';
import type { Jersey } from '@/types';

// ─── Recent searches helpers ────────────────────────────────────────────────

const RECENT_KEY = 'fj-recent-searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRecentSearch(query: string) {
  const q = query.trim();
  if (!q) return;
  const list = getRecentSearches().filter((s) => s !== q);
  list.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY);
}

// ─── Fuzzy matching ─────────────────────────────────────────────────────────

/** Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Check if query fuzzy-matches a target word (allows ~30% character errors) */
function fuzzyWordMatch(query: string, target: string): boolean {
  if (!target || !query) return false;
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact substring → always match
  if (t.includes(q)) return true;

  // For short queries (< 4 chars), only allow 1 error
  // For longer queries, allow roughly 1 error per 3-4 chars
  const maxDist = q.length < 4 ? 1 : Math.floor(q.length / 3);

  // Check against each word in target
  const targetWords = t.split(/\s+/);
  for (const word of targetWords) {
    if (word.includes(q)) return true;
    if (word.length >= 3 && q.includes(word)) return true;
    if (levenshtein(q, word) <= maxDist) return true;
    // Also check if query is a fuzzy prefix of the word
    if (word.length >= q.length && levenshtein(q, word.slice(0, q.length)) <= Math.max(1, maxDist - 1)) return true;
  }

  // Full string distance check for multi-word queries
  if (levenshtein(q, t) <= maxDist) return true;

  return false;
}

// ─── Search matching ────────────────────────────────────────────────────────

function matchesQuery(jersey: Jersey, q: string, locale: 'en' | 'he'): boolean {
  const name = getJerseyName(jersey, locale);
  const teamName = jersey.teamName;
  const altName = getJerseyName(jersey, locale === 'he' ? 'en' : 'he');
  const tags = jersey.tags.join(' ');
  const league = jersey.league;
  const category = jersey.category;
  const international = jersey.internationalTeam ?? '';

  return (
    fuzzyWordMatch(q, name) ||
    fuzzyWordMatch(q, teamName) ||
    fuzzyWordMatch(q, altName) ||
    fuzzyWordMatch(q, tags) ||
    fuzzyWordMatch(q, league) ||
    fuzzyWordMatch(q, category) ||
    fuzzyWordMatch(q, international)
  );
}

/** Collect all unique team names from jerseys for "did you mean" suggestions */
function buildTeamIndex(jerseys: Jersey[], locale: 'en' | 'he'): string[] {
  const names = new Set<string>();
  for (const j of jerseys) {
    names.add(getJerseyName(j, locale));
    names.add(getJerseyName(j, locale === 'he' ? 'en' : 'he'));
    names.add(j.teamName);
  }
  return Array.from(names).filter((n) => n.length > 0);
}

/** Find the best "did you mean" suggestion for a query */
function findSuggestion(query: string, teamNames: string[]): string | null {
  const q = query.toLowerCase();
  let bestName = '';
  let bestDist = Infinity;

  for (const name of teamNames) {
    const lower = name.toLowerCase();
    // Skip exact matches
    if (lower.includes(q)) return null;

    // Check distance against each word
    const words = lower.split(/\s+/);
    for (const word of words) {
      const dist = levenshtein(q, word);
      if (dist < bestDist && dist <= Math.max(2, Math.floor(q.length / 2))) {
        bestDist = dist;
        bestName = name;
      }
    }

    // Also check full name distance
    const fullDist = levenshtein(q, lower);
    if (fullDist < bestDist && fullDist <= Math.max(2, Math.floor(q.length / 2))) {
      bestDist = fullDist;
      bestName = name;
    }
  }

  return bestDist > 0 && bestName ? bestName : null;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface SearchBarProps {
  className?: string;
  /** Mobile overlay mode */
  mobile?: boolean;
  onClose?: () => void;
}

export function SearchBar({ className, mobile, onClose }: SearchBarProps) {
  const { locale, isRtl } = useLocale();
  const router = useRouter();
  const isHe = locale === 'he';

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [jerseys, setJerseys] = useState<Jersey[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchedRef = useRef(false);

  // Fetch jerseys once
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch('/api/products')
      .then((r) => r.json())
      .then((json) => setJerseys(json.data ?? []))
      .catch(() => {});
  }, []);

  // Load recent searches
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Reset active index when results change
  useEffect(() => { setActiveIndex(-1); }, [debouncedQuery]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-focus on mobile
  useEffect(() => {
    if (mobile && inputRef.current) inputRef.current.focus();
  }, [mobile]);

  // Filter results (with fuzzy matching)
  const results = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    return jerseys.filter((j) => matchesQuery(j, debouncedQuery, locale));
  }, [debouncedQuery, jerseys, locale]);

  // "Did you mean?" suggestion (only when no results from exact match)
  const suggestion = useMemo(() => {
    if (debouncedQuery.length < 3 || results.length > 0) return null;
    const teamNames = buildTeamIndex(jerseys, locale);
    return findSuggestion(debouncedQuery, teamNames);
  }, [debouncedQuery, results.length, jerseys, locale]);

  const topResults = results.slice(0, 5);
  const showDropdown = focused && (debouncedQuery.length >= 2 || (query.length === 0 && recentSearches.length > 0));

  const navigateToProduct = useCallback((id: string) => {
    setFocused(false);
    setQuery('');
    if (onClose) onClose();
    router.push(`/${locale}/product/${id}`);
  }, [locale, router, onClose]);

  const navigateToSearch = useCallback((q?: string) => {
    const searchQ = q ?? query.trim();
    if (!searchQ) return;
    saveRecentSearch(searchQ);
    setFocused(false);
    setQuery('');
    if (onClose) onClose();
    router.push(`/${locale}/search?q=${encodeURIComponent(searchQ)}`);
  }, [locale, router, query, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && activeIndex < topResults.length) {
      navigateToProduct(topResults[activeIndex].id);
    } else {
      navigateToSearch();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setFocused(false);
      if (onClose) onClose();
      return;
    }
    if (!showDropdown || debouncedQuery.length < 2) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, topResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    }
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleRecentClick = (q: string) => {
    setQuery(q);
    setDebouncedQuery(q);
  };

  const handleSuggestionClick = (s: string) => {
    setQuery(s);
    setDebouncedQuery(s);
  };

  const placeholder = isHe ? '...חפש חולצות, קבוצות, ליגות' : 'Search jerseys, teams, leagues...';

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ [isRtl ? 'right' : 'left']: '14px', color: 'var(--text-muted)' } as React.CSSProperties}
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full rounded-full py-2 text-sm focus:outline-none transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
              color: 'var(--text-secondary)',
              paddingLeft: isRtl ? (query ? '36px' : '14px') : '40px',
              paddingRight: isRtl ? '40px' : (query ? '36px' : '14px'),
            }}
            role="combobox"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            aria-controls="search-dropdown"
            aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
            aria-label={isHe ? 'חיפוש' : 'Search'}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setDebouncedQuery(''); inputRef.current?.focus(); }}
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full transition-colors"
              style={{ [isRtl ? 'left' : 'right']: '10px', color: 'var(--text-muted)' } as React.CSSProperties}
              aria-label={isHe ? 'נקה' : 'Clear'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div
          id="search-dropdown"
          className="absolute top-full mt-2 w-full min-w-[320px] rounded-xl overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            animation: 'searchDropIn 150ms ease-out',
          }}
          role="listbox"
        >
          {/* Recent searches (no query typed) */}
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {isHe ? 'חיפושים אחרונים' : 'Recent'}
                </span>
                <button
                  onClick={handleClearRecent}
                  className="text-xs transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                >
                  {isHe ? 'נקה' : 'Clear'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleRecentClick(q)}
                    className="px-3 py-1 rounded-full text-sm transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {debouncedQuery.length >= 2 && (
            <>
              {topResults.length > 0 ? (
                <div className="max-h-[360px] overflow-y-auto">
                  {topResults.map((jersey, i) => {
                    const displayName = getJerseyName(jersey, locale);
                    return (
                      <button
                        key={jersey.id}
                        id={`search-result-${i}`}
                        role="option"
                        aria-selected={i === activeIndex}
                        onClick={() => navigateToProduct(jersey.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors"
                        style={{ backgroundColor: i === activeIndex ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                        onMouseEnter={() => setActiveIndex(i)}
                      >
                        <div
                          className="shrink-0 w-12 h-16 rounded-lg overflow-hidden"
                          style={{ backgroundColor: 'var(--bg-primary)' }}
                        >
                          <Image
                            src={jersey.imageUrl}
                            alt={displayName}
                            width={48}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-start">
                          <p className="text-sm text-white truncate">{displayName}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{jersey.season}</p>
                        </div>
                        <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--accent)' }}>
                          {CURRENCY}{jersey.price}
                        </span>
                      </button>
                    );
                  })}

                  {/* See all results link */}
                  {results.length > 5 && (
                    <button
                      onClick={() => navigateToSearch()}
                      className="w-full px-3 py-3 text-sm font-medium text-start transition-colors"
                      style={{ color: 'var(--accent)', borderTop: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      {isHe ? `צפה בכל ${results.length} התוצאות →` : `See all ${results.length} results →`}
                    </button>
                  )}
                </div>
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-white">
                    {isHe ? `אין תוצאות עבור '${debouncedQuery}'` : `No results for '${debouncedQuery}'`}
                  </p>
                  {suggestion ? (
                    <button
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-sm mt-2 transition-colors"
                      style={{ color: 'var(--accent)' }}
                    >
                      {isHe ? `התכוונת ל"${suggestion}"?` : `Did you mean "${suggestion}"?`}
                    </button>
                  ) : (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {isHe ? 'נסה מילת חיפוש אחרת' : 'Try a different search term'}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { saveRecentSearch, matchesQuery, findSuggestion, buildTeamIndex };
