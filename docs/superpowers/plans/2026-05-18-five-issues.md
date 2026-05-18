# FootJersey Five Issues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 distinct issues: WC collection bug, New Orders admin tab, discount code visibility in admin, email marketing sequence for exit-intent leads, and search/collection navigation improvements.

**Architecture:** All changes are isolated — each task touches a small, known file. No new dependencies. Email marketing uses the existing nodemailer/Gmail pattern. Cron uses the existing `vercel.json` + `CRON_SECRET` pattern from the abandoned-cart flow.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Firebase client SDK, nodemailer (Gmail), Vercel crons

---

## File Map

| File | Change |
|------|--------|
| `src/components/home/CategoryGrid.tsx` | Fix WC slug in COLLECTION_SLUG_MAP |
| `src/app/admin/orders/page.tsx` | Add New Orders tab + discount badge in row |
| `src/app/admin/orders/[id]/page.tsx` | Add discount to Order interface + payment section |
| `src/app/api/admin/discounts/route.ts` | Merge Firestore usage counts into GET response |
| `src/app/admin/discounts/page.tsx` | Add BarChart2 import + UsageChart component |
| `src/components/search/SearchBar.tsx` | Redirect to /discover instead of /search |
| `src/app/[locale]/collections/[slug]/page.tsx` | Replace page body with server-side redirect |
| `src/lib/email.ts` | Add 3 marketing email functions |
| `src/app/api/exit-intent/capture/route.ts` | Send welcome email on capture |
| `src/app/api/marketing/send-sequences/route.ts` | **NEW** — daily cron for day-3 and day-7 emails |
| `src/app/api/orders/route.ts` | Mark exit-intent leads as converted on purchase |
| `vercel.json` | Add marketing sequences cron entry |

---

## Task 1: Fix World Cup Collection Bug

**Files:**
- Modify: `foot-jersey/src/components/home/CategoryGrid.tsx` (line ~282)

- [ ] **Step 1: Apply the fix**

In `CategoryGrid.tsx`, find `COLLECTION_SLUG_MAP` (around line 278) and change the `world-cup-2026` entry:

```typescript
// BEFORE
const COLLECTION_SLUG_MAP: Record<string, string> = {
  'retro': 'retro',
  'season-2526': 'season-2526',
  'special': 'special',
  'world-cup-2026': 'world-cup-2026',   // ← BUG: discover filter ID is 'world-cup'
  'kids': 'kids',
  'long-sleeve': 'long-sleeve',
  'drip': 'drip',
  'other-products': 'other-products',
  'second-hand': 'second-hand',
};

// AFTER
const COLLECTION_SLUG_MAP: Record<string, string> = {
  'retro': 'retro',
  'season-2526': 'season-2526',
  'special': 'special',
  'world-cup-2026': 'world-cup',         // ← FIXED: matches discover pill id
  'kids': 'kids',
  'long-sleeve': 'long-sleeve',
  'drip': 'drip',
  'other-products': 'other-products',
  'second-hand': 'second-hand',
};
```

- [ ] **Step 2: Verify**

Open `http://localhost:3000/he` (or `/en`), click the World Cup 2026 tile in the category grid. Confirm you land on `/discover?collections=world-cup` and jerseys appear.

- [ ] **Step 3: Commit**

```bash
git add foot-jersey/src/components/home/CategoryGrid.tsx
git commit -m "fix: correct world-cup collection slug to match discover filter id"
```

---

## Task 2: Add New Orders Tab to Admin

**Files:**
- Modify: `foot-jersey/src/app/admin/orders/page.tsx`

- [ ] **Step 1: Add 'new' to the Tab type**

Find the `type Tab = ...` line and replace it:

```typescript
// BEFORE
type Tab = 'all' | 'pending_bit' | 'processing' | 'shipped' | 'completed';

// AFTER
type Tab = 'new' | 'all' | 'pending_bit' | 'processing' | 'shipped' | 'completed';
```

- [ ] **Step 2: Add the New tab to TABS array**

Replace the entire `TABS` constant:

```typescript
const TABS: { id: Tab; label: string; filter: (o: OrderSummary) => boolean }[] = [
  { id: 'new',         label: '🆕 New',         filter: (o) => o.status === 'pending' || o.status === 'pending_bit_approval' },
  { id: 'all',         label: 'All Orders',      filter: () => true },
  { id: 'pending_bit', label: '⚡ Pending BIT',  filter: (o) => o.status === 'pending_bit_approval' || o.status === 'bit_declined' },
  { id: 'processing',  label: 'Processing',      filter: (o) => o.status === 'processing' },
  { id: 'shipped',     label: 'Shipped',         filter: (o) => o.status === 'shipped' },
  { id: 'completed',   label: 'Completed',       filter: (o) => o.status === 'completed' || o.status === 'delivered' },
];
```

- [ ] **Step 3: Set 'new' as the default active tab**

```typescript
// BEFORE
const [tab, setTab] = useState<Tab>('all');

// AFTER
const [tab, setTab] = useState<Tab>('new');
```

- [ ] **Step 4: Update the badge colour logic in the tab bar**

Find the `<span>` for the badge count inside the tab map. Replace the className expression:

```tsx
// BEFORE
className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
  t.id === 'pending_bit'
    ? 'bg-orange-500/15 text-orange-400'
    : 'bg-white/8 text-gray-500'
}`}

// AFTER
className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
  t.id === 'new' || t.id === 'pending_bit'
    ? 'bg-orange-500/15 text-orange-400'
    : 'bg-white/8 text-gray-500'
}`}
```

- [ ] **Step 5: Verify**

Open `/admin/orders`. Confirm "🆕 New" is the first tab and is selected by default. Confirm it shows only `pending` and `pending_bit_approval` orders. Confirm clicking "Mark as Processing" on a pending order makes it disappear from the New tab.

- [ ] **Step 6: Commit**

```bash
git add foot-jersey/src/app/admin/orders/page.tsx
git commit -m "feat: add New Orders tab as default in admin orders page"
```

---

## Task 3: Show Discount Code in Admin Order List and Detail

**Files:**
- Modify: `foot-jersey/src/app/admin/orders/page.tsx`
- Modify: `foot-jersey/src/app/admin/orders/[id]/page.tsx`

### 3a — Order list

- [ ] **Step 1: Add discount fields to OrderSummary interface**

In `orders/page.tsx`, find the `OrderSummary` interface and add two fields:

```typescript
interface OrderSummary {
  id: string;
  orderNumber?: number;
  shippingInfo: { name: string };
  items: { quantity: number }[];
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: Timestamp | null;
  orderGroupId?: string;
  shipmentSource?: 'local' | 'international';
  discountCode?: string | null;      // ← ADD
  discountAmount?: number;           // ← ADD
}
```

- [ ] **Step 2: Add discount badge to the order row**

In the order row JSX, find the line that renders `₪${order.total}`:

```tsx
<span className="text-sm font-bold text-white min-w-[60px] text-right">
  ₪{order.total}
</span>
```

Add the badge immediately after it:

```tsx
<span className="text-sm font-bold text-white min-w-[60px] text-right">
  ₪{order.total}
</span>
{order.discountCode && (order.discountAmount ?? 0) > 0 && (
  <span className="hidden lg:inline text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/15 shrink-0 whitespace-nowrap">
    {order.discountCode} −₪{order.discountAmount}
  </span>
)}
```

### 3b — Order detail

- [ ] **Step 3: Add discount fields to the Order interface**

In `orders/[id]/page.tsx`, find the `Order` interface and add two fields:

```typescript
interface Order {
  id: string;
  orderNumber?: number;
  items: OrderItem[];
  shippingInfo: { ... };
  paymentMethod: string;
  paymentStatus: string;
  paypalOrderId?: string;
  bitSenderDetails?: { senderName: string; senderPhone: string; amountPaid: string };
  subtotal: number;
  total: number;
  shipping: number;
  currency: string;
  status: string;
  createdAt: Timestamp | null;
  orderGroupId?: string;
  siblingOrderId?: string;
  siblingOrderNumber?: number;
  shipmentSource?: 'local' | 'international';
  trackingNumber?: string;
  trackingCarrier?: string;
  discountCode?: string | null;     // ← ADD
  discountAmount?: number;          // ← ADD
}
```

- [ ] **Step 4: Add discount row to the Payment card**

In the Payment section, find the total line:

```tsx
<div className="flex justify-between text-base font-bold mt-3 pt-3 border-t border-white/5">
  <span className="text-white">Total</span>
  <span className="text-cyan-400">₪{order.total}</span>
</div>
```

Add the discount row immediately before it:

```tsx
{order.discountCode && (order.discountAmount ?? 0) > 0 && (
  <div className="flex justify-between text-sm mb-2">
    <span className="text-gray-600">Discount ({order.discountCode})</span>
    <span className="text-amber-400 font-medium">−₪{order.discountAmount}</span>
  </div>
)}
<div className="flex justify-between text-base font-bold mt-3 pt-3 border-t border-white/5">
  <span className="text-white">Total</span>
  <span className="text-cyan-400">₪{order.total}</span>
</div>
```

- [ ] **Step 5: Verify**

Open an order in the admin that used a discount code. Confirm the discount code and amount appear in the Payment card. Confirm the order list shows the badge on large screens.

- [ ] **Step 6: Commit**

```bash
git add foot-jersey/src/app/admin/orders/page.tsx foot-jersey/src/app/admin/orders/[id]/page.tsx
git commit -m "feat: show discount code and amount in admin order list and detail"
```

---

## Task 4: Discount Usage Chart in Admin

**Files:**
- Modify: `foot-jersey/src/app/api/admin/discounts/route.ts`
- Modify: `foot-jersey/src/app/admin/discounts/page.tsx`

### 4a — Extend the API

- [ ] **Step 1: Add Firestore imports to the discounts API route**

In `src/app/api/admin/discounts/route.ts`, add Firestore imports at the top (after the existing imports):

```typescript
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
```

- [ ] **Step 2: Merge Firestore usage counts into the GET response**

In the GET handler, find the line `return NextResponse.json({ data });` and replace with:

```typescript
// Merge real-time usage from Firestore discountUsage collection
let usageMap: Record<string, number> = {};
try {
  const usageSnap = await getDocs(collection(db, 'discountUsage'));
  usageSnap.forEach((usageDoc) => {
    usageMap[usageDoc.id.toUpperCase()] = (usageDoc.data().count as number) || 0;
  });
} catch {
  // Non-blocking — Sheets current_uses remains as fallback
}

const dataWithUsage = data.map((d) => ({
  ...d,
  firestore_uses: usageMap[(d.code || '').toUpperCase()] ?? parseInt(String(d.current_uses) || '0'),
}));

return NextResponse.json({ data: dataWithUsage });
```

### 4b — Add the usage chart to the discounts admin page

- [ ] **Step 3: Add BarChart2 to lucide imports**

In `src/app/admin/discounts/page.tsx`, find the lucide import line and add `BarChart2`:

```typescript
// BEFORE
import {
  Loader2, Plus, Trash2, ToggleLeft, ToggleRight, Ticket, CheckCircle2, AlertCircle,
} from 'lucide-react';

// AFTER
import {
  Loader2, Plus, Trash2, ToggleLeft, ToggleRight, Ticket, CheckCircle2, AlertCircle, BarChart2,
} from 'lucide-react';
```

- [ ] **Step 4: Add firestore_uses to the Discount interface**

```typescript
interface Discount {
  code: string;
  type: string;
  value: string;
  min_order: string;
  max_uses: string;
  current_uses: string;
  expiry_date: string;
  is_active: string;
  created_at: string;
  firestore_uses?: number;   // ← ADD
}
```

- [ ] **Step 5: Add the UsageChart component**

Insert this component function just before `export default function DiscountsPage()`:

```typescript
function UsageChart({ discounts }: { discounts: Discount[] }) {
  const withData = discounts.filter((d) => d.code);
  if (withData.length === 0) return null;
  const maxUses = Math.max(...withData.map((d) => d.firestore_uses ?? parseInt(d.current_uses) || 0), 1);
  return (
    <div className="mb-8 p-5 rounded-xl border border-white/10 bg-white/[0.02]">
      <p className="text-sm font-semibold mb-4 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-cyan-400" />
        Code Usage
      </p>
      <div className="space-y-3">
        {withData.map((d) => {
          const uses = d.firestore_uses ?? parseInt(d.current_uses) || 0;
          const pct = Math.round((uses / maxUses) * 100);
          return (
            <div key={d.code}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-mono font-bold text-white">{d.code}</span>
                <span className="text-gray-500">{uses} use{uses !== 1 ? 's' : ''}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: uses > 0 ? '#C8A24B' : 'rgba(255,255,255,0.08)',
                    minWidth: uses > 0 ? '4px' : undefined,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Render UsageChart in the page**

In `DiscountsPage`, find the heading block and add `<UsageChart>` right after the `<p className="text-sm text-gray-400 mb-8">` line:

```tsx
<h1 className="text-2xl font-bold mb-1">Discount Codes</h1>
<p className="text-sm text-gray-400 mb-8">Create and manage promotional codes</p>

<UsageChart discounts={discounts} />   {/* ← ADD */}

{/* Create form */}
<form onSubmit={handleCreate} ...>
```

- [ ] **Step 7: Verify**

Open `/admin/discounts`. A "Code Usage" section with horizontal gold bars should appear. Bars reflect how many times each code was used. Codes with 0 uses show an empty bar.

- [ ] **Step 8: Commit**

```bash
git add foot-jersey/src/app/api/admin/discounts/route.ts foot-jersey/src/app/admin/discounts/page.tsx
git commit -m "feat: add discount usage chart and merge firestore counts in admin"
```

---

## Task 5: Redirect Header Search to Discover Page

**Files:**
- Modify: `foot-jersey/src/components/search/SearchBar.tsx` (line ~251)

- [ ] **Step 1: Change the search navigation target**

In `SearchBar.tsx`, find `navigateToSearch` (around line 244):

```typescript
const navigateToSearch = useCallback((q?: string) => {
  // ... some lines ...
  router.push(`/${locale}/search?q=${encodeURIComponent(searchQ)}`);
```

Change the `router.push` line:

```typescript
// BEFORE
router.push(`/${locale}/search?q=${encodeURIComponent(searchQ)}`);

// AFTER
router.push(`/${locale}/discover?q=${encodeURIComponent(searchQ)}`);
```

- [ ] **Step 2: Verify**

Open the site, type "barcelona" in the header search and submit. Confirm you land on `/discover?q=barcelona` with Barcelona jerseys shown and the discover filter pills (League, Collection) available.

- [ ] **Step 3: Commit**

```bash
git add foot-jersey/src/components/search/SearchBar.tsx
git commit -m "feat: redirect header search to discover page for integrated filter experience"
```

---

## Task 6: Redirect Collection Landing Pages to Discover

**Files:**
- Modify: `foot-jersey/src/app/[locale]/collections/[slug]/page.tsx`

- [ ] **Step 1: Add redirect import**

At the top of the file, the existing imports include `notFound` from `next/navigation`. Add `redirect`:

```typescript
// BEFORE
import { notFound } from 'next/navigation';

// AFTER
import { notFound, redirect } from 'next/navigation';
```

- [ ] **Step 2: Replace the page component body with a redirect**

Find `export default function CollectionPage(...)` and replace its entire body. Keep `generateStaticParams` and `generateMetadata` — only replace the default export function body:

```typescript
export default function CollectionPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const col = getCollection(params.slug);
  if (!col) notFound();
  redirect(`/${params.locale}/discover?collections=${col!.categorySlug}`);
}
```

The `!` on `col` is safe since the `notFound()` call above throws before reaching the redirect if `col` is undefined.

- [ ] **Step 3: Verify**

Visit `/he/collections/world-cup-2026`. Confirm you are immediately redirected to `/he/discover?collections=world-cup` and jerseys appear. Do the same for `/he/collections/retro` → `/he/discover?collections=retro`.

- [ ] **Step 4: Commit**

```bash
git add foot-jersey/src/app/[locale]/collections/[slug]/page.tsx
git commit -m "feat: redirect collection landing pages to discover with filter pre-selected"
```

---

## Task 7: Add Marketing Email Functions

**Files:**
- Modify: `foot-jersey/src/lib/email.ts`

- [ ] **Step 1: Add sendMarketingWelcomeEmail**

At the end of `email.ts`, append:

```typescript
// ─── Marketing — Welcome Email (exit-intent lead) ─────────────────────────────
export async function sendMarketingWelcomeEmail(opts: {
  to: string;
  discountCode: string;
}): Promise<void> {
  const content = `
    <div class="body">
      <h1 class="title">Welcome to FootJersey! 🎽</h1>
      <p class="subtitle">Here's your exclusive 10% discount code — use it on any jersey.</p>

      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:rgba(200,162,75,0.12);border:2px dashed rgba(200,162,75,0.5);border-radius:16px;padding:20px 40px;">
          <p style="font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.2em;color:#888;margin-bottom:8px;">Your Discount Code</p>
          <p style="font-size:36px;font-weight:900;font-family:monospace;color:#C8A24B;letter-spacing:0.1em;margin:0;">${opts.discountCode}</p>
          <p style="font-size:12px;color:#888;margin-top:8px;">10% off your entire order · Valid 14 days</p>
        </div>
      </div>

      <div class="info-box success" style="margin-bottom:24px;">
        🚚 Free shipping on 3+ items &nbsp;·&nbsp; PayPal &amp; BIT accepted &nbsp;·&nbsp; 300+ jerseys in stock
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td width="33%" style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:10px;padding:12px;text-align:center;">
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 4px;">Retro Classics</p>
              <p style="font-size:11px;color:#555;margin:0;">Archive 1990–2010</p>
            </div>
          </td>
          <td width="33%" style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:10px;padding:12px;text-align:center;">
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 4px;">25/26 Season</p>
              <p style="font-size:11px;color:#555;margin:0;">New kits just dropped</p>
            </div>
          </td>
          <td width="33%" style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:10px;padding:12px;text-align:center;">
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 4px;">World Cup 2026</p>
              <p style="font-size:11px;color:#555;margin:0;">48 national teams</p>
            </div>
          </td>
        </tr>
      </table>

      <a href="${SITE_URL}" class="cta-button">Shop Now — Use ${opts.discountCode}</a>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject: `Your 10% discount is inside 🎽 — FootJersey`,
      html: wrapEmail(content, 'Welcome to FootJersey'),
    });
  } catch (err) {
    console.error('[Email] Failed to send marketing welcome email:', err);
    throw err;
  }
}
```

- [ ] **Step 2: Add sendMarketingDay3Email**

Append immediately after the welcome function:

```typescript
// ─── Marketing — Day 3 Follow-up ─────────────────────────────────────────────
export async function sendMarketingDay3Email(opts: {
  to: string;
  discountCode: string;
}): Promise<void> {
  const content = `
    <div class="body">
      <h1 class="title">Still looking for your jersey? ⚽</h1>
      <p class="subtitle">Thousands of football fans have already found their perfect kit at FootJersey. Your 10% discount is still waiting for you.</p>

      <div class="order-id" style="text-align:center;">${opts.discountCode} — 10% off</div>

      <p style="font-size:13px;color:#888;margin:20px 0 12px;">Our most popular teams right now:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:10px 14px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#fff;margin:0;">FC Barcelona</p>
              <p style="font-size:10px;color:#555;margin:3px 0 0;">La Liga</p>
            </div>
          </td>
          <td style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:10px 14px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#fff;margin:0;">Real Madrid</p>
              <p style="font-size:10px;color:#555;margin:3px 0 0;">La Liga</p>
            </div>
          </td>
          <td style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:10px 14px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#fff;margin:0;">Brazil</p>
              <p style="font-size:10px;color:#555;margin:3px 0 0;">National Team</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:10px 14px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#fff;margin:0;">Argentina</p>
              <p style="font-size:10px;color:#555;margin:3px 0 0;">National Team</p>
            </div>
          </td>
          <td style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:10px 14px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#fff;margin:0;">Liverpool</p>
              <p style="font-size:10px;color:#555;margin:3px 0 0;">Premier League</p>
            </div>
          </td>
          <td style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:10px 14px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#fff;margin:0;">PSG</p>
              <p style="font-size:10px;color:#555;margin:3px 0 0;">Ligue 1</p>
            </div>
          </td>
        </tr>
      </table>

      <div class="info-box success" style="margin-bottom:24px;">
        ⭐ Over 300 jerseys in stock · Retro, current &amp; World Cup kits · Ships to Israel &amp; worldwide
      </div>

      <a href="${SITE_URL}" class="cta-button">Find My Jersey — ${opts.discountCode}</a>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject: `Still looking for your jersey? ⚽ Your discount is waiting`,
      html: wrapEmail(content, 'Still Shopping — FootJersey'),
    });
  } catch (err) {
    console.error('[Email] Failed to send marketing day-3 email:', err);
    throw err;
  }
}
```

- [ ] **Step 3: Add sendMarketingDay7Email**

Append immediately after the day-3 function:

```typescript
// ─── Marketing — Day 7 Final Email ───────────────────────────────────────────
export async function sendMarketingDay7Email(opts: {
  to: string;
  discountCode: string;
}): Promise<void> {
  const content = `
    <div class="body">
      <div style="margin-bottom:16px;">
        <span class="status-badge status-pending">⏰ Your discount expires soon</span>
      </div>
      <h1 class="title">Last chance — don't miss out</h1>
      <p class="subtitle">Your ${opts.discountCode} code gives you 10% off any jersey. After this, we won't contact you again.</p>

      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:rgba(200,162,75,0.12);border:2px dashed rgba(200,162,75,0.5);border-radius:16px;padding:20px 40px;">
          <p style="font-size:36px;font-weight:900;font-family:monospace;color:#C8A24B;letter-spacing:0.1em;margin:0;">${opts.discountCode}</p>
          <p style="font-size:12px;color:#888;margin-top:8px;">10% off — expires soon</p>
        </div>
      </div>

      <div class="info-box warning" style="margin-bottom:24px;">
        <strong>Why act now?</strong><br><br>
        · World Cup 2026 jerseys selling fast — 48 nations in stock<br>
        · New retro kits added every week<br>
        · 25/26 season kits available now<br>
        · Free shipping on 3+ jerseys
      </div>

      <a href="${SITE_URL}" class="cta-button">Use ${opts.discountCode} Before It Expires</a>

      <p style="font-size:12px;color:#555;text-align:center;margin-top:20px;">
        This is our last email — we respect your inbox.
      </p>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject: `⏰ Last chance — your FootJersey discount expires soon`,
      html: wrapEmail(content, 'Last Chance — FootJersey'),
    });
  } catch (err) {
    console.error('[Email] Failed to send marketing day-7 email:', err);
    throw err;
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd foot-jersey && npx tsc --noEmit
```

Expected: no errors related to the new functions.

- [ ] **Step 5: Commit**

```bash
git add foot-jersey/src/lib/email.ts
git commit -m "feat: add marketing welcome, day-3, and day-7 email functions"
```

---

## Task 8: Send Welcome Email on Exit-Intent Capture

**Files:**
- Modify: `foot-jersey/src/app/api/exit-intent/capture/route.ts`

- [ ] **Step 1: Rewrite the capture route**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { sendMarketingWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, 'exitIntentLeads'), {
      email,
      capturedAt: serverTimestamp(),
      source: 'exit_intent',
      discountCode: 'STAY10',
      emailsSent: [],
    });

    // Send welcome email in background — don't block the response
    sendMarketingWelcomeEmail({ to: email, discountCode: 'STAY10' })
      .then(() => updateDoc(docRef, { emailsSent: ['welcome'] }))
      .catch((err) => console.error('[exit-intent] welcome email failed:', err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('exit-intent capture error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify**

Submit the exit-intent popup with a test email address. Confirm the email arrives with the STAY10 code and the FootJersey branding. Check Firestore `exitIntentLeads` collection — the new document should have `emailsSent: ['welcome']` after a few seconds.

- [ ] **Step 3: Commit**

```bash
git add foot-jersey/src/app/api/exit-intent/capture/route.ts
git commit -m "feat: send welcome email with discount code on exit-intent capture"
```

---

## Task 9: Create Marketing Sequence Cron Route

**Files:**
- Create: `foot-jersey/src/app/api/marketing/send-sequences/route.ts`

- [ ] **Step 1: Create the route file**

Create `foot-jersey/src/app/api/marketing/send-sequences/route.ts` with the following content:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { sendMarketingDay3Email, sendMarketingDay7Email } from '@/lib/email';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snap = await getDocs(collection(db, 'exitIntentLeads'));
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    let sent3 = 0;
    let sent7 = 0;
    const errors: string[] = [];

    // Process up to 50 leads per invocation to stay within edge function timeout
    for (const leadDoc of snap.docs.slice(0, 50)) {
      const lead = leadDoc.data();

      // Skip leads with no email, or already converted (placed an order)
      if (!lead.email || lead.convertedAt) continue;

      const capturedMs =
        lead.capturedAt instanceof Timestamp ? lead.capturedAt.toMillis() : 0;
      if (capturedMs === 0) continue;

      const daysSince = (now - capturedMs) / DAY_MS;
      const emailsSent: string[] = lead.emailsSent ?? [];
      const discountCode: string = lead.discountCode ?? 'STAY10';

      try {
        if (daysSince >= 3 && !emailsSent.includes('day3')) {
          // Send day-3 email; defer day-7 to the next run when day3 is confirmed sent
          await sendMarketingDay3Email({ to: lead.email, discountCode });
          await updateDoc(doc(db, 'exitIntentLeads', leadDoc.id), {
            emailsSent: [...emailsSent, 'day3'],
          });
          sent3++;
        } else if (
          daysSince >= 7 &&
          emailsSent.includes('day3') &&
          !emailsSent.includes('day7')
        ) {
          await sendMarketingDay7Email({ to: lead.email, discountCode });
          await updateDoc(doc(db, 'exitIntentLeads', leadDoc.id), {
            emailsSent: [...emailsSent, 'day7'],
          });
          sent7++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${lead.email}: ${msg}`);
      }
    }

    return NextResponse.json({
      ok: true,
      sent3,
      sent7,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('send-sequences error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd foot-jersey && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add foot-jersey/src/app/api/marketing/send-sequences/route.ts
git commit -m "feat: add marketing email sequence cron route (day-3 and day-7 follow-ups)"
```

---

## Task 10: Conversion Tracking + Add Cron to vercel.json

**Files:**
- Modify: `foot-jersey/src/app/api/orders/route.ts`
- Modify: `foot-jersey/vercel.json`

### 10a — Mark leads as converted when an order is placed

- [ ] **Step 1: Add missing Firestore imports to orders route**

In `src/app/api/orders/route.ts`, the current imports are:
```typescript
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  increment,
  setDoc,
} from 'firebase/firestore';
```

Add `query`, `where`, and `getDocs`:
```typescript
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  increment,
  setDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
```

- [ ] **Step 2: Add the markLeadConverted helper function**

Add this function right after the existing `incrementDiscountUsage` function (around line 196):

```typescript
async function markLeadConverted(email: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'exitIntentLeads'),
      where('email', '==', email),
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      if (!d.data().convertedAt) {
        await updateDoc(doc(db, 'exitIntentLeads', d.id), {
          convertedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.error('[orders] markLeadConverted failed:', err);
  }
}
```

- [ ] **Step 3: Call markLeadConverted after an order is saved**

Find the block near line 685–686 where `incrementDiscountUsage` is called:

```typescript
if (body.discountCode) {
  incrementDiscountUsage(body.discountCode);
}
```

Add the conversion tracking call right after:

```typescript
if (body.discountCode) {
  incrementDiscountUsage(body.discountCode);
}
// Mark exit-intent lead as converted (best-effort, non-blocking)
if (body.shippingInfo?.email) {
  markLeadConverted(body.shippingInfo.email).catch(() => {});
}
```

### 10b — Add marketing cron to vercel.json

- [ ] **Step 4: Update vercel.json**

Replace the entire file content:

```json
{
  "crons": [
    {
      "path": "/api/abandoned-cart/send-reminders",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/marketing/send-sequences",
      "schedule": "0 9 * * *"
    }
  ]
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd foot-jersey && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit and push**

```bash
git add foot-jersey/src/app/api/orders/route.ts foot-jersey/vercel.json
git commit -m "feat: mark exit-intent leads as converted on purchase; add marketing cron to vercel.json"
git push
```

Push triggers Vercel auto-deploy. After deploy, the cron `0 9 * * *` (9am UTC daily) runs `/api/marketing/send-sequences` automatically.

---

## Verification Checklist

After all tasks are committed and deployed:

- [ ] Home page → click World Cup 2026 tile → lands on `/discover?collections=world-cup` with jerseys visible
- [ ] `/he/collections/world-cup-2026` → redirects to `/he/discover?collections=world-cup`
- [ ] `/he/collections/retro` → redirects to `/he/discover?collections=retro`
- [ ] Admin `/admin/orders` → "🆕 New" tab is first and selected by default; shows pending/pending_bit_approval orders only
- [ ] Admin order with discount code → badge `STAY10 −₪X` visible in list row and in order detail payment section
- [ ] Admin `/admin/discounts` → "Code Usage" bar chart visible at top
- [ ] Header search for "barcelona" → lands on `/discover?q=barcelona` with filter pills available
- [ ] Exit-intent popup submit → welcome email arrives within ~30 seconds
- [ ] Vercel dashboard → crons section shows both `send-reminders` and `send-sequences`
