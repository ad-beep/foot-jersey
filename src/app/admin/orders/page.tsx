'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Loader2,
  Truck,
  Trash2,
  Package,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle2,
  Clock,
  Smartphone,
  User,
} from 'lucide-react';

interface OrderItem {
  jerseyId: string;
  teamName: string;
  size: string;
  quantity: number;
  totalPrice: number;
  customization?: {
    customName?: string;
    customNumber?: string;
    hasPatch?: boolean;
    patchText?: string;
    hasPants?: boolean;
    isPlayerVersion?: boolean;
  };
}

interface BitSenderDetails {
  senderName: string;
  senderPhone: string;
  amountPaid: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  shippingInfo: {
    name: string;
    phone: string;
    email: string;
    country: string;
    city: string;
    street: string;
    zip: string;
    notes: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  paypalOrderId?: string;
  bitSenderDetails?: BitSenderDetails;
  subtotal: number;
  total: number;
  currency: string;
  status: 'pending' | 'pending_bit_approval' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: Timestamp | null;
}

type TabType = 'all' | 'pending_bit' | 'processing' | 'shipped';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  pending_bit_approval: { label: 'Pending BIT', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  processing: { label: 'Processing', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  shipped: { label: 'Shipped', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const approveOrder = useCallback(async (orderId: string, customerEmail: string) => {
    setActionLoading(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'processing',
        paymentStatus: 'completed',
      });
      // Trigger confirmation email
      await fetch('/api/orders/approve-bit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, customerEmail }),
      });
    } catch (err) {
      console.error('Failed to approve order:', err);
    }
    setActionLoading(null);
  }, []);

  const confirmShipping = useCallback(async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'shipped' });
    } catch (err) {
      console.error('Failed to update order:', err);
    }
    setActionLoading(null);
  }, []);

  const removeOrder = useCallback(async (orderId: string) => {
    if (!window.confirm('Remove this order permanently?')) return;
    setActionLoading(orderId);
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
    setActionLoading(null);
  }, []);

  function formatDate(ts: Timestamp | null) {
    if (!ts) return '—';
    const d = ts.toDate();
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const pendingBitOrders = orders.filter((o) => o.status === 'pending_bit_approval');

  const filteredOrders = (() => {
    switch (activeTab) {
      case 'pending_bit': return pendingBitOrders;
      case 'processing': return orders.filter((o) => o.status === 'processing');
      case 'shipped': return orders.filter((o) => o.status === 'shipped');
      default: return orders;
    }
  })();

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'pending_bit', label: '⚡ Pending BIT', count: pendingBitOrders.length },
    { id: 'processing', label: 'Processing', count: orders.filter((o) => o.status === 'processing').length },
    { id: 'shipped', label: 'Shipped', count: orders.filter((o) => o.status === 'shipped').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Orders</h1>
          <p className="text-sm text-gray-400">
            {orders.length} order{orders.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {pendingBitOrders.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <Clock className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-400 font-medium">
              {pendingBitOrders.length} BIT payment{pendingBitOrders.length !== 1 ? 's' : ''} awaiting approval
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
              activeTab === tab.id
                ? 'text-white bg-white/[0.06] border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab.id === 'pending_bit' && tab.count > 0
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {activeTab === 'pending_bit' ? 'No pending BIT payments' : 'No orders in this category'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const expanded = expandedId === order.id;
            const busy = actionLoading === order.id;
            const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
            const isBitPending = order.status === 'pending_bit_approval';

            return (
              <div
                key={order.id}
                className={`rounded-xl border overflow-hidden transition-colors ${
                  isBitPending
                    ? 'border-orange-500/30 bg-orange-500/[0.03]'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.03] transition-colors"
                >
                  {isBitPending && (
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">
                        {order.shippingInfo.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                      {order.paymentMethod === 'bit' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                          <Smartphone className="w-2.5 h-2.5" />
                          BIT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                      <span>₪{order.total}</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-white/5 p-4 space-y-4">
                    {/* BIT Sender Details (if applicable) */}
                    {order.paymentMethod === 'bit' && order.bitSenderDetails && (
                      <div
                        className="rounded-lg p-3 space-y-2"
                        style={{ backgroundColor: 'rgba(0,195,216,0.06)', border: '1px solid rgba(0,195,216,0.15)' }}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                          BIT Sender Details
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <User className="w-3.5 h-3.5 text-gray-500" />
                            {order.bitSenderDetails.senderName}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <Phone className="w-3.5 h-3.5 text-gray-500" />
                            {order.bitSenderDetails.senderPhone}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <span className="text-gray-500 text-xs">Claimed:</span>
                            ₪{order.bitSenderDetails.amountPaid}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail className="w-3.5 h-3.5 text-gray-500" />
                        {order.shippingInfo.email || '—'}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                        {order.shippingInfo.phone || '—'}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                        {order.paymentMethod}
                        {order.paypalOrderId && (
                          <span className="text-xs text-gray-500 truncate">
                            ({order.paypalOrderId})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                      <span>
                        {[
                          order.shippingInfo.street,
                          order.shippingInfo.city,
                          order.shippingInfo.zip,
                          order.shippingInfo.country,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>

                    {/* Notes */}
                    {order.shippingInfo.notes && (
                      <p className="text-xs text-gray-500 italic">
                        Note: {order.shippingInfo.notes}
                      </p>
                    )}

                    {/* Items */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Items
                      </p>
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm p-2 rounded-lg bg-white/[0.03]"
                        >
                          <div>
                            <span className="font-medium">{item.teamName}</span>
                            <span className="text-gray-500 ml-2">
                              Size {item.size} × {item.quantity}
                            </span>
                            {item.customization?.customName && (
                              <span className="text-xs text-cyan-400 ml-2">
                                #{item.customization.customNumber} {item.customization.customName}
                              </span>
                            )}
                            {item.customization?.isPlayerVersion && (
                              <span className="text-xs text-purple-400 ml-2">Player Ver.</span>
                            )}
                            {item.customization?.hasPatch && (
                              <span className="text-xs text-orange-400 ml-2">+Patch</span>
                            )}
                            {item.customization?.hasPants && (
                              <span className="text-xs text-green-400 ml-2">+Pants</span>
                            )}
                          </div>
                          <span className="text-gray-400 shrink-0">₪{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
                      <span className="text-gray-400">Total</span>
                      <span className="font-bold text-white">₪{order.total}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {/* Approve BIT button */}
                      {isBitPending && (
                        <button
                          onClick={() => approveOrder(order.id, order.shippingInfo.email)}
                          disabled={busy}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-colors disabled:opacity-50 border border-green-500/20"
                        >
                          {busy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Approve BIT Payment
                        </button>
                      )}

                      {/* Confirm shipping */}
                      {(order.status === 'processing' || order.status === 'pending') && (
                        <button
                          onClick={() => confirmShipping(order.id)}
                          disabled={busy}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {busy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Truck className="w-3.5 h-3.5" />
                          )}
                          Confirm Shipping
                        </button>
                      )}

                      <button
                        onClick={() => removeOrder(order.id)}
                        disabled={busy}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
