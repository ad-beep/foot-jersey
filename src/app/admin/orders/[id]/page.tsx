'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { doc, onSnapshot, deleteDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { writeAuditLog } from '@/lib/audit-log';
import { Loader2, ArrowLeft, Copy, Check, Truck, CheckCircle2, Trash2, PackageCheck, CheckCircle, XCircle } from 'lucide-react';
import { calcOrderCost, type ProductInfo } from '@/lib/cost-utils';

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
  delivered:            { label: 'Delivered',      color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  completed:            { label: 'Completed',      color: 'bg-green-500/10 text-green-400 border-green-500/20' },
};

async function callUpdateStatus(orderId: string, status: string, order?: Order) {
  const orderData = (status === 'processing' && order) ? {
    email: order.shippingInfo.email,
    customerName: order.shippingInfo.name,
    total: order.total,
    subtotal: order.subtotal,
    shipping: order.shipping ?? 0,
    items: order.items.map((item) => ({
      teamName: item.teamName,
      size: item.size,
      quantity: item.quantity || 1,
      totalPrice: item.totalPrice,
      customization: item.customization,
    })),
    shippingAddress: {
      street: order.shippingInfo.street,
      city: order.shippingInfo.city,
      zip: order.shippingInfo.zip,
      country: order.shippingInfo.country,
    },
  } : undefined;

  const currentUser = getAuth().currentUser;
  const idToken = currentUser ? await currentUser.getIdToken() : null;
  const res = await fetch('/api/admin/orders/update-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ orderId, status, orderData }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Status update failed (${res.status})`);
  }
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [productMap, setProductMap] = useState<Map<string, ProductInfo>>(new Map());

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'orders', id), (snap) => {
      setOrder(snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((res) => {
        const map = new Map<string, ProductInfo>();
        for (const p of (res.data ?? res ?? [])) {
          map.set(p.id, { type: p.type || 'regular', isLongSleeve: !!p.isLongSleeve, teamName: p.teamName || '' });
        }
        setProductMap(map);
      })
      .catch(() => {});
  }, []);

  const handleStatus = useCallback(async (status: string) => {
    if (!order || actionLoading) return;
    setActionLoading(true);
    setActionError('');
    try {
      await callUpdateStatus(order.id, status, order);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Status update failed');
    }
    setActionLoading(false);
  }, [order, actionLoading]);

  const handleDelete = useCallback(async () => {
    if (!order || actionLoading) return;
    setActionLoading(true);
    const currentUser = getAuth().currentUser;
    await writeAuditLog({
      action: 'delete_order',
      adminEmail: currentUser?.email ?? 'unknown',
      details: { orderId: order.id, orderNumber: order.orderNumber, customerEmail: order.shippingInfo?.email, total: order.total },
    });
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
            {!confirmDecline ? (
              <button
                onClick={() => setConfirmDecline(true)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold hover:bg-red-500/20 disabled:opacity-50 transition-colors"
              >
                Decline
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Decline this BIT order?</span>
                <button
                  onClick={async () => { setConfirmDecline(false); await handleStatus('bit_declined'); }}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'Declining…' : 'Yes, decline'}
                </button>
                <button
                  onClick={() => setConfirmDecline(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
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

        {order.status === 'shipped' && (
          <button
            onClick={() => handleStatus('delivered')}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-sm font-semibold hover:bg-teal-500/20 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
            Mark as Delivered
          </button>
        )}

        {order.status === 'delivered' && (
          <button
            onClick={() => handleStatus('completed')}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-semibold hover:bg-green-500/20 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Mark as Completed
          </button>
        )}

        {order.status === 'bit_declined' && (
          <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold">
            ✕ Payment Declined
          </span>
        )}

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
      </div>

      {/* Action error */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 text-red-400 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <span className="shrink-0">⚠</span>
          {actionError}
        </div>
      )}

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
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-400">Qty: <span className="text-white font-medium">×{item.quantity}</span></p>
                    )}
                    <p className="text-xs text-gray-400">Price: <span className="text-white font-medium">₪{item.totalPrice}</span></p>
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
            {order.bitSenderDetails && (() => {
              const claimed = parseFloat(order.bitSenderDetails.amountPaid);
              const mismatch = !isNaN(claimed) && Math.abs(claimed - order.total) > 1;
              return (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">BIT Sender Details</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sender Name</span>
                      <span className="text-gray-200 font-medium">{order.bitSenderDetails.senderName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sender Phone</span>
                      <span className="text-gray-200 font-medium">{order.bitSenderDetails.senderPhone}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount Claimed</span>
                      <span className={`font-bold ${mismatch ? 'text-red-400' : 'text-green-400'}`}>
                        ₪{order.bitSenderDetails.amountPaid}
                      </span>
                    </div>
                  </div>
                  {mismatch && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-semibold">
                      ⚠ Amount mismatch — claimed ₪{order.bitSenderDetails.amountPaid} vs order total ₪{order.total}. Verify before approving.
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="flex justify-between text-base font-bold mt-3 pt-3 border-t border-white/5">
              <span className="text-white">Total</span>
              <span className="text-cyan-400">₪{order.total}</span>
            </div>
          </div>

          {/* ── Owner's Cost Receipt ── */}
          {(() => {
            const cost = calcOrderCost(order.items, order.total, order.paymentMethod, productMap);
            const fmtN = (n: number) => n.toFixed(1);
            return (
              <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-4">My Cost Breakdown</p>

                {/* Per-item costs */}
                <div className="flex flex-col gap-3 mb-4">
                  {cost.itemDetails.map((detail, i) => {
                    const item = order.items[i];
                    return (
                      <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-xs font-bold text-white mb-2 truncate">{item.teamName || detail.displayType}</p>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">{detail.displayType} material</span>
                          <span className="text-gray-300">${detail.baseCostUSD} = ₪{fmtN(detail.baseCostUSD * 3.4)}</span>
                        </div>
                        {detail.addOnLines.map((line, j) => (
                          <div key={j} className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{line.split(':')[0]}</span>
                            <span className="text-gray-300">{line.split(':')[1]?.trim()} = ₪{fmtN(parseFloat(line.match(/\$(\d+)/)?.[1] || '0') * 3.4)}</span>
                          </div>
                        ))}
                        {detail.quantity > 1 && (
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Quantity</span>
                            <span className="text-gray-300">× {detail.quantity}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs font-bold pt-1.5 mt-1 border-t border-white/[0.06]">
                          <span className="text-gray-400">Item Cost</span>
                          <span className="text-red-400">₪{fmtN(detail.totalILS)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary lines */}
                <div className="flex flex-col gap-0 border-t border-white/[0.06] pt-3">
                  {[
                    { label: 'Products subtotal', value: `₪${fmtN(cost.productCostILS)}`, color: 'text-gray-300' },
                    {
                      label: cost.shippingFree
                        ? `Shipping (free — ${cost.totalJerseys}+ jerseys)`
                        : `Shipping ($5 = ₪${fmtN(cost.shippingCostILS)})`,
                      value: cost.shippingFree ? '₪0' : `₪${fmtN(cost.shippingCostILS)}`,
                      color: cost.shippingFree ? 'text-green-400' : 'text-gray-300',
                    },
                    { label: `Marketing (${cost.totalJerseys} × ₪15)`, value: `₪${fmtN(cost.marketingILS)}`, color: 'text-gray-300' },
                    ...(cost.paypalCommissionILS > 0
                      ? [{ label: 'PayPal commission (5%)', value: `₪${fmtN(cost.paypalCommissionILS)}`, color: 'text-gray-300' }]
                      : []),
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-xs py-1.5 border-b border-white/[0.04] last:border-0">
                      <span className="text-gray-500">{row.label}</span>
                      <span className={`font-semibold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-3 pt-3 border-t border-white/[0.08] flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Cost</span>
                    <span className="font-bold text-red-400">₪{fmtN(cost.totalCostILS)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Revenue (customer paid)</span>
                    <span className="font-bold text-white">₪{order.total}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold pt-2 border-t border-white/[0.08]">
                    <span className="text-white">Profit</span>
                    <span className={cost.profitILS >= 0 ? 'text-green-400' : 'text-red-400'}>
                      ₪{fmtN(cost.profitILS)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
