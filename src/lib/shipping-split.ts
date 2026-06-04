import type { CartItem } from '@/types';
import { PRICES, SHIPPING_POLICY } from '@/lib/constants';

// All jerseys ship as a single shipment from our supplier. Shipping is a flat
// fee per order, waived once the order reaches the free-shipping item threshold.
export interface CartSummary {
  itemCount: number;
  subtotal: number;
  shipping: number;
  freeShipping: boolean;
}

export function summarizeCart(items: CartItem[]): CartSummary {
  const itemCount = items.reduce((n, it) => n + it.quantity, 0);
  const subtotal = items.reduce((s, it) => s + it.totalPrice * it.quantity, 0);
  const freeShipping = itemCount >= SHIPPING_POLICY.freeShippingMinItems;
  const shipping = itemCount === 0 || freeShipping ? 0 : PRICES.shippingFlat;
  return { itemCount, subtotal, shipping, freeShipping };
}
