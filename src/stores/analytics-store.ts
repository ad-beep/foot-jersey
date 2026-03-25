'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ViewData {
  count: number;
  totalTime: number;
  lastViewed: number;
}

interface RecentInteraction {
  jerseyId: string;
  type: 'view' | 'like' | 'cart' | 'purchase';
  timestamp: number;
}

interface AnalyticsStore {
  views: Record<string, ViewData>;
  likes: string[];
  cartAdds: Record<string, number>;
  purchases: Record<string, number>;
  searches: string[];
  searchMatches: Record<string, number>;
  recentInteractions: RecentInteraction[];

  // Actions
  recordView: (jerseyId: string, timeSpent: number) => void;
  recordCartAdd: (jerseyId: string) => void;
  recordPurchase: (jerseyId: string) => void;
  recordSearch: (query: string) => void;
  recordSearchMatches: (jerseyIds: string[]) => void;
  recordInteraction: (jerseyId: string, type: 'view' | 'like' | 'cart' | 'purchase') => void;
  setLikes: (likes: string[]) => void;

  // Computed
  getScore: (jerseyId: string) => number;
  getRecommendedIds: (allJerseyIds: string[], limit: number) => string[];
  getRecentlyViewed: (limit: number) => string[];
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      views: {},
      likes: [],
      cartAdds: {},
      purchases: {},
      searches: [],
      searchMatches: {},
      recentInteractions: [],

      recordView: (jerseyId: string, timeSpent: number) => {
        set((state) => {
          const existing = state.views[jerseyId];
          return {
            views: {
              ...state.views,
              [jerseyId]: {
                count: (existing?.count ?? 0) + 1,
                totalTime: (existing?.totalTime ?? 0) + timeSpent,
                lastViewed: Date.now(),
              },
            },
            recentInteractions: [
              {
                jerseyId,
                type: 'view' as const,
                timestamp: Date.now(),
              },
              ...state.recentInteractions,
            ].slice(0, 100),
          };
        });
      },

      recordCartAdd: (jerseyId: string) => {
        set((state) => ({
          cartAdds: {
            ...state.cartAdds,
            [jerseyId]: (state.cartAdds[jerseyId] ?? 0) + 1,
          },
          recentInteractions: [
            {
              jerseyId,
              type: 'cart' as const,
              timestamp: Date.now(),
            },
            ...state.recentInteractions,
          ].slice(0, 100),
        }));
      },

      recordPurchase: (jerseyId: string) => {
        set((state) => ({
          purchases: {
            ...state.purchases,
            [jerseyId]: (state.purchases[jerseyId] ?? 0) + 1,
          },
          recentInteractions: [
            {
              jerseyId,
              type: 'purchase' as const,
              timestamp: Date.now(),
            },
            ...state.recentInteractions,
          ].slice(0, 100),
        }));
      },

      recordSearch: (query: string) => {
        set((state) => ({
          searches: [query, ...state.searches].slice(0, 50),
        }));
      },

      recordSearchMatches: (jerseyIds: string[]) => {
        set((state) => {
          const next = { ...state.searchMatches };
          for (const id of jerseyIds) {
            next[id] = (next[id] ?? 0) + 1;
          }
          return { searchMatches: next };
        });
      },

      recordInteraction: (jerseyId: string, type: 'view' | 'like' | 'cart' | 'purchase') => {
        set((state) => ({
          recentInteractions: [
            {
              jerseyId,
              type,
              timestamp: Date.now(),
            },
            ...state.recentInteractions,
          ].slice(0, 100),
        }));
      },

      setLikes: (likes: string[]) => {
        set({ likes });
      },

      getScore: (jerseyId: string) => {
        const state = get();
        const views = state.views[jerseyId]?.count ?? 0;
        const likes = state.likes.includes(jerseyId) ? 1 : 0;
        const cartAdds = state.cartAdds[jerseyId] ?? 0;
        const purchases = state.purchases[jerseyId] ?? 0;
        const searchMatch = Math.min(state.searchMatches[jerseyId] ?? 0, 5);

        return views * 1 + likes * 4 + cartAdds * 5 + purchases * 8 + searchMatch * 3;
      },

      getRecommendedIds: (allJerseyIds: string[], limit: number) => {
        const state = get();
        const now = Date.now();
        const recencyWindow = 30 * 24 * 60 * 60 * 1000; // 30 days

        // Calculate scores with recency boost
        const scored = allJerseyIds
          .filter((id) => !state.purchases[id]) // Exclude already purchased
          .map((id) => {
            const baseScore = get().getScore(id);
            const lastViewed = state.views[id]?.lastViewed ?? 0;
            const daysAgo = lastViewed > 0 ? (now - lastViewed) / (24 * 60 * 60 * 1000) : 999;
            const recencyBoost = Math.max(0, 1 - daysAgo / 30);

            return {
              id,
              score: baseScore + recencyBoost * 2,
            };
          })
          .sort((a, b) => b.score - a.score);

        return scored.slice(0, limit).map((item) => item.id);
      },

      getRecentlyViewed: (limit: number) => {
        const state = get();
        return Object.entries(state.views)
          .sort(([, a], [, b]) => b.lastViewed - a.lastViewed)
          .slice(0, limit)
          .map(([id]) => id);
      },
    }),
    {
      name: 'fj-analytics',
    }
  )
);
