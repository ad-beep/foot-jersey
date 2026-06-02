# PayPal Expanded Checkout — Embedded Card Fields

**Date:** 2026-06-02  
**Scope:** FootJersey only (`foot-jersey/`)  
**Status:** Approved

---

## Overview

Add a native "Credit Card" payment option to the FootJersey checkout using PayPal's Advanced Credit and Debit Card (ACDC) integration via `@paypal/react-paypal-js`. Card fields render as PayPal-controlled iframes embedded on the page — customers see a native card form but raw card data never touches FootJersey's server (PCI DSS SAQ A compliant).

---

## Credentials & Security

- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` — already set in Vercel env vars (same value)
- `PAYPAL_CLIENT_SECRET` — update in Vercel env vars with the new ACDC-enabled secret
- **Nothing hardcoded.** The client secret is server-side only. The client token endpoint mints a short-lived token using the secret and returns only that token to the browser — the secret is never exposed.

---

## Architecture

### New: `/api/paypal/client-token` (GET)
Server-side endpoint. Fetches a PayPal identity/client token using server credentials. Returns `{ clientToken: string }`. This token is required by `PayPalCardFieldsProvider` to initialize the card fields SDK. Token is short-lived (~1 hour) and safe to expose to the browser.

### New: `src/components/payment/CardPayment.tsx`
Client component. Responsibilities:
- Fetches the client token from `/api/paypal/client-token` on mount
- Renders `PayPalCardFieldsProvider` (from `@paypal/react-paypal-js`) wrapping individual field components: card number, expiry, CVV, and cardholder name
- Renders a "Pay" submit button that calls `cardFields.submit()` on the provider
- On approval, calls the existing `/api/paypal/capture-order` route
- On success, calls `onSuccess(orderId)` — same interface as `PayPalPayment`
- On error, calls `onError(message)`

Card fields are styled to match the site's dark theme (dark background, gold focus ring, white text) via PayPal's `style` prop on each field.

### Updated: `src/components/payment/PaymentMethodSelector.tsx`
- Adds `'card'` to the `PaymentMethod` union type: `'bit' | 'paypal' | 'card'`
- Adds a third tile: "Credit Card / כרטיס אשראי" with a `CreditCard` icon (Lucide)
- Grid changes from `sm:grid-cols-2` to `sm:grid-cols-3` to accommodate three tiles
- All other tile logic (selected state, gold border, glow) unchanged

### Updated: `src/app/[locale]/cart/client.tsx`
- Default payment method stays `'bit'`
- Adds `'card'` branch in the payment form section alongside `'bit'` and `'paypal'`
- `handlePaymentSuccess` already accepts `paypalOrderId` — card flow calls it with the captured order ID, same as PayPal button flow
- No changes to `saveOrder` — card orders are saved with `paymentMethod: 'card'`, `paymentStatus: 'completed'`, `paypalOrderId`

### Updated: `src/app/api/orders/route.ts`
- Accepts `'card'` as a valid `paymentMethod` value (currently typed as `'bit' | 'paypal'`)
- No other changes — card orders verify via PayPal API exactly like PayPal button orders

---

## Data Flow

```
Customer fills card fields (PayPal iframes)
  → clicks Pay
  → CardPayment calls createOrder → /api/paypal/create-order (existing, unchanged)
  → PayPalCardFieldsProvider.submit() sends card data directly to PayPal servers
  → PayPal returns approval
  → CardPayment calls /api/paypal/capture-order (existing, unchanged)
  → capture succeeds → onSuccess(orderId)
  → cart/client.tsx calls saveOrder({ method: 'card', paypalOrderId })
  → order saved to Firebase + Google Sheets
  → redirect to /order-confirmed
```

---

## Error Handling

- Client token fetch failure: show an error message, do not render card fields
- Card validation errors (bad number, expired): PayPal's SDK surfaces these inline on the fields — no extra handling needed
- Capture failure: existing error handling in `handleApprove` applies unchanged
- Network errors: shown via existing `paymentError` state in cart client

---

## What Does Not Change

- BIT flow — untouched
- PayPal button flow — untouched (stays as "PayPal or Card" option for customers who prefer PayPal's hosted page)
- Order confirmation page — untouched
- Admin orders page — will show card orders as PayPal payments (same `paypalOrderId` field); funding source detection in capture route already handles `'card'` vs `'paypal'`
- Email confirmation — untouched
- ShirtKicks — untouched

---

## Files Touched

| File | Change |
|------|--------|
| `src/app/api/paypal/client-token/route.ts` | **New** — mints client token |
| `src/components/payment/CardPayment.tsx` | **New** — embedded card fields component |
| `src/components/payment/PaymentMethodSelector.tsx` | **Edit** — add 'card' type + third tile |
| `src/app/[locale]/cart/client.tsx` | **Edit** — add card branch in payment form |
| `src/app/api/orders/route.ts` | **Edit** — accept 'card' as payment method |
| `src/components/payment/PayPalProvider.tsx` | **Delete** — dead file, misleading |
| Vercel env vars | **Update** — new PAYPAL_CLIENT_SECRET value |

---

## Out of Scope

- ShirtKicks integration
- Saving card details / returning customer card support
- 3D Secure handling beyond what PayPal handles automatically
- Admin dashboard changes beyond what already works
