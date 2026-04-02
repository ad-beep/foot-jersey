'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, CartCustomization, Jersey, Size } from '@/types';
import { calculateCustomizationPrice } from '@/lib/utils';

// Safe localStorage wrapper — silently handles quota exceeded and private browsing
const safeLocalStorage = {
  getItem: (name: string): string | null => {
    try { return localStorage.getItem(name); } catch { return null; }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {
      console.warn('[CartStore] localStorage unavailable — cart will not persist this session');
    }
  },
  removeItem: (name: string): void => {
    try { localStorage.removeItem(name); } catch { /* silent */ }
  },
};

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (jersey: Jersey, size: Size, customization?: Partial<CartCustomization>) => void;
  removeItem: (jerseyId: string, size: Size, customization: CartCustomization) => void;
  updateQuantity: (jerseyId: string, size: Size, customization: CartCustomization, quantity: number) => void;
  updateCustomization: (jerseyId: string, size: Size, oldCustomization: CartCustomization, customization: Partial<CartCustomization>) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

const defaultCustomization: CartCustomization = {
  customName: '',
  customNumber: '',
  hasPatch: false,
  patchText: '',
  hasPants: false,
  isPlayerVersion: false,
};

function computeItemPrice(jersey: Jersey, customization: CartCustomization): number {
  const base = jersey.price;
  const extras = calculateCustomizationPrice({
    hasNameNumber: !!(customization.customName || customization.customNumber),
    hasPatch: customization.hasPatch,
    hasPants: customization.hasPants,
    isPlayerVersion: customization.isPlayerVersion,
  });
  return base + extras;
}

function customizationsMatch(a: CartCustomization, b: CartCustomization): boolean {
  return (
    a.customName === b.customName &&
    a.customNumber === b.customNumber &&
    a.hasPatch === b.hasPatch &&
    a.patchText === b.patchText &&
    a.hasPants === b.hasPants &&
    a.isPlayerVersion === b.isPlayerVersion
  );
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (jersey, size, customization = {}) => {
        const merged = { ...defaultCustomization, ...customization };
        const existingIndex = get().items.findIndex(
          (item) =>
            item.jerseyId === jersey.id &&
            item.size === size &&
            customizationsMatch(item.customization, merged)
        );

        if (existingIndex >= 0) {
          // Identical customization — increment quantity up to max 10
          const items = [...get().items];
          if (items[existingIndex].quantity < 10) items[existingIndex].quantity += 1;
          set({ items, isOpen: true });
        } else {
          // Different customization or new item — add as separate line item
          set({
            items: [
              ...get().items,
              {
                jerseyId: jersey.id,
                jersey,
                size,
                quantity: 1,
                customization: merged,
                totalPrice: computeItemPrice(jersey, merged),
              },
            ],
            isOpen: true,
          });
        }
      },

      removeItem: (jerseyId, size, customization) => {
        set({
          items: get().items.filter(
            (item) =>
              !(
                item.jerseyId === jerseyId &&
                item.size === size &&
                customizationsMatch(item.customization, customization)
              )
          ),
        });
      },

      updateQuantity: (jerseyId, size, customization, quantity) => {
        if (quantity <= 0) {
          get().removeItem(jerseyId, size, customization);
          return;
        }
        const clamped = Math.min(quantity, 10);
        set({
          items: get().items.map((item) =>
            item.jerseyId === jerseyId &&
            item.size === size &&
            customizationsMatch(item.customization, customization)
              ? { ...item, quantity: clamped }
              : item
          ),
        });
      },

      updateCustomization: (jerseyId, size, oldCustomization, customization) => {
        set({
          items: get().items.map((item) => {
            if (
              item.jerseyId === jerseyId &&
              item.size === size &&
              customizationsMatch(item.customization, oldCustomization)
            ) {
              const merged = { ...item.customization, ...customization };
              return {
                ...item,
                customization: merged,
                totalPrice: computeItemPrice(item.jersey, merged),
              };
            }
            return item;
          }),
        });
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      setCartOpen: (open) => set({ isOpen: open }),

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      getSubtotal: () =>
        get().items.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0),
      getTotal: () => get().getSubtotal(),
    }),
    {
      name: 'foot-jersey-cart',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Multi-tab cart sync: when another tab writes to localStorage, update this tab's state
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'foot-jersey-cart' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed?.state?.items) {
          useCartStore.setState({ items: parsed.state.items });
        }
      } catch { /* ignore parse errors */ }
    }
  });
}
