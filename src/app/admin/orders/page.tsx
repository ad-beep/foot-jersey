'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, Package, Search } from 'lucide-react';

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

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending_bit_approval', label: 'Pending BIT Approval' },
  { value: 'bit_declined', label: 'BIT Declined' },
];

function daysSince(ts: Timestamp | null): number {
  if (!ts) return 0;
  return (Date.now() - ts.toMillis()) / (1000 * 60 * 60 * 24);
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500));
    return onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderSummary)));
      setLoading(false);
    });
  }, []);

  const jerseyCount = (o: OrderSummary) => o.items.reduce((s, i) => s + (i.quantity || 1), 0);

  const displayed = useMemo(() => {
    const tabFilter = TABS.find((t) => t.id === tab)!.filter;
    return orders.filter((o) => {
      if (!tabFilter(o)) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = o.shippingInfo?.name?.toLowerCase().includes(q);
        const matchesId = o.id.toLowerCase().includes(q) ||
          (o.orderNumber != null && String(o.orderNumber).includes(q));
        if (!matchesName && !matchesId) return false;
      }
      return true;
    });
  }, [orders, tab, search, statusFilter]);

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

      {/* Search + Status filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or order ID…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.04] text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:border-cyan-500/40"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

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
            const stale = isBitPending && daysSince(order.createdAt) > 7;
            const staleDays = Math.floor(daysSince(order.createdAt));
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
                {stale && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/20 shrink-0">
                    Stale ({staleDays}d)
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
