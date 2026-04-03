'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, TrendingUp, ShoppingBag, Monitor } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────
const USD_TO_ILS = 3.4;
const MARKETING_PER_JERSEY = 15;
const PAYPAL_RATE = 0.05;

// ─── Types ───────────────────────────────────────────────────
interface OrderItem {
  jerseyId: string;
  teamName: string;
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
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: Timestamp | null;
}

interface ProductInfo {
  type: string;
  isLongSleeve: boolean;
  teamName: string;
}

type TimeRange = 'day' | 'week' | 'month';

// ─── Cost helpers ─────────────────────────────────────────────
function getMaterialCostUSD(item: OrderItem, productMap: Map<string, ProductInfo>): number {
  const product = productMap.get(item.jerseyId);
  const jerseyType = product?.type || 'regular';
  const isLongSleeve = product?.isLongSleeve || false;
  const isPlayer = item.customization?.isPlayerVersion === true;
  const nameLow = (item.teamName || product?.teamName || '').toLowerCase();

  let cost = 8; // Fan Edition default

  if (jerseyType === 'kids') {
    cost = 10;
  } else if (jerseyType === 'retro') {
    cost = isLongSleeve ? 15 : 10;
  } else if (jerseyType === 'other_products') {
    const isSocks = nameLow.includes('sock') || nameLow.includes('גרב');
    cost = isSocks ? 3 : 11;
  } else {
    // regular, special, drip, world_cup, stussy
    if (isPlayer && isLongSleeve) cost = 15;
    else if (isPlayer) cost = 10;
    else if (isLongSleeve) cost = 14;
    else cost = 8;
  }

  // Add-ons
  const hasNameNum =
    (item.customization?.customName && item.customization.customName !== 'false') ||
    (item.customization?.customNumber && item.customization.customNumber !== 'false');
  if (hasNameNum) cost += 2;
  if (item.customization?.patchText && item.customization.patchText !== 'false') cost += 1;
  if (item.size === '3XL') cost += 1;
  if (item.size === '4XL') cost += 2;

  return cost;
}

function getDisplayType(item: OrderItem, productMap: Map<string, ProductInfo>): string {
  const product = productMap.get(item.jerseyId);
  const jerseyType = product?.type || 'regular';
  const isLongSleeve = product?.isLongSleeve || false;
  const isPlayer = item.customization?.isPlayerVersion === true;
  const nameLow = (item.teamName || product?.teamName || '').toLowerCase();

  if (jerseyType === 'kids') return 'Kids Package';
  if (jerseyType === 'retro') return isLongSleeve ? 'Retro Long Sleeve' : 'Retro';
  if (jerseyType === 'special') return 'Special Edition';
  if (jerseyType === 'drip') return 'Drip';
  if (jerseyType === 'world_cup') return 'World Cup';
  if (jerseyType === 'stussy') return 'Stussy';
  if (jerseyType === 'other_products') {
    const isSocks = nameLow.includes('sock') || nameLow.includes('גרב');
    return isSocks ? 'Socks' : 'Adult Package';
  }
  // regular
  if (isPlayer && isLongSleeve) return 'Long Sleeve Player';
  if (isPlayer) return 'Player';
  if (isLongSleeve) return 'Long Sleeve Fan';
  return 'Fan Edition';
}

// ─── Revenue chart data ───────────────────────────────────────
function buildChartData(orders: Order[], range: TimeRange): { name: string; revenue: number }[] {
  const now = new Date();

  if (range === 'day') {
    return Array.from({ length: 24 }, (_, i) => {
      const h = new Date(now.getTime() - (23 - i) * 3600000);
      const label = `${h.getHours()}:00`;
      const revenue = orders
        .filter((o) => {
          if (!o.createdAt) return false;
          const d = o.createdAt.toDate();
          return d.getHours() === h.getHours() && d.toDateString() === h.toDateString();
        })
        .reduce((s, o) => s + o.total, 0);
      return { name: label, revenue };
    });
  }

  if (range === 'week') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 86400000);
      const revenue = orders
        .filter((o) => {
          if (!o.createdAt) return false;
          return o.createdAt.toDate().toDateString() === d.toDateString();
        })
        .reduce((s, o) => s + o.total, 0);
      return { name: days[d.getDay()], revenue };
    });
  }

  // month
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 86400000);
    const revenue = orders
      .filter((o) => {
        if (!o.createdAt) return false;
        return o.createdAt.toDate().toDateString() === d.toDateString();
      })
      .reduce((s, o) => s + o.total, 0);
    return { name: `${d.getDate()}/${d.getMonth() + 1}`, revenue };
  });
}

// ─── SVG Line/Area Chart ──────────────────────────────────────
function LineChart({ data, color = '#22d3ee' }: { data: { name: string; revenue: number }[]; color?: string }) {
  if (data.length < 2) {
    return <div className="w-full h-16 flex items-center justify-center text-xs text-gray-700">No data yet</div>;
  }
  const W = 300;
  const H = 64;
  const PAD_BOTTOM = 16;
  const chartH = H - PAD_BOTTOM;
  const maxVal = Math.max(...data.map((d) => d.revenue), 1);

  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: chartH - (d.revenue / maxVal) * (chartH - 4),
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${W},${chartH} L0,${chartH} Z`;
  const gradId = `lg-${color.replace('#', '')}`;

  // Show labels at first, middle, last
  const labelIs = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) =>
        labelIs.includes(i) ? (
          <text key={i} x={p.x} y={H} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize="7" fill="#4b5563">
            {p.name}
          </text>
        ) : null,
      )}
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3" fill={color} />
    </svg>
  );
}

// ─── Horizontal Bar ───────────────────────────────────────────
function HBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-[100px] text-right shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold text-gray-400 w-5 shrink-0">{count}</span>
    </div>
  );
}

// ─── Vertical Bar ─────────────────────────────────────────────
function VBarGroup({ items }: { items: { label: string; count: number; color: string }[] }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="flex items-end gap-2 h-16">
      {items.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <div
            className="w-full rounded-t"
            style={{ height: `${(item.count / max) * 100}%`, background: item.color, minHeight: item.count > 0 ? 4 : 0 }}
          />
          <span className="text-[9px] text-gray-500 text-center font-semibold leading-tight">{item.label}</span>
          {item.count > 0 && <span className="text-[9px] font-bold text-gray-400">{item.count}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productMap, setProductMap] = useState<Map<string, ProductInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  // Load orders from Firestore
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
  }, []);

  // Load products for type mapping
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((res) => {
        const map = new Map<string, ProductInfo>();
        const list = res.data ?? res ?? [];
        for (const p of list) {
          map.set(p.id, { type: p.type || 'regular', isLongSleeve: !!p.isLongSleeve, teamName: p.teamName || '' });
        }
        setProductMap(map);
      })
      .catch(() => {/* non-fatal: costs degrade to estimates */});
  }, []);

  // ─── Metrics ───────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const paypalRevenue = orders.filter((o) => o.paymentMethod === 'paypal').reduce((s, o) => s + (o.total || 0), 0);
    const bitRevenue = orders.filter((o) => o.paymentMethod === 'bit').reduce((s, o) => s + (o.total || 0), 0);

    // Total jerseys (sum of all item quantities)
    const totalJerseys = orders.reduce(
      (s, o) => s + o.items.reduce((is, item) => is + (item.quantity || 1), 0),
      0,
    );

    // Product material costs
    const productCost = orders.reduce((s, o) => {
      return (
        s +
        o.items.reduce((is, item) => {
          const qty = item.quantity || 1;
          const costUSD = getMaterialCostUSD(item, productMap);
          return is + costUSD * USD_TO_ILS * qty;
        }, 0)
      );
    }, 0);

    const marketing = totalJerseys * MARKETING_PER_JERSEY;
    const paypalCommission = paypalRevenue * PAYPAL_RATE;
    const totalCost = productCost + marketing + paypalCommission;
    const totalProfit = totalRevenue - totalCost;

    return { totalOrders, totalRevenue, totalProfit, totalJerseys, paypalRevenue, bitRevenue, productCost, marketing, paypalCommission, totalCost };
  }, [orders, productMap]);

  // ─── Revenue chart ─────────────────────────────────────────
  const chartData = useMemo(() => buildChartData(orders, timeRange), [orders, timeRange]);

  // ─── Jersey type breakdown ──────────────────────────────────
  const jerseyTypeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const order of orders) {
      for (const item of order.items) {
        const type = getDisplayType(item, productMap);
        map[type] = (map[type] || 0) + (item.quantity || 1);
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);
  }, [orders, productMap]);

  // ─── Add-ons breakdown ─────────────────────────────────────
  const addonCounts = useMemo(() => {
    let nameNum = 0, pants = 0, playerVer = 0, patch = 0, socks = 0;
    for (const order of orders) {
      for (const item of order.items) {
        const c = item.customization;
        const qty = item.quantity || 1;
        const nameLow = (item.teamName || '').toLowerCase();
        if ((c?.customName && c.customName !== 'false') || (c?.customNumber && c.customNumber !== 'false')) nameNum += qty;
        if (c?.hasPants) pants += qty;
        if (c?.isPlayerVersion) playerVer += qty;
        if (c?.patchText && c.patchText !== 'false') patch += qty;
        if (nameLow.includes('sock') || nameLow.includes('גרב')) socks += qty;
      }
    }
    return { nameNum, pants, playerVer, patch, socks };
  }, [orders]);

  // ─── Render ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

  const TYPE_COLORS: Record<string, string> = {
    'Fan Edition': 'linear-gradient(90deg,#0891b2,#22d3ee)',
    'Player': 'linear-gradient(90deg,#7c3aed,#a78bfa)',
    'Retro': 'linear-gradient(90deg,#d97706,#fbbf24)',
    'Kids Package': 'linear-gradient(90deg,#059669,#34d399)',
    'Long Sleeve Fan': 'linear-gradient(90deg,#0e7490,#06b6d4)',
    'Long Sleeve Player': 'linear-gradient(90deg,#6d28d9,#8b5cf6)',
    'Retro Long Sleeve': 'linear-gradient(90deg,#b45309,#f59e0b)',
    'Adult Package': 'linear-gradient(90deg,#1d4ed8,#60a5fa)',
    'Socks': 'linear-gradient(90deg,#374151,#9ca3af)',
    'Special Edition': 'linear-gradient(90deg,#db2777,#f472b6)',
    'Drip': 'linear-gradient(90deg,#dc2626,#f87171)',
    'World Cup': 'linear-gradient(90deg,#047857,#10b981)',
    'Stussy': 'linear-gradient(90deg,#92400e,#d97706)',
  };

  const maxTypeCount = jerseyTypeCounts.length > 0 ? jerseyTypeCounts[0][1] : 1;

  return (
    <div className="p-6 max-w-[1200px]">
      <h1 className="text-xl font-bold mb-1">Admin Cockpit</h1>
      <p className="text-sm text-gray-500 mb-8">Business performance at a glance</p>

      {/* ── Top 3 Metrics ── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="flex flex-col items-center py-7 px-4 rounded-2xl border border-white/7 bg-white/[0.02]">
          <TrendingUp className="w-4 h-4 text-green-500 mb-3 opacity-60" />
          <span className={`text-3xl font-extrabold tracking-tight ${metrics.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ₪{fmt(metrics.totalProfit)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mt-2">Total Profit</span>
        </div>
        <div className="flex flex-col items-center py-7 px-4 rounded-2xl border border-white/7 bg-white/[0.02]">
          <ShoppingBag className="w-4 h-4 text-cyan-500 mb-3 opacity-60" />
          <span className="text-3xl font-extrabold tracking-tight text-cyan-400">{metrics.totalOrders}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mt-2">Total Orders</span>
        </div>
        <div className="flex flex-col items-center py-7 px-4 rounded-2xl border border-white/7 bg-white/[0.02]">
          <Monitor className="w-4 h-4 text-purple-400 mb-3 opacity-60" />
          <span className="text-3xl font-extrabold tracking-tight text-purple-400">—</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mt-2">Website Visits</span>
        </div>
      </div>

      {/* ── 3 Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Card 1: Total Revenue ── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-extrabold text-green-400 tracking-tight">₪{fmt(metrics.totalRevenue)}</p>
          </div>

          {/* Time filter */}
          <div className="flex gap-1.5">
            {(['day', 'week', 'month'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                  timeRange === r
                    ? 'bg-cyan-500/12 border-cyan-500/30 text-cyan-400'
                    : 'border-white/8 text-gray-600 hover:text-gray-400'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Revenue line chart */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-700 mb-2">
              Revenue — Last {timeRange === 'day' ? '24h' : timeRange === 'week' ? '7 days' : '30 days'}
            </p>
            <LineChart data={chartData} color="#22d3ee" />
          </div>

          <div className="h-px bg-white/[0.05]" />

          {/* PayPal vs BIT */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-700 mb-3">Payment Breakdown</p>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-xl border border-white/7 bg-white/[0.02]">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">PayPal</p>
                <p className="text-base font-extrabold text-white">₪{fmt(metrics.paypalRevenue)}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {metrics.totalRevenue > 0 ? Math.round((metrics.paypalRevenue / metrics.totalRevenue) * 100) : 0}% of revenue
                </p>
              </div>
              <div className="flex-1 p-3 rounded-xl border border-white/7 bg-white/[0.02]">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">⚡ BIT</p>
                <p className="text-base font-extrabold text-white">₪{fmt(metrics.bitRevenue)}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {metrics.totalRevenue > 0 ? Math.round((metrics.bitRevenue / metrics.totalRevenue) * 100) : 0}% of revenue
                </p>
              </div>
            </div>
            {/* Bar visual */}
            {metrics.totalRevenue > 0 && (
              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-blue-500/60 rounded-l-full"
                  style={{ width: `${(metrics.paypalRevenue / metrics.totalRevenue) * 100}%` }}
                />
                <div
                  className="h-full bg-orange-500/60 rounded-r-full flex-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Card 2: Total Costs ── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Total Costs</p>
            <p className="text-2xl font-extrabold text-red-400 tracking-tight">₪{fmt(metrics.totalCost)}</p>
          </div>

          {/* Cost bars chart */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-700 mb-3">Breakdown</p>
            {(() => {
              const items = [
                { label: 'Product Cost', value: metrics.productCost, color: '#ef4444' },
                { label: 'Marketing (×15₪)', value: metrics.marketing, color: '#a855f7' },
                { label: 'PayPal 5%', value: metrics.paypalCommission, color: '#3b82f6' },
              ];
              const maxVal = Math.max(...items.map((i) => i.value), 1);
              return (
                <div className="flex items-end gap-3 h-20">
                  {items.map((item) => (
                    <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[9px] font-bold text-white">{item.value > 0 ? `₪${fmt(item.value)}` : ''}</span>
                      <div
                        className="w-full rounded-t min-h-[4px]"
                        style={{
                          height: `${Math.max((item.value / maxVal) * 65, item.value > 0 ? 4 : 0)}px`,
                          background: item.color,
                          opacity: 0.8,
                        }}
                      />
                      <span className="text-[9px] text-gray-600 text-center leading-tight">{item.label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="h-px bg-white/[0.05]" />

          {/* Cost rows */}
          <div className="flex flex-col gap-0">
            {[
              { dot: '#ef4444', label: 'Product Costs', value: metrics.productCost },
              { dot: '#a855f7', label: `Marketing (${metrics.totalJerseys} jerseys × ₪15)`, value: metrics.marketing },
              { dot: '#3b82f6', label: 'PayPal Commission (5%)', value: metrics.paypalCommission },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: row.dot }} />
                  <span className="text-[11px] text-gray-400">{row.label}</span>
                </div>
                <span className="text-xs font-bold text-white">₪{fmt(row.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Card 3: Order Quantity ── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Order Quantity</p>
            <p className="text-2xl font-extrabold text-cyan-400 tracking-tight">{metrics.totalJerseys} jerseys</p>
          </div>

          {/* Jersey type horizontal bars */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-700 mb-3">Jersey Type</p>
            <div className="flex flex-col gap-2">
              {jerseyTypeCounts.length === 0 ? (
                <p className="text-xs text-gray-700">No data yet</p>
              ) : (
                jerseyTypeCounts.map(([type, count]) => (
                  <HBar
                    key={type}
                    label={type}
                    count={count}
                    max={maxTypeCount}
                    color={TYPE_COLORS[type] || 'linear-gradient(90deg,#374151,#6b7280)'}
                  />
                ))
              )}
            </div>
          </div>

          <div className="h-px bg-white/[0.05]" />

          {/* Add-ons vertical bars */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-700 mb-3">Add-ons</p>
            <VBarGroup
              items={[
                { label: 'Name & No.', count: addonCounts.nameNum, color: 'linear-gradient(180deg,#22d3ee,#0891b2)' },
                { label: 'Pants', count: addonCounts.pants, color: 'linear-gradient(180deg,#4ade80,#16a34a)' },
                { label: 'Player Ver.', count: addonCounts.playerVer, color: 'linear-gradient(180deg,#a78bfa,#7c3aed)' },
                { label: 'Patch', count: addonCounts.patch, color: 'linear-gradient(180deg,#fbbf24,#d97706)' },
                { label: 'Socks', count: addonCounts.socks, color: 'linear-gradient(180deg,#94a3b8,#475569)' },
              ]}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
