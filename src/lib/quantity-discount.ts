import { QUANTITY_DISCOUNT_TIERS } from '@/lib/constants';

// Highest qualifying discount % for a given jersey count (0 if none).
export function quantityDiscountPercent(itemCount: number): number {
  let pct = 0;
  for (const tier of QUANTITY_DISCOUNT_TIERS) {
    if (itemCount >= tier.minItems) pct = Math.max(pct, tier.percent);
  }
  return pct;
}

// Discount amount (₪) from the quantity ladder. Floored to whole shekels, the
// same way percentage codes are computed elsewhere.
export function quantityDiscountAmount(itemCount: number, subtotal: number): number {
  const pct = quantityDiscountPercent(itemCount);
  return pct > 0 ? Math.floor((subtotal * pct) / 100) : 0;
}

// The next tier the cart hasn't reached yet — used for the "add N more → X% off"
// progress nudge. Returns null once the top tier is reached.
export function nextQuantityTier(itemCount: number): { minItems: number; percent: number } | null {
  for (const tier of QUANTITY_DISCOUNT_TIERS) {
    if (itemCount < tier.minItems) return { minItems: tier.minItems, percent: tier.percent };
  }
  return null;
}
