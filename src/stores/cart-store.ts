'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartCustomization, Jersey, Size } from '@/types';
import { calculateCustomizationPrice } from '@/lib/utils';

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (jersey: Jersey, size: Size, customization?: Partial<CartCustomization>) => void;
  removeItem: (jerseyId: string, size: Size) => void;
  updateQuantity: (jerseyId: string, size: Size, quantity: number) => void;
  updateCustomization: (jerseyId: string, size: Size, customization: Partial<CartCustomization>) => void;
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

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (jersey, size, customization = {}) => {
        const merged = { ...defaultCustomization, ...customization };
        const existingIndex = get().items.findIndex(
          (item) => item.jerseyId === jersey.id && item.size === size
        );

        if (existingIndex >= 0) {
          const items = [...get().items];
          items[existingIndex].quantity += 1;
          items[existingIndex].customization = merged;
          items[existingIndex].totalPrice = computeItemPrice(jersey, merged);
          set({ items, isOpen: true });
        } else {
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

      removeItem: (jerseyId, size) => {
        set({
          items: get().items.filter(
            (item) => !(item.jerseyId === jerseyId && item.size === size)
          ),
        });
      },

      updateQuantity: (jerseyId, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(jerseyId, size);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.jerseyId === jerseyId && item.size === size
              ? { ...item, quantity }
              : item
          ),
        });
      },

      updateCustomization: (jerseyId, size, customization) => {
        set({
          items: get().items.map((item) => {
            if (item.jerseyId === jerseyId && item.size === size) {
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
      partialize: (state) => ({ items: state.items }),
    }
  )
);
