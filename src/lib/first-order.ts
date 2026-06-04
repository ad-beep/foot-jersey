import { getAdminDb } from '@/lib/firebase-admin';

// Codes that are only valid on a customer's very first order. STAY10 is the
// exit-intent "welcome" code. Add more codes here if needed later.
const FIRST_ORDER_ONLY_CODES = ['STAY10'];

export function isFirstOrderOnlyCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return FIRST_ORDER_ONLY_CODES.includes(code.toUpperCase().trim());
}

/**
 * True if this email has ANY prior order (paid or pending). Used to gate
 * first-order-only discount codes.
 *
 * Uses the Admin SDK because the `orders` collection is not readable by the
 * unauthenticated client SDK (security rules) — a plain client read throws
 * permission-denied. Orders store the email exactly as the customer typed it
 * and were never normalized, so we check both the trimmed value and lowercased.
 *
 * Fail-open: if the read errors we return false, so a genuine first-time
 * customer is never blocked from their discount over an infrastructure hiccup.
 */
export async function hasPreviousOrder(email: string): Promise<boolean> {
  const trimmed = (email || '').trim();
  if (!trimmed) return false;

  const variants = Array.from(new Set([trimmed, trimmed.toLowerCase()]));
  try {
    const db = getAdminDb();
    for (const value of variants) {
      const snap = await db.collection('orders').where('shippingInfo.email', '==', value).limit(1).get();
      if (!snap.empty) return true;
    }
    return false;
  } catch (err) {
    console.error('[first-order] hasPreviousOrder check failed — failing open:', err);
    return false;
  }
}
