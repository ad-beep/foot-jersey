# Three-Button Checkout — Bit, Credit/Debit Card, Official PayPal

**Date:** 2026-06-02
**Scope:** FootJersey only (`foot-jersey/`)
**Status:** Approved (design + visual mockup confirmed by owner)

---

## Background / Evidence

- PayPal **Advanced Card Fields (ACDC / embedded on-site card form)** is **not available** for this Israeli merchant account. It returned `INVALID_EXP` on every attempt (0 successes in 10+ orders). Confirmed in code + commit history. **We will not attempt embedded card fields.**
- Verified via live PayPal API: an order created with `payment_source.paypal.experience_context.landing_page = 'GUEST_CHECKOUT'` redirects **straight to PayPal's hosted card-entry form** (owner opened the test URL and confirmed it lands on the card form, not the login wall). This is the supported, working way to accept cards for an Israeli account.
- Verified via the live Orders sheet + PayPal lookups: the 15 most recent "paypal" orders were **PayPal-account (wallet) payments, not guest card** (CARD=0, balance=15). So the official, recognizable PayPal button matters for the converting segment. A dedicated card button is a **growth bet** for the no-PayPal majority.

## Goal

Replace the current 2-button checkout (Bit + one generic "PayPal / Credit Card" button) with **3 distinct buttons**:

1. **Bit** — unchanged.
2. **Credit / Debit Card** — black & white, with VISA + Mastercard marks. Redirects straight to PayPal's hosted **card form** (guest checkout).
3. **PayPal** — the **real official PayPal SDK button** (recognizable blue), normal PayPal account/login flow.

Order on screen: Bit → Card → PayPal (owner-specified).

---

## Architecture & Data Flow

### ② Credit / Debit Card button  (redirect flow — reuses existing pattern)
- New `handleCardClick` in `cart/client.tsx`. Mirrors the existing `handlePayPalClick`, with two differences:
  - The stored `paypal_pending.payload.paymentMethod = 'card'` (so the order saves as `card`).
  - Calls `/api/paypal/create-order` with `preferCard: true`.
- `/api/paypal/create-order` gains an optional `preferCard` flag. When true, it builds the order with
  `payment_source.paypal.experience_context` (`landing_page: 'GUEST_CHECKOUT'`, `user_action: 'PAY_NOW'`,
  `return_url`, `cancel_url`, and shipping) **instead of** `application_context` (the two must not be combined).
  When false/absent: existing behavior is unchanged.
- On return to `/cart?token=...`, the **existing return-handler `useEffect`** captures and saves the order
  (it already reads `paypal_pending` and posts to `/api/orders`). No change needed there beyond the payload
  already carrying `paymentMethod: 'card'`.

### ③ PayPal button  (official SDK button — in-context flow)
- New focused component `src/components/payment/PayPalButton.tsx` using `@paypal/react-paypal-js`:
  - `PayPalScriptProvider` options: `clientId` (NEXT_PUBLIC), `currency: 'ILS'`, `intent: 'capture'`,
    `disable-funding: 'card,paylater'` (so the SDK never renders the broken ACDC card button).
  - `PayPalButtons` with `fundingSource="paypal"`, official blue style.
  - `createOrder` → `POST /api/paypal/create-order` (no `preferCard`; normal login/account flow) using
    `amount` + `shippingAddress`. Runs `validate()` first; if invalid, shows field errors + toast and aborts.
  - `onApprove` → `POST /api/paypal/capture-order` → on COMPLETED, calls `onSuccess(orderId)`.
- In `cart/client.tsx`, `onSuccess` from the PayPal button calls the existing `saveOrder({ method: 'paypal', paypalOrderId })`
  then clears the cart and routes to `/order-confirmed` (same as the Bit success path).

### ① Bit
- Unchanged. `handleBitClick` → existing `BitPayment` flow.

---

## Files Touched

| File | Change |
|------|--------|
| `src/app/[locale]/cart/client.tsx` | Replace the single PayPal button with **Card** + **PayPal** buttons; add `handleCardClick`; render `<PayPalButton>`; wire its `onSuccess` to `saveOrder('paypal')`. |
| `src/app/api/paypal/create-order/route.ts` | Add optional `preferCard` → use `experience_context.landing_page='GUEST_CHECKOUT'`. Default path unchanged. |
| `src/components/payment/PayPalButton.tsx` | **New** — official PayPal SDK button (fundingSource paypal, card funding disabled). |

No backend/order-schema changes: `/api/orders` already accepts `paymentMethod: 'bit' | 'paypal' | 'card'`.

---

## Visual

Per the approved mockup (`checkout-preview.html`): site dark theme; Card button white bg / black text with VISA + Mastercard marks; PayPal button = real official blue SDK button. Hebrew (RTL) and English both supported using existing `isHe` strings.

---

## Error Handling

- Card button: existing redirect-return error handling applies (capture failure, ORDER_NOT_APPROVED = silent cancel, order-save failure surfaces `paymentError`).
- PayPal button: invalid form → toast + field errors, abort before order creation. Capture failure → `onError` shows `paymentError`. Card funding disabled so no ACDC path can be reached.

## Testing / Done criteria

1. `npm run build` passes (no type/lint errors).
2. Visual matches the approved mockup in both locales.
3. **Live verification before considering done:** a real ₪2 order through **each** of Card and PayPal completes and appears in the Orders sheet with the correct `paymentMethod`. (Owner performs the live card/PayPal test; Bit unchanged.)

## Out of Scope

- Embedded on-site card fields (ACDC — not possible for Israel).
- Israeli card processor (Tranzila/PayPlus) — separate future project.
- Apple Pay / Google Pay.
- ShirtKicks.

## Deploy Gating

Per owner instruction, this must **not** go live until the owner has tested it. Implementation will be committed but **push to `main` (which auto-deploys via Vercel) is gated on owner approval** after a local/preview check.
