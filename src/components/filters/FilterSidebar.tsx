'use client';

import type { Jersey, FilterState } from '@/types';
import type { Dictionary } from '@/i18n/dictionaries';

interface FilterSidebarProps {
  jerseys: Jersey[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function FilterSidebar({
  jerseys,
  filters,
  onFilterChange,
}: FilterSidebarProps) {
  return <div>FilterSidebar Placeholder</div>;
}
