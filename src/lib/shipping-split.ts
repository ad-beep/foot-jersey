import type { CartItem, JerseyType } from '@/types';
import { PRICES, SHIPPING_POLICY } from '@/lib/constants';

// Second-hand jerseys ship from our warehouse in Israel; everything else
// ships from the international supplier. Orders containing both must be
// split into two independently-shipped legs.
export type ShippingSource = 'local' | 'international';

export function sourceForType(type: JerseyType | undefined): ShippingSource {
  return type === 'second_hand' ? 'local' : 'international';
}

export function sourceForItem(item: CartItem): ShippingSource {
  return sourceForType(item.jersey?.type);
}

export interface ShipmentLeg {
  source: ShippingSource;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  freeShipping: boolean;
}

// Build a per-source leg from a filtered item list.
function buildLeg(source: ShippingSource, items: CartItem[]): ShipmentLeg {
  const itemCount = items.reduce((n, it) => n + it.quantity, 0);
  const subtotal = items.reduce((s, it) => s + it.totalPrice * it.quantity, 0);
  const freeShipping = itemCount >= SHIPPING_POLICY.freeShippingMinItems;
  const shipping = itemCount === 0 || freeShipping ? 0 : PRICES.shippingFlat;
  return { source, items, itemCount, subtotal, shipping, freeShipping };
}

// Always returns two legs (local first, international second) even if one is empty —
// callers can check `itemCount > 0` to decide whether to render. When only one
// source is present, `hasSplit` is false and the UI renders a single summary.
export interface SplitResult {
  legs: ShipmentLeg[];          // only legs with itemCount > 0
  hasSplit: boolean;            // true if both sources have items
  subtotal: number;             // grand subtotal (sum of legs)
  shipping: number;             // grand shipping (sum of legs)
  itemCount: number;            // grand item count
}

export function splitCart(items: CartItem[]): SplitResult {
  const local = items.filter((it) => sourceForItem(it) === 'local');
  const international = items.filter((it) => sourceForItem(it) === 'international');

  const legs: ShipmentLeg[] = [];
  if (local.length) legs.push(buildLeg('local', local));
  if (international.length) legs.push(buildLeg('international', international));

  const subtotal = legs.reduce((s, l) => s + l.subtotal, 0);
  const shipping = legs.reduce((s, l) => s + l.shipping, 0);
  const itemCount = legs.reduce((n, l) => n + l.itemCount, 0);
  const hasSplit = local.length > 0 && international.length > 0;

  return { legs, hasSplit, subtotal, shipping, itemCount };
}

// Bilingual labels for the two legs — used in cart, checkout, confirmation, admin.
export const SHIPMENT_LEG_LABELS: Record<ShippingSource, { en: { title: string; sub: string }; he: { title: string; sub: string } }> = {
  local: {
    en: { title: 'Second Hand — ships from Israel', sub: 'Pre-loved jerseys · 2–3 business days' },
    he: { title: 'יד שנייה — נשלח מישראל', sub: 'חולצות יד שנייה · 2–3 ימי עסקים' },
  },
  international: {
    en: { title: 'New Jerseys — ships from supplier', sub: 'International fulfilment · 14–21 business days' },
    he: { title: 'חולצות חדשות — נשלח מהספק', sub: 'משלוח בינלאומי · 14–21 ימי עסקים' },
  },
};

// Top-level explanation for when both legs are present. Used on cart page,
// checkout summary, and order confirmation so the buyer never feels surprised.
export const SPLIT_SHIPMENT_NOTICE = {
  en: {
    title: 'Your order ships in two parts',
    body: 'Pre-loved items ship from our Israel warehouse within 2–3 business days. New jerseys ship from our international supplier in 14–21 business days. You pay once — both shipments are included. You\'ll get a separate tracking update for each.',
  },
  he: {
    title: 'ההזמנה שלך תגיע בשני משלוחים',
    body: 'פריטי יד שנייה נשלחים מהמחסן שלנו בישראל תוך 2–3 ימי עסקים. חולצות חדשות נשלחות מהספק הבינלאומי תוך 14–21 ימי עסקים. משלמים פעם אחת — שני המשלוחים כלולים. תקבל עדכון מעקב נפרד לכל משלוח.',
  },
} as const;
