'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, Plus, Trash2, ToggleLeft, ToggleRight, Ticket, CheckCircle2, AlertCircle,
} from 'lucide-react';

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
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchDiscounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/discounts');
      const json = await res.json();
      // Filter out cleared/empty rows
      setDiscounts((json.data || []).filter((d: Discount) => d.code));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !value) return;
    setSaving(true);

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          type,
          value: parseFloat(value),
          min_order: parseFloat(minOrder) || 0,
          max_uses: parseInt(maxUses) || 0,
          expiry_date: expiryDate || '',
        }),
      });

      if (res.ok) {
        const created = code.toUpperCase().trim();
        setCode('');
        setValue('');
        setMinOrder('');
        setMaxUses('');
        setExpiryDate('');
        await fetchDiscounts();
        setToast({ message: `Discount code "${created}" created successfully!`, type: 'success' });
      } else {
        const json = await res.json();
        setToast({ message: json.error || 'Failed to create discount code', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Network error — could not create discount code', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(d: Discount) {
    const newActive = d.is_active === 'false' ? 'true' : 'false';
    try {
      await fetch('/api/admin/discounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: d.code, is_active: newActive }),
      });
      await fetchDiscounts();
      setToast({ message: `"${d.code}" ${newActive === 'true' ? 'activated' : 'deactivated'}`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to update code', type: 'error' });
    }
  }

  async function handleDelete(d: Discount) {
    if (!window.confirm(`Delete code "${d.code}"?`)) return;
    try {
      await fetch(`/api/admin/discounts?code=${encodeURIComponent(d.code)}`, {
        method: 'DELETE',
      });
      await fetchDiscounts();
      setToast({ message: `"${d.code}" deleted`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete code', type: 'error' });
    }
  }

  function getStatus(d: Discount): { label: string; cls: string } {
    if (d.is_active === 'false') return { label: 'Inactive', cls: 'text-gray-400 bg-gray-500/10' };
    if (d.expiry_date && new Date(d.expiry_date) < new Date()) return { label: 'Expired', cls: 'text-red-400 bg-red-500/10' };
    const max = parseInt(d.max_uses) || 0;
    const cur = parseInt(d.current_uses) || 0;
    if (max > 0 && cur >= max) return { label: 'Depleted', cls: 'text-orange-400 bg-orange-500/10' };
    return { label: 'Active', cls: 'text-green-400 bg-green-500/10' };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-500/15 text-green-400 border border-green-500/30'
              : 'bg-red-500/15 text-red-400 border border-red-500/30'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-1">Discount Codes</h1>
      <p className="text-sm text-gray-400 mb-8">Create and manage promotional codes</p>

      {/* Create form */}
      <form onSubmit={handleCreate} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] mb-8 space-y-4">
        <p className="text-sm font-semibold">Create New Code</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            className="admin-input font-mono tracking-wider"
            required
          />
          <select value={type} onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')} className="admin-select">
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₪)</option>
          </select>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === 'percentage' ? 'e.g. 15' : 'e.g. 20'}
            className="admin-input"
            min="1"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            placeholder="Min order (₪)"
            className="admin-input"
            min="0"
          />
          <input
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Max uses (0=∞)"
            className="admin-input"
            min="0"
          />
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="admin-input"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Create Code
        </button>
      </form>

      {/* Codes table */}
      {discounts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No discount codes yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-white/10">
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Discount</th>
                <th className="py-2 pr-4">Min Order</th>
                <th className="py-2 pr-4">Uses</th>
                <th className="py-2 pr-4">Expiry</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => {
                const status = getStatus(d);
                return (
                  <tr key={d.code} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 pr-4 font-mono font-bold tracking-wider">{d.code}</td>
                    <td className="py-3 pr-4">
                      {d.type === 'percentage' ? `${d.value}%` : `₪${d.value}`}
                    </td>
                    <td className="py-3 pr-4 text-gray-400">
                      {parseInt(d.min_order) > 0 ? `₪${d.min_order}` : '—'}
                    </td>
                    <td className="py-3 pr-4 text-gray-400">
                      {d.current_uses}/{parseInt(d.max_uses) > 0 ? d.max_uses : '∞'}
                    </td>
                    <td className="py-3 pr-4 text-gray-400">
                      {d.expiry_date ? new Date(d.expiry_date).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive(d)}
                          className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-cyan-400 transition-colors"
                          title={d.is_active === 'false' ? 'Activate' : 'Deactivate'}
                        >
                          {d.is_active === 'false' ? (
                            <ToggleLeft className="w-4 h-4" />
                          ) : (
                            <ToggleRight className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
