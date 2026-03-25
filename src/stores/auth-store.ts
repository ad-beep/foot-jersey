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
    }
  )
);
