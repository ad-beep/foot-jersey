# Admin Panel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the admin orders panel with a collapsible sidebar, new list/detail UI, status-driven action buttons, and live Google Sheets status sync.

**Architecture:** Six tasks covering data layer changes (order creation API), UI components (sidebar, list, detail), and a new status-update API that syncs Firestore + Google Sheets column S simultaneously. All existing Firestore order data is preserved; new fields (`orderNumber`, `imageUrl`) are added forward-only.

**Tech Stack:** Next.js 14 App Router, Firebase Firestore (client SDK), React hooks, Tailwind CSS, Google Sheets API v4, TypeScript

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/app/api/orders/route.ts` | Modify | Add `orderNumber` (atomic counter) + `imageUrl` per item |
| `firestore.rules` | Modify | Allow unauthenticated r/w on `meta/orderCounter` |
| `src/components/admin/AdminSidebar.tsx` | Rewrite | Collapsible sidebar with hamburger, localStorage persistence |
| `src/app/admin/orders/page.tsx` | Rewrite | New list UI: rows with #N, name, count, total, payment badge |
| `src/app/admin/orders/[id]/page.tsx` | Create | Full-screen detail: product cards, shipping, payment, action buttons |
| `src/app/api/admin/orders/update-status/route.ts` | Create | Update Firestore status + Sheets column S |

---

### Task 1: Store `orderNumber` and item `imageUrl` at order creation

**Files:**
- Modify: `src/app/api/orders/route.ts`
- Modify: `firestore.rules`

- [ ] **Step 1: Update `firestore.rules` — allow access to `meta/orderCounter`**

Add this block inside `match /databases/{database}/documents`, after the existing `orders` rule:

```
// ── Order counter (used by server-side API, unauthenticated) ──────────────
match /meta/{docId} {
  allow read, write: if true;
}
```

- [ ] **Step 2: Update the import in `src/app/api/orders/route.ts`**

Find:
```typescript
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
```
Replace with:
```typescript
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
```

- [ ] **Step 3: Replace the Firestore write block in `src/app/api/orders/route.ts`**

Find the comment `// 1. Write to Firestore` and the entire `addDoc` call that follows it. Replace with:

```typescript
    // 1. Write to Firestore with atomic order number
    const counterRef = doc(db, 'meta', 'orderCounter');
    const ordersCollection = collection(db, 'orders');
    const newOrderRef = doc(ordersCollection);

    await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      const orderNumber = counterSnap.exists()
        ? (counterSnap.data().count as number) + 1
        : 1;
      transaction.set(counterRef, { count: orderNumber });
      transaction.set(newOrderRef, {
        orderNumber,
        items: body.items.map((item) => ({
          jerseyId: item.jerseyId,
          teamName: item.jersey?.teamName || '',
          imageUrl: item.jersey?.imageUrl || '',
          size: item.size,
          quantity: item.quantity,
          customization: item.customization,
          totalPrice: item.totalPrice,
        })),
        shippingInfo: {
          name: customerName,
          phone: body.shippingInfo.phone,
          email: body.shippingInfo.email,
          country: body.shippingInfo.country,
          city: body.shippingInfo.city,
          street: body.shippingInfo.street,
          zip: body.shippingInfo.zip,
          notes: body.shippingInfo.notes || '',
        },
        paymentMethod: body.paymentMethod,
        paymentStatus: body.paymentStatus,
        paypalOrderId: body.paypalOrderId || null,
        bitTransactionId: body.bitTransactionId || null,
        bitSenderDetails: body.bitSenderDetails || null,
        discountCode: body.discountCode || null,
        discountAmount: body.discountAmount || 0,
        subtotal: body.subtotal,
        total: body.total,
        currency: body.currency,
        createdAt: serverTimestamp(),
        status: body.paymentMethod === 'bit' ? 'pending_bit_approval' : 'pending',
      });
    });

    const orderDoc = newOrderRef;
```

- [ ] **Step 4: Verify build compiles**

```bash
cd "C:/Users/USER/OneDrive/Desktop/FootJersey/foot-jersey" && npm run build 2>&1 | tail -20
```
Expected: no TypeScript errors. The `orderDoc.id` reference used later in `appendOrderToSheet` and emails still works since `newOrderRef` is a `DocumentReference`.

- [ ] **Step 5: Deploy updated Firestore rules**

```bash
firebase deploy --only firestore:rules --project footjersey-9b9d0
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/orders/route.ts firestore.rules
git commit -m "feat: add orderNumber counter and item imageUrl to order creation"
```

---

### Task 2: Collapsible AdminSidebar

**Files:**
- Rewrite: `src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Rewrite `src/components/admin/AdminSidebar.tsx`**

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PackagePlus, Ticket, ClipboardList, LogOut, Menu } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const NAV = [
  { href: '/admin',           label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/products',  label: 'Add Product', icon: PackagePlus },
  { href: '/admin/discounts', label: 'Discounts',   icon: Ticket },
  { href: '/admin/orders',    label: 'Orders',      icon: ClipboardList },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('admin-sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem('admin-sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <aside
      className="shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/10 bg-[#0d0d0d] transition-all duration-200"
      style={{ width: collapsed ? '56px' : '224px' }}
    >
      {/* Header */}
      <div className="px-3 py-4 border-b border-white/10 flex items-center gap-2 min-h-[57px]">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2 flex-1 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" style={{ boxShadow: '0 0 8px #00C3D8' }} />
            <span className="font-bold text-white text-sm tracking-tight truncate">FootJersey Admin</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin" className="mx-auto">
            <span className="w-2 h-2 rounded-full bg-cyan-500 block" style={{ boxShadow: '0 0 8px #00C3D8' }} />
          </Link>
        )}
        <button
          onClick={toggle}
          className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify in browser**

Run `npm run dev`, open `http://localhost:3000/admin`. Click ☰ — sidebar collapses to 56px icons-only. Refresh — collapsed state persists. On mobile, sidebar starts collapsed by default after first toggle.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminSidebar.tsx
git commit -m "feat: collapsible admin sidebar with hamburger and localStorage persistence"
```

---

### Task 3: Rewrite orders list page

**Files:**
- Rewrite: `src/app/admin/orders/page.tsx`

- [ ] **Step 1: Rewrite `src/app/admin/orders/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, Package } from 'lucide-react';

interface OrderSummary {
  id: string;
  orderNumber?: number;
  shippingInfo: { name: string };
  items: { quantity: number }[];
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: Timestamp | null;
}

type Tab = 'all' | 'pending_bit' | 'processing' | 'shipped';

const TABS: { id: Tab; label: string; filter: (o: OrderSummary) => boolean }[] = [
  { id: 'all',         label: 'All Orders',    filter: () => true },
  { id: 'pending_bit', label: '⚡ Pending BIT', filter: (o) => o.status === 'pending_bit_approval' || o.status === 'bit_declined' },
  { id: 'processing',  label: 'Processing',    filter: (o) => o.status === 'processing' },
  { id: 'shipped',     label: 'Shipped',       filter: (o) => o.status === 'shipped' },
];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderSummary)));
      setLoading(false);
    });
  }, []);

  const jerseyCount = (o: OrderSummary) => o.items.reduce((s, i) => s + (i.quantity || 1), 0);
  const displayed = orders.filter(TABS.find((t) => t.id === tab)!.filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold mb-1">Orders</h1>
      <p className="text-sm text-gray-500 mb-5">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>

      {/* Tabs */}
      <div className="flex border-b border-white/8 mb-5">
        {TABS.map((t) => {
          const count = orders.filter(t.filter).length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  t.id === 'pending_bit'
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'bg-white/8 text-gray-500'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Rows */}
      {displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No orders here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayed.map((order) => {
            const isBitPending  = order.status === 'pending_bit_approval';
            const isBitDeclined = order.status === 'bit_declined';
            const count = jerseyCount(order);
            return (
              <button
                key={order.id}
                onClick={() => router.push(`/admin/orders/${order.id}`)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all ${
                  isBitPending
                    ? 'border-orange-500/25 bg-orange-500/[0.03] hover:border-orange-500/40'
                    : 'border-white/7 bg-white/[0.02] hover:border-cyan-500/30 hover:bg-cyan-500/[0.03]'
                }`}
              >
                {isBitPending
                  ? <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 animate-pulse" />
                  : <span className="w-2 h-2 shrink-0" />
                }
                <span className="text-xs font-bold text-gray-600 min-w-[32px]">
                  #{order.orderNumber ?? '—'}
                </span>
                <span className="text-sm font-semibold text-white flex-1 truncate">
                  {order.shippingInfo?.name || '—'}
                </span>
                <span className="text-xs text-gray-600">
                  {count} jersey{count !== 1 ? 's' : ''}
                </span>
                <span className="text-sm font-bold text-white min-w-[60px] text-right">
                  ₪{order.total}
                </span>
                {order.paymentMethod === 'bit' ? (
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/15">
                    ⚡ BIT{isBitDeclined ? ' · Declined' : ''}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/15">
                    PayPal
                  </span>
                )}
                <span className="text-gray-700 text-sm">›</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Open `/admin/orders`. Rows appear with #N, name, jersey count, total, payment badge. Clicking a row navigates to `/admin/orders/[id]` (404 until Task 5). Tabs filter correctly.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/orders/page.tsx
git commit -m "feat: rewrite admin orders list with row UI and tab navigation"
```

---

### Task 4: Status update API endpoint

**Files:**
- Create: `src/app/api/admin/orders/update-status/route.ts`

- [ ] **Step 1: Create directory and file**

```bash
mkdir -p "src/app/api/admin/orders/update-status"
```

Create `src/app/api/admin/orders/update-status/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { google } from 'googleapis';

function getSheetsAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function updateSheetStatus(orderId: string, status: string) {
  try {
    const auth = getSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

    // Find all rows where column A = orderId
    const colA = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Orders!A:A',
    });

    const rows = colA.data.values || [];
    const ranges: { range: string; values: string[][] }[] = [];

    rows.forEach((row, idx) => {
      if (idx === 0) return; // skip header row
      if (row[0] === orderId) {
        // Sheets is 1-indexed; header is row 1, so data starts at row 2
        ranges.push({ range: `Orders!S${idx + 1}`, values: [[status]] });
      }
    });

    if (ranges.length === 0) return;

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: ranges,
      },
    });
  } catch (err) {
    // Log but don't fail — Firestore is source of truth
    console.error('Failed to update sheet status:', err);
  }
}

const VALID_STATUSES = [
  'pending', 'pending_bit_approval', 'processing',
  'shipped', 'completed', 'bit_declined',
];

export async function POST(request: NextRequest) {
  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await updateDoc(doc(db, 'orders', orderId), { status });

    // Sync sheet in background — don't await so the UI isn't blocked
    updateSheetStatus(orderId, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "Error|error TS" | head -20
```
Expected: no errors on the new route file.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/orders/update-status/route.ts
git commit -m "feat: add update-status API — syncs Firestore and Google Sheets column S"
```

---

### Task 5: Order detail page

**Files:**
- Create: `src/app/admin/orders/[id]/page.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "src/app/admin/orders/[id]"
```

- [ ] **Step 2: Create `src/app/admin/orders/[id]/page.tsx`**

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { doc, onSnapshot, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft, Copy, Check, Truck, CheckCircle2, Trash2 } from 'lucide-react';

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
  paypalOrderId?: string;
  bitSenderDetails?: { senderName: string; senderPhone: string; amountPaid: string };
  subtotal: number;
  total: number;
  shipping: number;
  currency: string;
  status: string;
  createdAt: Timestamp | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:              { label: 'Pending',        color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  pending_bit_approval: { label: '⚡ Pending BIT', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  bit_declined:         { label: 'Declined',       color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  processing:           { label: 'Processing',     color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  shipped:              { label: 'Shipped',        color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  completed:            { label: 'Completed',      color: 'bg-green-500/10 text-green-400 border-green-500/20' },
};

async function callUpdateStatus(orderId: string, status: string) {
  await fetch('/api/admin/orders/update-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, status }),
  });
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'orders', id), (snap) => {
      setOrder(snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const handleStatus = useCallback(async (status: string) => {
    if (!order || actionLoading) return;
    setActionLoading(true);
    await callUpdateStatus(order.id, status);
    setActionLoading(false);
  }, [order, actionLoading]);

  const handleDelete = useCallback(async () => {
    if (!order || actionLoading) return;
    setActionLoading(true);
    await deleteDoc(doc(db, 'orders', order.id));
    router.push('/admin/orders');
  }, [order, actionLoading, router]);

  const copyShipping = useCallback(() => {
    if (!order) return;
    const s = order.shippingInfo;
    const text = [
      `Name: ${s.name}`,
      `Address: ${s.street}`,
      `City: ${s.city}`,
      `Postal Code: ${s.zip}`,
      `Country: ${s.country}`,
      `Phone: ${s.phone}`,
      `Email: ${s.email}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [order]);

  const formatDate = (ts: Timestamp | null) => {
    if (!ts) return '—';
    return ts.toDate().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-gray-500">
        <p>Order not found.</p>
        <button onClick={() => router.push('/admin/orders')} className="mt-4 text-sm text-cyan-400 hover:underline">
          ← Back to orders
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;

  return (
    <div className="p-6 max-w-5xl">
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <button
          onClick={() => router.push('/admin/orders')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white border border-white/8 rounded-lg px-3 py-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Orders
        </button>
        <h1 className="text-lg font-bold">
          Order #{order.orderNumber ?? '—'} — {order.shippingInfo?.name}
        </h1>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-7">
        {order.status === 'pending' && (
          <button
            onClick={() => handleStatus('processing')}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm font-semibold hover:bg-cyan-500/20 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Mark as Processing
          </button>
        )}

        {order.status === 'pending_bit_approval' && (
          <>
            <button
              onClick={() => handleStatus('processing')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-semibold hover:bg-green-500/20 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Accept Payment
            </button>
            <button
              onClick={() => handleStatus('bit_declined')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold hover:bg-red-500/20 disabled:opacity-50 transition-colors"
            >
              Decline
            </button>
          </>
        )}

        {order.status === 'processing' && (
          <button
            onClick={() => handleStatus('shipped')}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-sm font-semibold hover:bg-indigo-500/20 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
            Mark as Shipped
          </button>
        )}

        {order.status === 'bit_declined' && (
          <>
            <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold">
              ✕ Payment Declined
            </span>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/8 text-red-500 border border-red-500/15 text-sm font-semibold hover:bg-red-500/15 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Order
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Are you sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Product cards */}
        <div>
          <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-3">Items Ordered</p>
          <div className="flex flex-wrap gap-3">
            {order.items.map((item, i) => {
              const c = item.customization ?? {};
              const hasName   = c.customName   && c.customName   !== 'false';
              const hasNumber = c.customNumber && c.customNumber !== 'false';
              const hasPatch  = c.patchText    && c.patchText    !== 'false';
              const hasPlayer = c.isPlayerVersion === true;
              const hasPants  = c.hasPants      === true;

              return (
                <div key={i} className="w-[148px] rounded-2xl overflow-hidden border border-white/8 bg-white/[0.025] flex flex-col">
                  <div className="relative w-full h-44 bg-[#111]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.teamName}
                        fill
                        className="object-cover"
                        sizes="148px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-700 text-xs">No image</div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    <p className="text-sm font-bold text-white leading-tight">{item.teamName}</p>
                    <p className="text-xs text-gray-400">Size: <span className="text-white font-medium">{item.size}</span></p>
                    {hasName   && <p className="text-xs text-gray-400">Name: <span className="text-white font-medium">{c.customName}</span></p>}
                    {hasNumber && <p className="text-xs text-gray-400">Number: <span className="text-white font-medium">#{c.customNumber}</span></p>}
                    {hasPatch  && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/15 self-start">
                        Patch: {c.patchText}
                      </span>
                    )}
                    {hasPlayer && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/15 self-start">
                        Player Version
                      </span>
                    )}
                    {hasPants  && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/15 self-start">
                        + Pants
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Shipping */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Shipping Info</p>
              <button
                onClick={copyShipping}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/15 px-2 py-1 rounded-md hover:bg-cyan-500/20 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {(
              [
                ['Name',        order.shippingInfo.name],
                ['Address',     order.shippingInfo.street],
                ['City',        order.shippingInfo.city],
                ['Postal Code', order.shippingInfo.zip],
                ['Country',     order.shippingInfo.country],
                ['Phone',       order.shippingInfo.phone],
                ['Email',       order.shippingInfo.email],
              ] as [string, string][]
            ).map(([label, val]) => (
              <div key={label} className="flex gap-3 mb-2 text-sm">
                <span className="text-gray-600 font-medium min-w-[80px]">{label}</span>
                <span className="text-gray-200 break-all">{val || '—'}</span>
              </div>
            ))}
            {order.shippingInfo.notes && order.shippingInfo.notes !== 'false' && (
              <p className="text-xs text-gray-600 italic mt-2">Note: {order.shippingInfo.notes}</p>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-4">Payment</p>
            {(
              [
                ['Method',   order.paymentMethod === 'bit' ? '⚡ BIT' : 'PayPal'],
                ['Status',   order.paymentStatus],
                ['Date',     formatDate(order.createdAt)],
                ['Shipping', `₪${order.shipping ?? 0}`],
              ] as [string, string][]
            ).map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{label}</span>
                <span className="text-gray-200 font-medium">{val}</span>
              </div>
            ))}
            {order.paypalOrderId && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Payment ID</span>
                <span className="text-gray-500 text-xs truncate max-w-[160px]">{order.paypalOrderId}</span>
              </div>
            )}
            {order.bitSenderDetails && (
              <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-500 space-y-1">
                <p>Sender: <span className="text-gray-300">{order.bitSenderDetails.senderName}</span></p>
                <p>Phone: <span className="text-gray-300">{order.bitSenderDetails.senderPhone}</span></p>
                <p>Claimed: <span className="text-gray-300">₪{order.bitSenderDetails.amountPaid}</span></p>
              </div>
            )}
            <div className="flex justify-between text-base font-bold mt-3 pt-3 border-t border-white/5">
              <span className="text-white">Total</span>
              <span className="text-cyan-400">₪{order.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify all states in browser**

Open `/admin/orders`, click an order. Check:
- Product cards show only fields that are filled — no `false` values appear
- Shipping copy button produces correctly formatted plain text
- Action button matches order's current status
- Clicking "Mark as Processing" → status chip updates instantly via `onSnapshot` (no page reload)
- BIT pending → Accept sets status to `processing`; Decline shows red "Payment Declined" label + "Delete Order" button
- Delete button shows confirmation step before deleting
- After delete, navigates back to `/admin/orders`

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/orders/[id]/page.tsx"
git commit -m "feat: add order detail page with product cards, shipping copy, and action buttons"
```

---

### Task 6: Final build check and push

- [ ] **Step 1: Run full build**

```bash
npm run build 2>&1 | tail -30
```
Expected: Route table shows `/admin/orders/[id]` and `/api/admin/orders/update-status`. Zero TypeScript errors.

- [ ] **Step 2: Confirm `.superpowers/` is in `.gitignore`**

```bash
grep ".superpowers" .gitignore
```
Expected: `.superpowers/` present.

- [ ] **Step 3: Push**

```bash
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ Collapsible sidebar with hamburger + localStorage (Task 2)
- ✅ Order list: #N, name, jersey count, total, payment badge (Task 3)
- ✅ Full-screen detail on click (Task 5)
- ✅ Product cards — conditional display, only filled fields shown (Task 5)
- ✅ Shipping info block with copy button (Task 5)
- ✅ `pending` → "Mark as Processing" button → `processing` (Task 5)
- ✅ `processing` → "Mark as Shipped" button → `shipped` (Task 5)
- ✅ BIT Accept → `processing` (Task 5)
- ✅ BIT Decline → `bit_declined` + red label (Task 5)
- ✅ Delete button for declined orders with two-step confirmation (Task 5)
- ✅ Google Sheets column S sync on every status change (Task 4)
- ✅ `orderNumber` atomic counter (Task 1)
- ✅ `imageUrl` stored per item (Task 1)
- ✅ Firestore rules updated for `meta/orderCounter` (Task 1)
- ✅ No data loss — Firestore is source of truth; sheet sync is fire-and-forget (Task 4)

**Placeholder scan:** None. All steps contain complete code.

**Type consistency:**
- `order.status` string values (`pending`, `pending_bit_approval`, `bit_declined`, `processing`, `shipped`, `completed`) are consistent across list page, detail page, `STATUS_LABELS` map, and API validator.
- `callUpdateStatus(orderId, status)` signature matches the API route body `{ orderId, status }`.
- `OrderItem.customization` optional fields (`customName`, `customNumber`, `patchText`, `isPlayerVersion`, `hasPants`) match the conditional checks in the card renderer.
- `orderDoc.id` after the transaction still works — `newOrderRef` is a `DocumentReference` with a stable `.id`.
