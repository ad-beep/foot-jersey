'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Jersey } from '@/types';

interface SearchResult {
  jersey: Jersey;
  score: number;
  matchedTerms: string[];
}

interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  recentSearches: string[];
  clearRecentSearches: () => void;
  addRecentSearch: (query: string) => void;
}

// Normalize text: lowercase, remove diacritics
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Multi-keyword search: all words must match at least one field
function searchJerseys(jerseys: Jersey[], query: string): SearchResult[] {
  if (!query || query.trim().length < 2) return [];

  const terms = query.trim().split(/\s+/).filter(t => t.length >= 2).map(normalizeText);
  if (terms.length === 0) return [];

  const results: SearchResult[] = [];

  for (const jersey of jerseys) {
    const searchableFields = [
      jersey.teamName,
      jersey.tags.join(' '),
      jersey.category,
      jersey.league,
      jersey.internationalTeam || '',
      jersey.season,
      jersey.type,
    ].map(normalizeText).join(' ');

    const matchedTerms: string[] = [];
    let allMatch = true;

    for (const term of terms) {
      if (searchableFields.includes(term)) {
        matchedTerms.push(term);
      } else {
        allMatch = false;
        break;
      }
    }

    if (allMatch && matchedTerms.length === terms.length) {
      // Score: more matched terms = higher base score
      let score = matchedTerms.length * 10;

      // Bonus for matches in teamName (higher weight)
      const teamNameNormalized = normalizeText(jersey.teamName);
      for (const term of matchedTerms) {
        if (teamNameNormalized.includes(term)) score += 5;
      }

      // Bonus for exact team name match
      if (teamNameNormalized === query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')) {
        score += 50;
      }

      results.push({ jersey, score, matchedTerms });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function useSearch(jerseys: Jersey[]): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fj-recent-searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  // Debounce
  useEffect(() => {
    setIsSearching(true);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const results = useMemo(
    () => searchJerseys(jerseys, debouncedQuery),
    [jerseys, debouncedQuery]
  );

  const addRecentSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 10);
      try { localStorage.setItem('fj-recent-searches', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try { localStorage.removeItem('fj-recent-searches'); } catch {}
  }, []);

  return { query, setQuery, results, isSearching, recentSearches, clearRecentSearches, addRecentSearch };
}
