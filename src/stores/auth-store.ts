'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Size, KidsSize, CartItem } from '@/types';

export interface ShippingAddress {
  id: string;
  fullName: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  savedSize: Size | null;
  savedKidsSize: KidsSize | null;
  newsletter: boolean;
  shippingAddresses: ShippingAddress[];
  orderHistory: OrderItem[];
}

interface AuthStore {
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
  updateDisplayName: (displayName: string) => void;
  setSavedSize: (size: Size) => void;
  setSavedKidsSize: (size: KidsSize) => void;
  setNewsletter: (enabled: boolean) => void;
  updateShippingAddress: (addressId: string, address: Omit<ShippingAddress, 'id'>) => void;
  addShippingAddress: (address: Omit<ShippingAddress, 'id'>) => void;
  removeShippingAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,

      setUser: (user: UserProfile) => set({ user }),

      clearUser: () => set({ user: null }),

      updateDisplayName: (displayName: string) =>
        set((state) => ({
          user: state.user ? { ...state.user, displayName } : null,
        })),

      setSavedSize: (size: Size) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                savedSize: size,
              }
            : null,
        })),

      setSavedKidsSize: (size: KidsSize) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, savedKidsSize: size }
            : null,
        })),

      setNewsletter: (enabled: boolean) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, newsletter: enabled }
            : null,
        })),

      updateShippingAddress: (addressId: string, address: Omit<ShippingAddress, 'id'>) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                shippingAddresses: state.user.shippingAddresses.map((addr) =>
                  addr.id === addressId ? { ...address, id: addressId } : addr
                ),
              }
            : null,
        })),

      addShippingAddress: (address: Omit<ShippingAddress, 'id'>) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                shippingAddresses: [
                  ...state.user.shippingAddresses,
                  {
                    id: `addr_${Date.now()}`,
                    ...address,
                  },
                ],
              }
            : null,
        })),

      removeShippingAddress: (addressId: string) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                shippingAddresses: state.user.shippingAddresses.filter(
                  (addr) => addr.id !== addressId
                ),
              }
            : null,
        })),

      setDefaultAddress: (addressId: string) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                shippingAddresses: state.user.shippingAddresses.map((addr) => ({
                  ...addr,
                  isDefault: addr.id === addressId,
                })),
              }
            : null,
        })),
    }),
    {
      name: 'fj-auth',
      // Only persist the minimal user identity fields needed to avoid a
      // loading flash on hydration.
      // SECURITY: shippingAddresses and orderHistory are intentionally excluded
      // from localStorage — they are always loaded fresh from Firestore via
      // onAuthStateChanged so they never leak to the browser storage layer.
      partialize: (state) =>
        state.user
          ? {
              user: {
                uid: state.user.uid,
                email: state.user.email,
                displayName: state.user.displayName,
                photoURL: state.user.photoURL,
                savedSize: state.user.savedSize,
                savedKidsSize: state.user.savedKidsSize,
                newsletter: state.user.newsletter,
                // shippingAddresses and orderHistory are NOT persisted to
                // localStorage — they are fetched from Firestore on auth init.
                shippingAddresses: [],
                orderHistory: [],
              },
            }
          : { user: null },
    }
  )
);
