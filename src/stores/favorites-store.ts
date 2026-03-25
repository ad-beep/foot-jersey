'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],

      toggleFavorite: (id) => {
        const current = get().favoriteIds;
        if (current.includes(id)) {
          set({ favoriteIds: current.filter((fId) => fId !== id) });
        } else {
          set({ favoriteIds: [...current, id] });
        }
      },

      isFavorite: (id) => get().favoriteIds.includes(id),

      clearFavorites: () => set({ favoriteIds: [] }),
    }),
    {
      name: 'foot-jersey-favorites',
    }
  )
);
