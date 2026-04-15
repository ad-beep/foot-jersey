'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { Loader2, ShieldCheck } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  adminEmail: string;
  details?: Record<string, unknown>;
  timestamp: Timestamp | null;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'order.status_changed': { label: 'Status Changed',  color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  'order.bit_approved':   { label: 'BIT Approved',    color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  'order.deleted':        { label: 'Order Deleted',   color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  'product.added':        { label: 'Product Added',   color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  'product.deleted':      { label: 'Product Deleted', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  'discount.created':     { label: 'Discount Created', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  'discount.updated':     { label: 'Discount Updated', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  'discount.deleted':     { label: 'Discount Deleted', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

const ACTION_FILTER_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'order.status_changed', label: 'Status Changed' },
  { value: 'order.bit_approved',   label: 'BIT Approved' },
  { value: 'order.deleted',        label: 'Order Deleted' },
  { value: 'product.added',        label: 'Product Added' },
  { value: 'discount.created',     label: 'Discount Created' },
  { value: 'discount.updated',     label: 'Discount Updated' },
  { value: 'discount.deleted',     label: 'Discount Deleted' },
];

function formatDate(ts: Timestamp | null) {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatDetails(details?: Record<string, unknown>): string {
  if (!details) return '';
  return Object.entries(details)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'adminAuditLog'),
      orderBy('timestamp', 'desc'),
      limit(200),
    );
    const unsub = onSnapshot(q,
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditEntry)));
        setLoading(false);
      },
      (err) => {
        console.error('[AuditLog] Firestore error:', err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (actionFilter && e.action !== actionFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const detailStr = formatDetails(e.details).toLowerCase();
        if (!e.adminEmail.toLowerCase().includes(q) && !detailStr.includes(q)) return false;
      }
      return true;
    });
  }, [entries, actionFilter, search]);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-5">
        <ShieldCheck className="w-5 h-5 text-cyan-400" />
        <h1 className="text-xl font-bold">Audit Log</h1>
        <span className="text-xs text-gray-600 ml-1">Last 200 entries · live</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.04] text-white focus:outline-none"
        >
          {ACTION_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by admin or details…"
          className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.04] text-white placeholder-gray-600 focus:outline-none"
        />
        {(actionFilter || search) && (
          <button
            onClick={() => { setActionFilter(''); setSearch(''); }}
            className="px-3 py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg hover:border-white/20 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600 text-sm py-12 text-center">
          {entries.length === 0 ? 'No audit entries yet.' : 'No entries match the current filter.'}
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-600 mb-3">{filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}</p>
          <div className="rounded-2xl border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-widest">Time</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-widest">Action</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-widest">Admin</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-widest">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => {
                  const style = ACTION_LABELS[entry.action] ?? { label: entry.action, color: 'text-gray-400 bg-white/5 border-white/10' };
                  return (
                    <tr key={entry.id} className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs font-mono">
                        {formatDate(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${style.color}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[180px]">
                        {entry.adminEmail}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDetails(entry.details)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
