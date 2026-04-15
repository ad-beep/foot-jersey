'use client';

import { useMemo } from 'react';
import type { Jersey, FilterState, JerseyType } from '@/types';
import { useLocale } from '@/hooks/useLocale';

interface FilterSidebarProps {
  jerseys: Jersey[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const TYPE_LABELS: Record<JerseyType | 'all', { en: string; he: string }> = {
  all:            { en: 'All',           he: 'הכל' },
  regular:        { en: 'Regular',       he: 'רגיל' },
  retro:          { en: 'Retro',         he: 'רטרו' },
  special:        { en: 'Special',       he: 'מיוחד' },
  kids:           { en: 'Kids',          he: 'ילדים' },
  drip:           { en: 'Drip',          he: 'דריפ' },
  world_cup:      { en: 'World Cup',     he: 'מונדיאל' },
  other_products: { en: 'Other',         he: 'אחר' },
  stussy:         { en: 'Stussy',        he: 'סטוסי' },
};

export function FilterSidebar({ jerseys, filters, onFilterChange }: FilterSidebarProps) {
  const { locale, isRtl } = useLocale();
  const isHe = locale === 'he';

  // Derive available types from current jersey set
  const availableTypes = useMemo(() => {
    const types = new Set(jerseys.map((j) => j.type));
    return Array.from(types).sort() as (JerseyType | 'all')[];
  }, [jerseys]);

  // Derive available teams
  const availableTeams = useMemo(() => {
    const teams = new Set(jerseys.map((j) => j.teamName));
    return Array.from(teams).sort();
  }, [jerseys]);

  const hasActiveFilters = filters.type !== 'all' || filters.team !== '';

  const pillBase: React.CSSProperties = {
    height: 34,
    borderRadius: 9999,
    padding: '0 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.18s',
    border: '1px solid var(--border)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap' as const,
  };

  const pillActive: React.CSSProperties = {
    ...pillBase,
    backgroundColor: 'rgba(200,162,75,0.13)',
    color: 'var(--gold)',
    border: '1px solid rgba(200,162,75,0.4)',
    fontWeight: 600,
  };

  return (
    <aside
      className="space-y-5"
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      aria-label={isHe ? 'סינון' : 'Filters'}
    >
      {/* Type filter */}
      {availableTypes.length > 1 && (
        <div>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.22em] mb-2"
            style={{ color: 'rgba(200,162,75,0.55)' }}
          >
            {isHe ? 'סוג' : 'Type'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {/* "All" pill */}
            <button
              style={filters.type === 'all' ? pillActive : pillBase}
              onClick={() => onFilterChange({ ...filters, type: 'all' })}
              aria-pressed={filters.type === 'all'}
            >
              {isHe ? TYPE_LABELS.all.he : TYPE_LABELS.all.en}
            </button>

            {availableTypes.map((type) => {
              const label = TYPE_LABELS[type];
              const active = filters.type === type;
              return (
                <button
                  key={type}
                  style={active ? pillActive : pillBase}
                  onClick={() => onFilterChange({ ...filters, type })}
                  aria-pressed={active}
                >
                  {label ? (isHe ? label.he : label.en) : type}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Team filter */}
      {availableTeams.length > 1 && (
        <div>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.22em] mb-2"
            style={{ color: 'rgba(200,162,75,0.55)' }}
          >
            {isHe ? 'קבוצה' : 'Team'}
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
            {/* "All teams" */}
            <button
              style={filters.team === '' ? pillActive : pillBase}
              onClick={() => onFilterChange({ ...filters, team: '' })}
              aria-pressed={filters.team === ''}
            >
              {isHe ? 'כל הקבוצות' : 'All Teams'}
            </button>

            {availableTeams.map((team) => {
              const active = filters.team === team;
              return (
                <button
                  key={team}
                  style={active ? pillActive : pillBase}
                  onClick={() => onFilterChange({ ...filters, team })}
                  aria-pressed={active}
                >
                  {team}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={() => onFilterChange({ type: 'all', team: '', season: '' })}
          className="text-xs font-medium hover:underline transition-colors"
          style={{ color: 'var(--flare)' }}
        >
          {isHe ? 'נקה סינון' : 'Clear Filters'}
        </button>
      )}
    </aside>
  );
}
