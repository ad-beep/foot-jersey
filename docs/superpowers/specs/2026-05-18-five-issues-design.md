# FootJersey — Five Issues Design Spec
Date: 2026-05-18

## Issue 1 — Email Marketing Sequence for Exit-Intent Leads

### Context
`/api/exit-intent/capture` saves emails to `exitIntentLeads` Firestore collection with `discountCode: 'STAY10'`. No emails are currently sent beyond this capture. The abandoned-cart cron pattern (daily at midnight, `vercel.json`) is the reference implementation.

### Design
**3-email drip sequence** triggered from the daily cron job `/api/marketing/send-sequences`.

| Email | Trigger | Subject | Content |
|-------|---------|---------|---------|
| `welcome` | Immediately on capture (in the capture route itself) | "Your 10% discount code is inside 🎽" | Discount code STAY10 prominently displayed, 3 featured categories (retro, 25/26 season, world cup), shop CTA |
| `day3` | 3+ days after capture, not yet sent | "Still looking for your jersey? ⚽" | Best-selling teams (Barcelona, Real Madrid, Brazil, Argentina), discount reminder, social proof badge |
| `day7` | 7+ days after capture, not yet sent | "Last chance — your discount expires soon 🔥" | Urgency copy, new arrivals teaser, final CTA |

**Tracking fields on `exitIntentLead` doc:**
- `emailsSent: string[]` — which step keys have been sent (e.g. `['welcome', 'day3']`)
- `convertedAt?: Timestamp` — set when the same email places an order; cron skips converted leads

**New files:**
- `src/app/api/marketing/send-sequences/route.ts` — GET handler, secured with `CRON_SECRET`, processes up to 50 leads per invocation
- Marketing email templates added to `src/lib/email.ts` — `sendMarketingWelcomeEmail`, `sendMarketingDay3Email`, `sendMarketingDay7Email`

**`vercel.json`** — add second cron entry: `{ "path": "/api/marketing/send-sequences", "schedule": "0 9 * * *" }` (9am daily)

**Conversion detection:** When an order is placed (`/api/orders`), if `body.shippingInfo.email` exists, set `convertedAt` on any matching `exitIntentLead` doc (best-effort, non-blocking).

---

## Issue 2 — Discount Code Visibility in Admin

### 2a — Order list and detail page
`discountCode` and `discountAmount` are already stored in Firestore on each order. They're just not displayed.

- Add `discountCode?: string` and `discountAmount?: number` to `OrderSummary` interface in `src/app/admin/orders/page.tsx`
- Show a compact badge in the order row: `STAY10 -₪20` in amber/gold, next to the total
- In `src/app/admin/orders/[id]/page.tsx`, add the `Order` interface fields and show discount in the totals section

### 2b — Usage chart in discounts admin
There is already a `discountUsage` Firestore collection (keyed by code, `count` field), populated by `incrementDiscountUsage()` on every order.

- Extend `GET /api/admin/discounts` to also return usage counts from `discountUsage` collection
- Add a "Code Usage" section at the top of `src/app/admin/discounts/page.tsx` — horizontal CSS bar chart, one bar per code, label shows `CODE · N uses`, bar width proportional to max usage
- No external chart library needed

---

## Issue 3 — New Orders Tab

### Design
Add `'new'` as the first tab in the admin orders page.

**Filter:** `status === 'pending' || status === 'pending_bit_approval'`

- Tab label: `🆕 New Orders` with a pulsing orange badge showing count
- Becomes the default active tab when the page loads (replaces `'all'` as default)
- When count = 0, tab still shows but with muted styling
- No Firestore schema changes — purely a client-side filter

**Tab order:** New Orders · All Orders · ⚡ Pending BIT · Processing · Shipped · Completed

---

## Issue 4 — World Cup Collection Bug

### Root Cause
`CategoryGrid.tsx` `COLLECTION_SLUG_MAP` maps `'world-cup-2026'` → `'world-cup-2026'`, producing URL `?collections=world-cup-2026`. The discover page collection pill ID is `'world-cup'`. The filter function has no `'world-cup-2026'` case, so it falls through to `return false`.

### Fix
Change `'world-cup-2026': 'world-cup-2026'` → `'world-cup-2026': 'world-cup'` in `CategoryGrid.tsx`.

---

## Issue 5 — Search Filters + Collection → Discover Navigation

### 5a — Search redirects to Discover
Change `navigateToSearch` in `src/components/search/SearchBar.tsx` from `/search?q=...` to `/discover?q=...`. The discover page already reads `?q` from the URL and pre-fills the search state, and it has all league + collection filter pills. The `/search` page and route can remain for any existing bookmarks but the primary path now lands on discover.

### 5b — Collection landing pages redirect to Discover
`src/app/[locale]/collections/[slug]/page.tsx` currently renders a full editorial landing page. Change it to a server-side redirect:

```
/collections/retro          → /discover?collections=retro
/collections/world-cup-2026 → /discover?collections=world-cup
/collections/drip           → /discover?collections=drip
/collections/stussy-edition → /discover?collections=stussy-edition
```

Use `redirect()` from `next/navigation` at the top of the page component, mapping `col.categorySlug` → discover URL. The editorial content is discarded; the discover page with the active filter serves the product experience.

### 5c — "Other collections" links in collection pages (now moot after redirect)
After the redirect, these pages no longer render. No change needed.

---

## Implementation Order
1. Issue 4 (WC bug) — 1 line, verify immediately
2. Issue 3 (New Orders tab) — admin UI only, no API changes
3. Issue 2a (discount in order list/detail) — admin UI only
4. Issue 2b (usage chart) — requires API extension
5. Issue 5a (search → discover) — 1 line in SearchBar
6. Issue 5b (collection redirects) — server redirect in page.tsx
7. Issue 1 (email sequence) — new API route + email templates + vercel.json
