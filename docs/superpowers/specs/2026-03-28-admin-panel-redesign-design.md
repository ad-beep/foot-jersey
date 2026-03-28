# Admin Panel Redesign — Design Spec
Date: 2026-03-28

## Overview
Full redesign of the admin orders panel: collapsible sidebar, new order list UI, full-screen order detail panel, conditional product cards, shipping copy button, status-driven action buttons, and live Google Sheets status sync.

---

## 1. Collapsible Sidebar

**Component:** `AdminSidebar.tsx`

- Add a hamburger (☰) button in the sidebar header (top-left).
- Clicking it toggles `collapsed` state (persisted in `localStorage` so it survives navigation).
- **Expanded:** `w-56` — shows icon + label for each nav item.
- **Collapsed:** `w-14` — shows icon only, labels hidden. Logo text hidden, dot stays.
- The `AdminLayout` responds to the sidebar's width so `main` fills remaining space.
- On mobile (`< 768px`), collapsed is the default state on first load.

---

## 2. Order List Panel

**Component:** `admin/orders/page.tsx` (rewritten)

Each order renders as a single clickable row containing:
- **#N** — sequential order number (1, 2, 3…), derived from `createdAt` sort position. Stored as `orderNumber` field in Firestore at creation time using an atomic counter document `meta/orderCounter`.
- **Buyer name**
- **Jersey count** (e.g. "2 jerseys")
- **Total paid** (₪)
- **Payment method badge** — PayPal (blue) or BIT (orange)
- **Pulse dot** for BIT orders awaiting approval

Clicking a row navigates to `/admin/orders/[id]` (full-screen detail page).

**Tabs:** All Orders · ⚡ Pending BIT · Processing · Shipped
- Tab counts update in real time via `onSnapshot`.

---

## 3. Order Detail Page

**Route:** `admin/orders/[id]/page.tsx` (new file)

### Top bar
- **← Orders** back button (returns to list)
- **Order #N — Buyer Name**
- **Status chip** (color-coded: orange=BIT pending, blue=processing, indigo=shipped, green=completed)

### Action button bar (just below top bar)
Status-driven — only one button shown at a time:

| Current status | Button shown |
|---|---|
| `pending` (PayPal) | **Process** → sets status to `processing` |
| `pending_bit_approval` | **Accept Payment** + **Decline** |
| `processing` | **Mark as Shipped** → sets status to `shipped` |
| `shipped` / `completed` | No action buttons |
| Declined BIT | Red "Declined" text label (no buttons) |

Accepting a BIT payment sets status to `processing` and moves order to the All Orders + Processing tabs.
Declining keeps the order in the Pending BIT tab with a red "Declined" badge instead of buttons. Status in Firestore becomes `bit_declined`. Inside the detail panel of a declined order, a **Delete Order** button (red, destructive) permanently removes the document from Firestore and navigates back to the list.

### Product cards (left side)
One card per `item` in the order. Each card shows:
1. **Jersey photo** — loaded from `item.imageUrl` (stored at order creation; see section 5)
2. **Jersey name** (team name)
3. **Size** — always shown
4. **Name** — only if `customization.customName` is not empty/false
5. **Number** — only if `customization.customNumber` is not empty/false
6. **Patch** — only if `customization.patchText` is not false (shows the patch text)
7. **Player Version** tag — only if `customization.isPlayerVersion === true`
8. **With Pants** tag — only if `customization.hasPants === true`

Cards are horizontally scrollable on mobile.

### Right panel
**Shipping Info block:**
- Name / Address / City / Postal Code / Country / Phone / Email — one per row, label + value
- **"Copy all"** button: copies entire block as plain text to clipboard in the format requested

**Payment Info block:**
- Method, Status, Order Date, Shipping cost, Order Total (highlighted in cyan)

---

## 4. Google Sheets Status Sync

**Column S** in the Orders sheet is now `Status` (renamed by user from `Discount (₪)`).

On every status transition in the admin panel, a server-side API call updates both Firestore and the sheet:

**New endpoint:** `POST /api/admin/orders/update-status`
```json
{ "orderId": "abc123", "status": "processing" }
```

The handler:
1. Updates Firestore `orders/{orderId}` → `status` field.
2. Reads the Orders sheet, finds all rows where column A = `orderId`, updates column S on each matching row.

Row lookup: reads `Orders!A:A`, finds row indices where value matches `orderId`, then batch-updates column S on those rows.

---

## 5. Image URL at Order Creation

Product cards need a photo. The `jersey.imageUrl` is available on `CartItem` at checkout time. The order save handler (`api/orders/route.ts`) already receives full `CartItem[]` — it must store `imageUrl` per item in Firestore alongside the existing fields.

Update the Firestore write to include `imageUrl: item.jersey?.imageUrl || ''` on each item object.

---

## 6. Order Number Counter

Firestore document `meta/orderCounter` → `{ count: N }`.

On each new order creation in `api/orders/route.ts`:
1. Run a Firestore transaction: read `count`, increment by 1, write back.
2. Store resulting number as `orderNumber` on the order document.

This ensures no two orders share a number even under concurrent writes.

---

## 7. File Structure

```
src/
  components/admin/
    AdminSidebar.tsx          ← update: add collapse toggle
  app/admin/
    layout.tsx                ← update: sidebar collapse context
    orders/
      page.tsx                ← rewrite: new list UI
      [id]/
        page.tsx              ← new: full-screen detail
  app/api/admin/orders/
    update-status/
      route.ts                ← new: Firestore + Sheets status sync
  app/api/orders/
    route.ts                  ← update: add imageUrl + orderNumber
```

---

## 8. .gitignore

Add `.superpowers/` to `.gitignore` so brainstorm mockups are not committed.
