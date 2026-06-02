# PayPal ACDC Card Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an embedded "Credit Card" payment option to FootJersey checkout using PayPal's Advanced Credit and Debit Card (ACDC) integration.

**Architecture:** A new `/api/paypal/client-token` endpoint mints a short-lived PayPal identity token server-side. The `CardPayment` component fetches that token then renders a `PayPalScriptProvider` (with `components=card-fields`) wrapping a `PayPalCardFieldsProvider` which hosts the card iframes. The payment flow reuses the existing `/api/paypal/create-order` and `/api/paypal/capture-order` routes unchanged. Card data never touches FootJersey's server.

**Tech Stack:** Next.js 14 App Router, TypeScript, `@paypal/react-paypal-js@9.0.2` (already installed), PayPal REST API v2.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/payment/PayPalProvider.tsx` | **Delete** | Dead file with conflicting `enable-funding:card` flag |
| `src/app/api/paypal/client-token/route.ts` | **Create** | Mint PayPal identity token for Card Fields SDK |
| `src/components/payment/CardPayment.tsx` | **Create** | Embedded card fields component |
| `src/components/payment/PaymentMethodSelector.tsx` | **Edit** | Add `'card'` type, rename PayPal tile, add Credit Card tile, 3-col grid |
| `src/app/[locale]/cart/client.tsx` | **Edit** | Import `CardPayment`, add `'card'` branch in payment form |
| `src/app/api/orders/route.ts` | **Edit** | Accept `'card'` as valid `paymentMethod`; include card in PayPal verification |

---

### Task 1: Delete the dead PayPalProvider file

**Files:**
- Delete: `src/components/payment/PayPalProvider.tsx`

- [ ] **Step 1: Delete the file**

```bash
cd foot-jersey
rm src/components/payment/PayPalProvider.tsx
```

- [ ] **Step 2: Verify nothing imports it**

```bash
grep -r "PayPalProvider" src/ --include="*.tsx" --include="*.ts"
```
Expected: no output (the file only referenced itself).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove dead PayPalProvider file"
```

---

### Task 2: Create the client-token API endpoint

**Files:**
- Create: `src/app/api/paypal/client-token/route.ts`

- [ ] **Step 1: Create the file with this exact content**

```typescript
import { NextResponse } from 'next/server';

const PAYPAL_API_BASE = 'https://api.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('PayPal credentials not configured');
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Failed to get PayPal access token');
  return (await res.json()).access_token;
}

export async function GET() {
  try {
    const accessToken = await getPayPalAccessToken();
    const res = await fetch(`${PAYPAL_API_BASE}/v1/identity/generate-token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('[client-token] PayPal error:', error);
      return NextResponse.json(
        { error: 'Failed to generate client token' },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json({ clientToken: data.client_token });
  } catch (error) {
    console.error('[client-token] Error:', error);
    return NextResponse.json({ error: 'Failed to generate client token' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/paypal/client-token/route.ts
git commit -m "feat: add PayPal client-token endpoint for ACDC card fields"
```

---

### Task 3: Create the CardPayment component

**Files:**
- Create: `src/components/payment/CardPayment.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  PayPalScriptProvider,
  PayPalCardFieldsProvider,
  PayPalCardFieldsForm,
  usePayPalCardFields,
} from '@paypal/react-paypal-js';
import { AlertCircle, Loader2, Lock } from 'lucide-react';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

export interface CardPaymentProps {
  amount: number;
  isHe: boolean;
  shippingAddress?: ShippingAddress;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

// Must live inside PayPalCardFieldsProvider to access usePayPalCardFields
function SubmitButton({
  isHe,
  submitting,
  onSubmit,
}: {
  isHe: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const { cardFieldsForm } = usePayPalCardFields();

  const handleClick = async () => {
    if (!cardFieldsForm || submitting) return;
    onSubmit();
    try {
      await cardFieldsForm.submit();
    } catch {
      // errors surface via onError on PayPalCardFieldsProvider
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={submitting || !cardFieldsForm}
      className="w-full py-4 rounded-xl font-bold text-base text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-4"
      style={{ backgroundColor: 'var(--cta)' }}
    >
      {submitting ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <Lock className="w-4 h-4" />
          {isHe ? 'שלם עכשיו' : 'Pay Now'}
        </>
      )}
    </button>
  );
}

function CardFieldsContent({
  amount,
  isHe,
  shippingAddress,
  onSuccess,
  onError,
}: CardPaymentProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isCapturing = useRef(false);

  const cardStyle = {
    input: {
      color: 'white',
      'font-size': '14px',
      'font-family': 'inherit',
    },
    '.invalid': { color: '#FF4D6D' },
    '::placeholder': { color: 'rgba(255,255,255,0.3)' },
  };

  const handleCreateOrder = useCallback(async () => {
    const res = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount.toFixed(2), shippingAddress }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create order');
    }
    return (await res.json()).orderId;
  }, [amount, shippingAddress]);

  const handleApprove = useCallback(
    async (data: { orderID: string }) => {
      if (isCapturing.current) return;
      isCapturing.current = true;
      try {
        const res = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderID }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to capture payment');
        }
        onSuccess((await res.json()).orderId);
      } catch (err) {
        isCapturing.current = false;
        setSubmitting(false);
        const message = err instanceof Error ? err.message : 'Payment failed';
        setErrorMessage(message);
        onError(message);
      }
    },
    [onSuccess, onError]
  );

  const handleError = useCallback(
    (err: Record<string, unknown>) => {
      isCapturing.current = false;
      setSubmitting(false);
      const message = (err.message as string) || 'Payment failed';
      setErrorMessage(message);
      onError(message);
    },
    [onError]
  );

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          className="p-3 rounded-lg flex items-start gap-2"
          style={{ backgroundColor: 'rgba(255,77,109,0.1)' }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FF4D6D' }} />
          <p className="text-sm" style={{ color: '#FF4D6D' }}>
            {errorMessage}
          </p>
        </div>
      )}

      <PayPalCardFieldsProvider
        createOrder={handleCreateOrder}
        onApprove={handleApprove}
        onError={handleError}
        style={cardStyle}
      >
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
        >
          <PayPalCardFieldsForm />
        </div>
        <SubmitButton
          isHe={isHe}
          submitting={submitting}
          onSubmit={() => setSubmitting(true)}
        />
      </PayPalCardFieldsProvider>

      <p
        className="text-center text-xs flex items-center justify-center gap-1.5"
        style={{ color: 'var(--text-muted)' }}
      >
        <Lock className="w-3 h-3" />
        {isHe
          ? 'פרטי הכרטיס מאובטחים דרך PayPal. לא נשמרים אצלנו.'
          : 'Card details secured by PayPal — never stored on our servers.'}
      </p>
    </div>
  );
}

export function CardPayment(props: CardPaymentProps) {
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/paypal/client-token')
      .then((res) => res.json())
      .then((data) => {
        if (data.clientToken) {
          setClientToken(data.clientToken);
        } else {
          setTokenError(
            props.isHe ? 'שגיאה בטעינת טופס הכרטיס' : 'Failed to load card form'
          );
        }
      })
      .catch(() =>
        setTokenError(
          props.isHe ? 'שגיאה בטעינת טופס הכרטיס' : 'Failed to load card form'
        )
      )
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--gold)' }} />
      </div>
    );
  }

  if (tokenError || !clientToken) {
    return (
      <div
        className="p-3 rounded-lg flex items-start gap-2"
        style={{ backgroundColor: 'rgba(255,77,109,0.1)' }}
      >
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FF4D6D' }} />
        <p className="text-sm" style={{ color: '#FF4D6D' }}>
          {tokenError}
        </p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
        currency: 'ILS',
        intent: 'capture',
        components: 'card-fields',
        'data-client-token': clientToken,
      }}
    >
      <CardFieldsContent {...props} />
    </PayPalScriptProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/payment/CardPayment.tsx
git commit -m "feat: add CardPayment component with PayPal ACDC card fields"
```

---

### Task 4: Update PaymentMethodSelector

**Files:**
- Modify: `src/components/payment/PaymentMethodSelector.tsx`

- [ ] **Step 1: Replace the entire file with this content**

```tsx
'use client';

import { Smartphone, Wallet, CreditCard, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export type PaymentMethod = 'bit' | 'paypal' | 'card';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  isHe: boolean;
  isRtl: boolean;
  disabled?: boolean;
}

const methods = [
  {
    id: 'bit' as PaymentMethod,
    labelEn: 'Bit',
    labelHe: 'Bit',
    descEn: 'Israeli P2P payment',
    descHe: 'העברה בנקאית ישראלית',
    icon: Smartphone,
  },
  {
    id: 'paypal' as PaymentMethod,
    labelEn: 'PayPal',
    labelHe: 'PayPal',
    descEn: 'Pay with your PayPal account',
    descHe: 'תשלום עם חשבון PayPal',
    icon: Wallet,
  },
  {
    id: 'card' as PaymentMethod,
    labelEn: 'Credit Card',
    labelHe: 'כרטיס אשראי',
    descEn: 'Visa, Mastercard, Amex',
    descHe: 'ויזה, מאסטרקארד, אמקס',
    icon: CreditCard,
  },
];

export function PaymentMethodSelector({
  selected,
  onSelect,
  isHe,
  isRtl,
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">
        {isHe ? 'בחר שיטת תשלום' : 'Select Payment Method'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.id;

          return (
            <motion.button
              key={method.id}
              onClick={() => !disabled && onSelect(method.id)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              className="relative p-4 rounded-xl transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isSelected
                  ? 'rgba(200,162,75,0.12)'
                  : 'rgba(255,255,255,0.03)',
                border: isSelected
                  ? '2px solid var(--gold)'
                  : '1px solid var(--border)',
              }}
            >
              {isSelected && (
                <motion.div
                  layoutId="payment-glow"
                  className="absolute inset-0 rounded-xl opacity-20"
                  style={{ backgroundColor: 'var(--cta)' }}
                  initial={false}
                  transition={{ duration: 0.3 }}
                />
              )}

              <div className="relative space-y-2">
                <div className="flex items-start justify-between">
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isSelected ? 'var(--gold)' : 'var(--text-muted)' }}
                  />
                  {isSelected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--gold)' }}
                    >
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: isSelected ? 'var(--gold)' : 'white' }}
                  >
                    {isHe ? method.labelHe : method.labelEn}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {isHe ? method.descHe : method.descEn}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div
        className="p-3 rounded-lg flex items-start gap-2"
        style={{ backgroundColor: 'rgba(200,162,75,0.06)', border: '1px solid rgba(200,162,75,0.15)' }}
      >
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {isHe
            ? 'כל שיטות התשלום מאובטחות והנתונים שלך מוגנים'
            : 'All payment methods are secure and encrypted'}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/payment/PaymentMethodSelector.tsx
git commit -m "feat: add Credit Card tile to payment method selector (3 tiles)"
```

---

### Task 5: Wire CardPayment into cart checkout

**Files:**
- Modify: `src/app/[locale]/cart/client.tsx`

- [ ] **Step 1: Add CardPayment import** — find the existing BitPayment import line:

```ts
import { BitPayment, type BitSenderDetails } from '@/components/payment/BitPayment';
```

Add this line directly after it:

```ts
import { CardPayment } from '@/components/payment/CardPayment';
```

- [ ] **Step 2: Add card branch in the payment form JSX** — find this block:

```tsx
            {paymentMethod === 'bit' ? (
              <BitPayment
                amount={finalTotal}
                isHe={isHe}
                isRtl={isRtl}
                onConfirm={handleBitConfirm}
                loading={submitting}
              />
            ) : (
              <PayPalPayment
                amount={finalTotal}
                isHe={isHe}
                isRtl={isRtl}
                shippingAddress={{
                  firstName: form.firstName,
                  lastName: form.lastName,
                  street: form.street,
                  city: form.city,
                  zip: form.zip,
                  country: form.country,
                  phone: form.phone,
                  email: form.email,
                }}
                onSuccess={(orderId) => handlePaymentSuccess(undefined, orderId)}
                onError={setPaymentError}
              />
            )}
```

Replace with:

```tsx
            {paymentMethod === 'bit' ? (
              <BitPayment
                amount={finalTotal}
                isHe={isHe}
                isRtl={isRtl}
                onConfirm={handleBitConfirm}
                loading={submitting}
              />
            ) : paymentMethod === 'card' ? (
              <CardPayment
                amount={finalTotal}
                isHe={isHe}
                shippingAddress={{
                  firstName: form.firstName,
                  lastName: form.lastName,
                  street: form.street,
                  city: form.city,
                  zip: form.zip,
                  country: form.country,
                  phone: form.phone,
                  email: form.email,
                }}
                onSuccess={(orderId) => handlePaymentSuccess(undefined, orderId)}
                onError={setPaymentError}
              />
            ) : (
              <PayPalPayment
                amount={finalTotal}
                isHe={isHe}
                isRtl={isRtl}
                shippingAddress={{
                  firstName: form.firstName,
                  lastName: form.lastName,
                  street: form.street,
                  city: form.city,
                  zip: form.zip,
                  country: form.country,
                  phone: form.phone,
                  email: form.email,
                }}
                onSuccess={(orderId) => handlePaymentSuccess(undefined, orderId)}
                onError={setPaymentError}
              />
            )}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/cart/client.tsx
git commit -m "feat: wire CardPayment into cart checkout flow"
```

---

### Task 6: Update orders API to accept card payment method

**Files:**
- Modify: `src/app/api/orders/route.ts`

- [ ] **Step 1: Update the `OrderData` interface** — find (around line 88):

```ts
  paymentMethod: 'bit' | 'paypal';
```

Replace with:

```ts
  paymentMethod: 'bit' | 'paypal' | 'card';
```

- [ ] **Step 2: Include card in PayPal payment verification** — find (around line 235):

```ts
    if (body.paymentMethod === 'paypal') {
```

Replace with:

```ts
    if (body.paymentMethod === 'paypal' || body.paymentMethod === 'card') {
```

Card orders go through PayPal's order/capture system identically to regular PayPal orders, so they need the same server-side capture verification, idempotency protection, and refund safety net.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat: accept card as valid paymentMethod with PayPal verification"
```

---

### Task 7: Update Vercel environment variables (manual step)

**This step cannot be done in code — you must do it in the Vercel dashboard.**

- [ ] **Step 1:** Go to Vercel → your FootJersey project → **Settings** → **Environment Variables**

- [ ] **Step 2:** Update `NEXT_PUBLIC_PAYPAL_CLIENT_ID` to the Client ID from your Expanded Checkout credentials (shared in session)

- [ ] **Step 3:** Update `PAYPAL_CLIENT_SECRET` to the Client Secret from your Expanded Checkout credentials (shared in session)

- [ ] **Step 4:** Make sure both are set for the **Production** environment

---

### Task 8: Push and verify

- [ ] **Step 1: Push all commits to trigger Vercel deploy**

```bash
git push
```

- [ ] **Step 2: Once deploy is live, test the full card flow**

1. Add any jersey to cart
2. Fill all required shipping fields
3. Click **"Proceed to Payment"**
4. Confirm you see **three tiles**: Bit | PayPal | Credit Card
5. Select **Credit Card**
6. Confirm card fields render (cardholder name, card number, expiry, CVV)
7. Enter a real card or a PayPal sandbox test card and pay
8. Confirm redirect to `/order-confirmed`
9. Confirm the order appears in Firebase with `paymentMethod: "card"` and `paymentStatus: "completed"`
10. Confirm the order appears in Google Sheets with `card` in the Payment Method column
