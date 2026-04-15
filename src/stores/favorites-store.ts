'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FavoritesState {
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
  /** Load favorites from Firestore for a logged-in user and merge with local. */
  syncFromFirestore: (uid: string) => Promise<void>;
  /** Persist the current favoriteIds to Firestore for a logged-in user. */
  persistToFirestore: (uid: string) => Promise<void>;
}

async function writeFavoritesToFirestore(uid: string, ids: string[]) {
  try {
    await setDoc(doc(db, 'users', uid), { favoriteIds: ids }, { merge: true });
  } catch (e) {
    console.error('[FavoritesStore] Firestore write error:', e);
  }
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],

      toggleFavorite: (id) => {
        const current = get().favoriteIds;
        const next = current.includes(id)
          ? current.filter((fId) => fId !== id)
          : [...current, id];
        set({ favoriteIds: next });
        // Persist to Firestore if the auth store has a logged-in user.
        // We read auth state lazily to avoid circular imports.
        try {
          // Dynamic import to avoid circular dependency
          const { useAuthStore } = require('@/stores/auth-store');
          const uid = useAuthStore.getState().user?.uid;
          if (uid) writeFavoritesToFirestore(uid, next);
        } catch {
          // No auth store available (e.g. SSR) — skip Firestore write
        }
      },

      isFavorite: (id) => get().favoriteIds.includes(id),

      clearFavorites: () => set({ favoriteIds: [] }),

      syncFromFirestore: async (uid) => {
        try {
          const docSnap = await getDoc(doc(db, 'users', uid));
          if (docSnap.exists()) {
            const remoteFavorites: string[] = docSnap.data()?.favoriteIds ?? [];
            // Merge: union of local (anonymous session) + remote (logged-in)
            const local = get().favoriteIds;
            const merged = Array.from(new Set([...local, ...remoteFavorites]));
            set({ favoriteIds: merged });
            // Write merged list back if local had extras
            if (merged.length > remoteFavorites.length) {
              await writeFavoritesToFirestore(uid, merged);
            }
          }
        } catch (e) {
          console.error('[FavoritesStore] Firestore sync error:', e);
        }
      },

      persistToFirestore: async (uid) => {
        await writeFavoritesToFirestore(uid, get().favoriteIds);
      },
    }),
    {
      name: 'foot-jersey-favorites',
    }
  )
);
