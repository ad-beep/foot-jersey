# Order Confirmed Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/[locale]/order-confirmed?orderId=XXX` page that shows the customer their full order receipt after checkout, replacing the current redirect-to-home behaviour.

**Architecture:** A thin Next.js server page wrapper at `src/app/[locale]/order-confirmed/page.tsx` renders a single client component `client.tsx` that reads `orderId` from the URL search params, fetches the order document from Firestore, and renders the receipt UI. The cart client is updated so both `handlePaymentSuccess` and `handleBitConfirm` capture the orderId returned by `saveOrder` and immediately redirect to this page instead of the home page.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Firebase Firestore client SDK (`getDoc`), React hooks (`useSearchParams`, `useRouter`).

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/app/[locale]/order-confirmed/page.tsx` | Thin server wrapper (metadata + client mount) |
| Create | `src/app/[locale]/order-confirmed/client.tsx` | Full receipt UI, Firestore fetch |
| Modify | `src/app/[locale]/cart/client.tsx` | Redirect both success handlers to new page |

---

### Task 1: Create the order-confirmed page server wrapper

**Files:**
- Create: `src/app/[locale]/order-confirmed/page.tsx`

- [ ] **Step 1: Create `page.tsx`**

```typescript
// src/app/[locale]/order-confirmed/page.tsx
import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { OrderConfirmedClient } from './client';

export const metadata: Metadata = {
  title: `Order Confirmed | ${SITE_NAME}`,
};

export default function OrderConfirmedPage() {
  return <OrderConfirmedClient />;
}
```

- [ ] **Step 2: Verify file exists and Next.js can resolve it**

Run: `npm run build 2>&1 | grep -E "error|order-confirmed"`
Expected: No errors, route appears in build output as `ƒ /[locale]/order-confirmed` (or it compiles cleanly before client.tsx is created — add a placeholder client.tsx if needed).

---

### Task 2: Create the order-confirmed client component

**Files:**
- Create: `src/app/[locale]/order-confirmed/client.tsx`

This is the main UI. It reads `orderId` from search params, fetches the Firestore order document, and renders two variants: **confirmed** (PayPal/credit card) and **pending** (BIT awaiting approval).

- [ ] **Step 1: Create `client.tsx` with full implementation**

```typescript
// src/app/[locale]/order-confirmed/client.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLocale } from '@/hooks/useLocale';
import { Loader2, CheckCircle2, Clock, ShoppingBag } from 'lucide-react';

interface OrderItem {
  jerseyId: string;
  teamName: string;
  imageUrl: string;
  size: string;
  quantity: number;
  totalPrice: number;
  customization?: {
    customName?: string;
    customNumber?: string;
    patchText?: string;
    isPlayerVersion?: boolean;
    hasPants?: boolean;
  };
}

interface Order {
  id: string;
  orderNumber?: number;
  items: OrderItem[];
  shippingInfo: {
    name: string;
    phone: string;
    email: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    notes?: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  total: number;
  shipping: number;
  discountAmount?: number;
  discountCode?: string;
  currency: string;
  status: string;
  createdAt: Timestamp | null;
}

export function OrderConfirmedClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();
  const isHe = locale === 'he';

  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.replace(`/${locale}`);
      return;
    }
    getDoc(doc(db, 'orders', orderId)).then((snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() } as Order);
      } else {
        router.replace(`/${locale}`);
      }
      setLoading(false);
    });
  }, [orderId, locale, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a0a' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00c3d8' }} />
      </div>
    );
  }

  if (!order) return null;

  const isBit = order.paymentMethod === 'bit';
  const isPending = isBit && order.status === 'pending_bit_approval';
  const firstName = order.shippingInfo.name?.split(' ')[0] || order.shippingInfo.name;
  const orderRef = order.id.slice(0, 8).toUpperCase();

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '40px 16px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Nav */}
      <div style={{ maxWidth: 680, margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href={`/${locale}`} style={{ fontSize: 20, fontWeight: 800, color: '#fff', textDecoration: 'none' }}>
          Foot<span style={{ color: '#00c3d8' }}>Jersey</span>
        </a>
        <a href={`/${locale}/discover`} style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>
          {isHe ? '← המשך קנייה' : '← Continue Shopping'}
        </a>
      </div>

      {/* Card */}
      <div style={{ maxWidth: 680, margin: '0 auto', background: '#111', border: '1px solid #1e1e1e', borderRadius: 20, overflow: 'hidden' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,#0f1f20 0%,#0d1a1b 100%)', borderBottom: '1px solid #1e1e1e', padding: '40px 32px 36px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: isPending ? 'rgba(255,190,50,0.1)' : 'rgba(0,195,216,0.12)', border: `2px solid ${isPending ? 'rgba(255,190,50,0.3)' : 'rgba(0,195,216,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            {isPending
              ? <Clock style={{ width: 28, height: 28, color: '#FFBE32' }} />
              : <CheckCircle2 style={{ width: 28, height: 28, color: '#00c3d8' }} />
            }
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            {isPending
              ? (isHe ? 'ההזמנה התקבלה!' : 'Order Received!')
              : (isHe ? 'ההזמנה אושרה!' : 'Order Confirmed!')}
          </h1>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
            {isPending
              ? (isHe ? `תודה, ${firstName}! ממתינים לאישור תשלום BIT.` : `Thanks, ${firstName}! We're waiting to confirm your BIT payment.`)
              : (isHe ? `תודה, ${firstName}! התשלום בוצע בהצלחה.` : `Thanks, ${firstName}! Your payment was successful.`)}
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,195,216,0.08)', border: '1px solid rgba(0,195,216,0.2)', borderRadius: 100, padding: '6px 16px', fontSize: 13, fontFamily: 'monospace', color: '#00c3d8' }}>
            {isHe ? 'הזמנה' : 'Order'} #{orderRef}
            {order.orderNumber && <span style={{ color: '#555' }}> · #{order.orderNumber}</span>}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px' }}>

          {/* Email notice */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: isPending ? 'rgba(255,190,50,0.05)' : 'rgba(0,195,216,0.05)', border: `1px solid ${isPending ? 'rgba(255,190,50,0.12)' : 'rgba(0,195,216,0.12)'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: isPending ? '#a07820' : '#5aafb8' }}>
            <span>📧</span>
            <span>
              {isPending
                ? (isHe ? 'נשלח אליך אימייל עם פרטי ההמתנה' : 'A confirmation email has been sent to ')
                : (isHe ? 'הקבלה נשלחה ל-' : 'Receipt sent to ')}
              <strong style={{ color: isPending ? '#c99030' : '#7dd3d8' }}>{order.shippingInfo.email}</strong>
            </span>
          </div>

          {/* Items */}
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#444', marginBottom: 12 }}>
            {isHe ? 'פריטים' : 'Your Order'}
          </div>
          <div style={{ marginBottom: 24 }}>
            {order.items.map((item, i) => {
              const customParts: string[] = [];
              if (item.customization?.customName) customParts.push(`#${item.customization.customNumber || ''} ${item.customization.customName}`.trim());
              if (item.customization?.isPlayerVersion) customParts.push(isHe ? 'גרסת שחקן' : 'Player Version');
              if (item.customization?.patchText) customParts.push(item.customization.patchText);
              if (item.customization?.hasPants) customParts.push(isHe ? 'מכנסיים' : 'Pants');
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: i < order.items.length - 1 ? '1px solid #161616' : 'none' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: '#1a1a1a', border: '1px solid #222', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.teamName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <ShoppingBag style={{ width: 22, height: 22, color: '#444' }} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{item.teamName}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{isHe ? 'מידה' : 'Size'} {item.size} · ×{item.quantity}</div>
                    {customParts.length > 0 && (
                      <div style={{ fontSize: 12, color: '#00c3d8', marginTop: 2 }}>{customParts.join(' · ')}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>₪{item.totalPrice}</div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', padding: '4px 0' }}>
              <span>{isHe ? 'סכום ביניים' : 'Subtotal'}</span><span>₪{order.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', padding: '4px 0' }}>
              <span>{isHe ? 'משלוח' : 'Shipping'}</span>
              <span>{order.shipping === 0 ? (isHe ? 'חינם 🎉' : 'FREE 🎉') : `₪${order.shipping}`}</span>
            </div>
            {order.discountAmount && order.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#00c3d8', padding: '4px 0' }}>
                <span>{isHe ? 'הנחה' : 'Discount'} {order.discountCode ? `(${order.discountCode})` : ''}</span>
                <span>-₪{order.discountAmount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#fff', padding: '12px 0 4px', marginTop: 8, borderTop: '1px solid #1e1e1e' }}>
              <span>{isHe ? 'סה"כ ששולם' : 'Total Paid'}</span><span>₪{order.total}</span>
            </div>
          </div>

          {/* Shipping + Payment two-col */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#444', marginBottom: 8 }}>{isHe ? 'כתובת משלוח' : 'Ship To'}</div>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
                {order.shippingInfo.name}<br />
                {order.shippingInfo.street}, {order.shippingInfo.city}<br />
                {order.shippingInfo.zip}, {order.shippingInfo.country}
              </p>
            </div>
            <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#444', marginBottom: 8 }}>{isHe ? 'תשלום' : 'Payment'}</div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,195,216,0.08)', border: '1px solid rgba(0,195,216,0.15)', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#00c3d8' }}>
                  {isBit ? '⚡ BIT' : 'PayPal'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: isPending ? '#a07820' : '#888' }}>
                {isPending ? (isHe ? 'ממתין לאישור' : 'Awaiting approval') : (isHe ? 'אושר ונקלט' : 'Confirmed & captured')}
              </p>
            </div>
          </div>

          {/* What's next */}
          <div style={{ background: isPending ? 'rgba(255,190,50,0.04)' : 'rgba(0,195,216,0.04)', border: `1px solid ${isPending ? 'rgba(255,190,50,0.12)' : 'rgba(0,195,216,0.12)'}`, borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: isPending ? '#FFBE32' : '#00c3d8', marginBottom: 12 }}>
              {isHe ? 'מה קורה עכשיו?' : "What happens next"}
            </div>
            {(isPending ? [
              { n: 1, text: isHe ? <><strong style={{color:'#bbb'}}>אישור תשלום</strong> — נאמת את ההעברה שלך ב-BIT בתוך מספר שעות.</> : <><strong style={{color:'#bbb'}}>Payment verification</strong> — We'll confirm your BIT transfer within a few hours.</> },
              { n: 2, text: isHe ? <><strong style={{color:'#bbb'}}>אישור הזמנה</strong> — לאחר האישור תקבל אימייל עם פרטי ההזמנה המלאים.</> : <><strong style={{color:'#bbb'}}>Order confirmed</strong> — Once approved, you'll receive a second email with your full receipt.</> },
              { n: 3, text: isHe ? <><strong style={{color:'#bbb'}}>משלוח</strong> — הגופיות שלך נשלחות תוך 2–4 שבועות לאחר האישור.</> : <><strong style={{color:'#bbb'}}>Shipped</strong> — Your jerseys ship within 2–4 weeks after approval.</> },
            ] : [
              { n: 1, text: isHe ? <><strong style={{color:'#bbb'}}>הזמנה אושרה</strong> — קיבלנו את התשלום ומתחילים לעבוד.</> : <><strong style={{color:'#bbb'}}>Order confirmed</strong> — We've received your payment and are on it.</> },
              { n: 2, text: isHe ? <><strong style={{color:'#bbb'}}>הכנה</strong> — הגופיות שלך מודפסות ומוכנות. זה לוקח 2–4 שבועות.</> : <><strong style={{color:'#bbb'}}>Production</strong> — Your jerseys are printed and prepared. This takes 2–4 weeks.</> },
              { n: 3, text: isHe ? <><strong style={{color:'#bbb'}}>משלוח</strong> — תקבל אימייל עם פרטי מעקב כשהחבילה בדרך.</> : <><strong style={{color:'#bbb'}}>Shipped</strong> — You'll get a tracking email once your order is on the way.</> },
            ]).map(({ n, text }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: n < 3 ? 10 : 0 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: isPending ? 'rgba(255,190,50,0.15)' : 'rgba(0,195,216,0.15)', border: `1px solid ${isPending ? 'rgba(255,190,50,0.25)' : 'rgba(0,195,216,0.25)'}`, color: isPending ? '#FFBE32' : '#00c3d8', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{text}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12 }}>
            <a href={`/${locale}/discover`} style={{ flex: 1, textAlign: 'center', background: '#00c3d8', color: '#000', fontSize: 14, fontWeight: 700, padding: '13px 20px', borderRadius: 12, textDecoration: 'none', display: 'block' }}>
              {isHe ? 'המשך קנייה' : 'Continue Shopping'}
            </a>
          </div>

        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: '#333', marginTop: 24, paddingBottom: 8 }}>
        FootJersey · <a href={`/${locale}`} style={{ color: '#444', textDecoration: 'none' }}>shopfootjersey.com</a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run build to verify the page compiles**

```bash
npm run build 2>&1 | grep -E "error TS|Failed to compile|order-confirmed"
```
Expected: route appears as `ƒ /[locale]/order-confirmed` with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\[locale\]/order-confirmed/page.tsx src/app/\[locale\]/order-confirmed/client.tsx
git commit -m "feat: add order-confirmed page with full receipt UI"
```

---

### Task 3: Update cart client to redirect to order-confirmed page

**Files:**
- Modify: `src/app/[locale]/cart/client.tsx` — `handlePaymentSuccess` (line ~313) and `handleBitConfirm` (line ~338)

Currently both handlers discard the `orderId` returned by `saveOrder` and redirect to `/${locale}`. The fix is to capture the orderId and redirect to `/${locale}/order-confirmed?orderId=XXX`.

- [ ] **Step 1: Update `handlePaymentSuccess`**

Find this block (around line 313–336):
```typescript
const handlePaymentSuccess = useCallback(
  async (paymentIntentId?: string, paypalOrderId?: string) => {
    try {
      await saveOrder({ paymentIntentId, paypalOrderId, method: paymentMethod });
      setSuccess(true);
      clearCart();
      toast({
        title: isHe ? 'ההזמנה בוצעה בהצלחה!' : 'Order placed successfully!',
        variant: 'success',
      });

      setTimeout(() => {
        router.push(`/${locale}`);
      }, 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save order';
      setPaymentError(message);
      toast({ title: message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  },
  [saveOrder, clearCart, toast, isHe, router, locale, paymentMethod]
);
```

Replace with:
```typescript
const handlePaymentSuccess = useCallback(
  async (paymentIntentId?: string, paypalOrderId?: string) => {
    try {
      const result = await saveOrder({ paymentIntentId, paypalOrderId, method: paymentMethod });
      clearCart();
      router.push(`/${locale}/order-confirmed?orderId=${result.orderId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save order';
      setPaymentError(message);
      toast({ title: message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  },
  [saveOrder, clearCart, router, locale, paymentMethod, setPaymentError, toast]
);
```

- [ ] **Step 2: Update `handleBitConfirm`**

Find this block (around line 338–358):
```typescript
const handleBitConfirm = useCallback(
  async (senderDetails: BitSenderDetails) => {
    setSubmitting(true);
    try {
      await saveOrder({ method: 'bit', bitSenderDetails: senderDetails });
      setSuccess(true);
      clearCart();
      toast({
        title: isHe ? 'ההזמנה התקבלה! ממתינים לאישור תשלום.' : 'Order received! Waiting for payment approval.',
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save order';
      setPaymentError(message);
      toast({ title: message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  },
  [saveOrder, clearCart, toast, isHe]
);
```

Replace with:
```typescript
const handleBitConfirm = useCallback(
  async (senderDetails: BitSenderDetails) => {
    setSubmitting(true);
    try {
      const result = await saveOrder({ method: 'bit', bitSenderDetails: senderDetails });
      clearCart();
      router.push(`/${locale}/order-confirmed?orderId=${result.orderId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save order';
      setPaymentError(message);
      toast({ title: message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  },
  [saveOrder, clearCart, router, locale, setPaymentError, toast]
);
```

Note: `router` and `locale` are already in scope in `CheckoutSection` (used in `handlePaymentSuccess`). Verify `router` is destructured from `useRouter()` and `locale` from `useLocale()` at the top of `CheckoutSection`. If `router` is not already in scope for `handleBitConfirm`, check whether `CheckoutSection` has `const router = useRouter()` — if not, add it.

- [ ] **Step 3: Remove now-unused `success` state and toast imports if they become unused**

Check if `setSuccess` and the success-related `toast` calls are still used anywhere else in `CheckoutSection`. If `success` state is only used by the old handlers, remove:
- `const [success, setSuccess] = useState(false);`
- Any JSX that renders based on `{success && ...}`

Only remove them if they are definitively unused — do not remove if still referenced elsewhere in the component.

- [ ] **Step 4: Run build**

```bash
npm run build 2>&1 | grep -E "error TS|Failed to compile"
```
Expected: clean build, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\[locale\]/cart/client.tsx
git commit -m "feat: redirect to order-confirmed page after successful checkout"
```

---

### Task 4: End-to-end verification and push

- [ ] **Step 1: Start dev server and test PayPal flow**

```bash
npm run dev
```

Place a test order via PayPal sandbox. After payment, you should be redirected to `/en/order-confirmed?orderId=XXX` and see:
- ✓ check icon (cyan)
- "Order Confirmed!" heading
- Customer name in subtitle
- Order # chip
- Receipt email notice
- Items with sizes
- Totals breakdown
- Shipping address + "PayPal — Confirmed & captured"
- 3 "What happens next" steps (production variant)
- "Continue Shopping" CTA

- [ ] **Step 2: Test BIT flow**

Place a test BIT order. After confirming sender details, you should be redirected to `/en/order-confirmed?orderId=XXX` and see:
- ⏳ clock icon (amber)
- "Order Received!" heading
- "Awaiting approval" payment badge
- 3 "What happens next" steps (BIT pending variant)

- [ ] **Step 3: Test direct URL without orderId**

Navigate to `/en/order-confirmed` (no query param). Should redirect immediately to `/en` (home).

- [ ] **Step 4: Push to production**

```bash
git push origin main
```
