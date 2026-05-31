'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import {
  Mail,
  Loader2,
  Send,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Megaphone,
  Plus,
  Trash2,
} from 'lucide-react';
import { MARKETING_PER_JERSEY } from '@/lib/cost-utils';

interface ExitIntentLead {
  id: string;
  email: string;
  emailsSent?: string[];
  capturedAt: Timestamp | null;
  convertedAt?: Timestamp | null;
  unsubscribedAt?: Timestamp | null;
}

interface AbandonedCart {
  id: string;
  email: string;
  reminderSent?: boolean;
  updatedAt: Timestamp | null;
}

interface OrderRow {
  id: string;
  items: Array<{ quantity?: number }>;
}

interface MarketingSpend {
  id: string;
  amount: number;
  note: string;
  spentAt: Timestamp | null;
}

interface EnvStatus {
  gmailUser: boolean;
  gmailPass: boolean;
  cronSecret: boolean;
}

interface RunResult {
  ok: boolean;
  status: number;
  result?: Record<string, unknown>;
  error?: string;
}

export default function MarketingPage() {
  const [leads, setLeads] = useState<ExitIntentLead[]>([]);
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [marketingSpends, setMarketingSpends] = useState<MarketingSpend[]>([]);
  const [env, setEnv] = useState<EnvStatus | null>(null);
  const [envError, setEnvError] = useState<string | null>(null);
  const [running, setRunning] = useState<'sequences' | 'reminders' | null>(null);
  const [runResult, setRunResult] = useState<{ which: string; data: RunResult } | null>(null);

  const [spendAmount, setSpendAmount] = useState('');
  const [spendNote, setSpendNote] = useState('');
  const [spendSaving, setSpendSaving] = useState(false);

  // ── Live Firestore subscriptions (admin reads enforced by rules) ────────
  useEffect(() => {
    const q = query(collection(db, 'exitIntentLeads'), orderBy('capturedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExitIntentLead))),
      (err) => console.error('exitIntentLeads subscription error:', err),
    );
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'abandonedCarts'),
      (snap) => setCarts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AbandonedCart))),
      (err) => console.error('abandonedCarts subscription error:', err),
    );
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'orders'),
      (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderRow))),
      (err) => console.error('orders subscription error:', err),
    );
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'marketingSpends'), orderBy('spentAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => setMarketingSpends(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketingSpend))),
      (err) => console.error('marketingSpends subscription error:', err),
    );
    return unsub;
  }, []);

  // ── Env-var status (admin endpoint, doesn't touch Firestore) ────────────
  const fetchEnv = useCallback(async () => {
    const idToken = await getAuth().currentUser?.getIdToken().catch(() => null);
    if (!idToken) {
      setEnvError('Not signed in as admin');
      return;
    }
    try {
      const res = await fetch('/api/admin/marketing/env', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        setEnv(await res.json());
        setEnvError(null);
      } else {
        setEnvError(`Env check failed (${res.status})`);
      }
    } catch (err) {
      setEnvError(err instanceof Error ? err.message : 'Env check failed');
    }
  }, []);

  useEffect(() => {
    fetchEnv();
  }, [fetchEnv]);

  // ── Derived stats ──────────────────────────────────────────────────────
  const leadStats = useMemo(() => {
    const total = leads.length;
    const unsubscribed = leads.filter((l) => !!l.unsubscribedAt).length;
    const converted = leads.filter((l) => !!l.convertedAt).length;
    const active = total - unsubscribed - converted;
    const welcomeSent = leads.filter((l) => l.emailsSent?.includes('welcome')).length;
    const day3Sent = leads.filter((l) => l.emailsSent?.includes('day3')).length;
    const day7Sent = leads.filter((l) => l.emailsSent?.includes('day7')).length;
    return { total, active, unsubscribed, converted, welcomeSent, day3Sent, day7Sent };
  }, [leads]);

  const cartStats = useMemo(() => {
    const pending = carts.filter((c) => c.reminderSent !== true).length;
    const reminded = carts.filter((c) => c.reminderSent === true).length;
    return { pending, reminded };
  }, [carts]);

  const totalJerseys = useMemo(
    () => orders.reduce((s, o) => s + o.items.reduce((q, i) => q + (i.quantity ?? 1), 0), 0),
    [orders],
  );

  const marketingBudget = useMemo(() => {
    const accrued = totalJerseys * MARKETING_PER_JERSEY;
    const spent = marketingSpends.reduce((s, e) => s + (e.amount || 0), 0);
    return { accrued, spent, available: accrued - spent };
  }, [totalJerseys, marketingSpends]);

  const recentLeads = useMemo(() => leads.slice(0, 8), [leads]);

  // ── Actions ────────────────────────────────────────────────────────────
  const runCron = async (which: 'sequences' | 'reminders') => {
    setRunning(which);
    setRunResult(null);
    const idToken = await getAuth().currentUser?.getIdToken().catch(() => null);
    if (!idToken) {
      setRunning(null);
      return;
    }
    try {
      const res = await fetch('/api/admin/marketing/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ which }),
      });
      const data = (await res.json()) as RunResult;
      setRunResult({ which, data });
    } catch (err) {
      setRunResult({
        which,
        data: { ok: false, status: 0, error: err instanceof Error ? err.message : 'Unknown error' },
      });
    } finally {
      setRunning(null);
    }
  };

  const logMarketingSpend = async () => {
    const amount = parseFloat(spendAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSpendSaving(true);
    try {
      await addDoc(collection(db, 'marketingSpends'), {
        amount,
        note: spendNote.trim() || '',
        spentAt: serverTimestamp(),
      });
      setSpendAmount('');
      setSpendNote('');
    } catch (err) {
      console.error('Failed to log marketing spend:', err);
    } finally {
      setSpendSaving(false);
    }
  };

  const deleteMarketingSpend = async (id: string) => {
    if (!confirm('Delete this marketing spend entry?')) return;
    try {
      await deleteDoc(doc(db, 'marketingSpends', id));
    } catch (err) {
      console.error('Failed to delete marketing spend:', err);
    }
  };

  const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
  const envOK = env ? env.gmailUser && env.gmailPass && env.cronSecret : false;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Mail className="w-5 h-5" style={{ color: '#C8A24B' }} />
          Marketing
        </h1>
        <button
          onClick={fetchEnv}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white border border-white/8 rounded-lg px-3 py-1.5 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Marketing budget, ad spend, lead engagement, and manual triggers for the email crons.
      </p>

      {/* ── Marketing Budget panel ────────────────────────────────── */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.03] p-5 flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300/70 mb-1 flex items-center gap-1.5">
              <Megaphone className="w-3 h-3" /> Marketing Budget
            </p>
            <p
              className={`text-3xl font-extrabold tracking-tight ${
                marketingBudget.available >= 0 ? 'text-purple-300' : 'text-red-400'
              }`}
            >
              ₪{fmt(marketingBudget.available)}
            </p>
            <p className="text-[10px] text-gray-600 mt-1">available to spend on ads</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">
              Accrued <span className="text-purple-300 font-bold">₪{fmt(marketingBudget.accrued)}</span>
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Spent <span className="text-orange-300 font-bold">₪{fmt(marketingBudget.spent)}</span>
            </p>
            <p className="text-[10px] text-gray-700 mt-0.5">
              ₪{MARKETING_PER_JERSEY}/jersey · {totalJerseys} jerseys
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(
                100,
                marketingBudget.accrued > 0 ? (marketingBudget.spent / marketingBudget.accrued) * 100 : 0,
              )}%`,
              background:
                marketingBudget.available >= 0
                  ? 'linear-gradient(90deg,#a855f7,#c084fc)'
                  : 'linear-gradient(90deg,#dc2626,#f87171)',
            }}
          />
        </div>

        {/* Log new spend */}
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-gray-600 uppercase tracking-wider">Amount (₪)</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              placeholder="100"
              className="w-24 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.04] text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-[9px] text-gray-600 uppercase tracking-wider">Note (optional)</label>
            <input
              type="text"
              value={spendNote}
              onChange={(e) => setSpendNote(e.target.value)}
              placeholder="Meta ads, TikTok boost…"
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.04] text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <button
            onClick={logMarketingSpend}
            disabled={spendSaving || !spendAmount || parseFloat(spendAmount) <= 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 text-sm font-semibold hover:bg-purple-500/25 disabled:opacity-40 transition-colors"
          >
            {spendSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Log Spend
          </button>
        </div>

        {/* Recent spends */}
        {marketingSpends.length > 0 && (
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-700 mb-2">
              Recent Spends ({marketingSpends.length})
            </p>
            <div className="flex flex-col gap-0 max-h-44 overflow-y-auto pr-1">
              {marketingSpends.map((s) => {
                const when =
                  s.spentAt?.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) ??
                  '—';
                return (
                  <div
                    key={s.id}
                    className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-0 gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-gray-600 font-mono shrink-0 w-12">{when}</span>
                      <span className="text-[11px] text-gray-400 truncate">{s.note || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-orange-300">₪{fmt(s.amount)}</span>
                      <button
                        onClick={() => deleteMarketingSpend(s.id)}
                        className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label="Delete spend"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Env status banner ─────────────────────────────────────── */}
      {envError && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-sm flex items-start gap-3">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold mb-1">Could not check env vars</p>
            <p className="text-xs text-red-300/80">{envError}</p>
          </div>
        </div>
      )}
      {env && !envOK && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold mb-1">Email system not fully configured</p>
            <p className="text-xs text-red-300/80">
              These Vercel env vars are missing. Add them at{' '}
              <span className="font-mono">vercel.com → Project → Settings → Environment Variables</span>
              , then redeploy:
            </p>
            <ul className="text-xs text-red-300/80 mt-2 space-y-0.5 font-mono">
              {!env.gmailUser && <li>• GMAIL_USER (the Gmail address to send from)</li>}
              {!env.gmailPass && (
                <li>• GMAIL_APP_PASSWORD (Gmail app password — not your login password)</li>
              )}
              {!env.cronSecret && <li>• CRON_SECRET (any random string)</li>}
            </ul>
          </div>
        </div>
      )}
      {env && envOK && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-green-500/30 bg-green-500/[0.06] text-green-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>All required env vars are set — Gmail + cron secret configured.</span>
        </div>
      )}

      {/* ── Lead Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox label="Total Leads" value={leadStats.total} />
        <StatBox label="Active" value={leadStats.active} accent="purple" />
        <StatBox label="Converted" value={leadStats.converted} accent="green" />
        <StatBox label="Unsubscribed" value={leadStats.unsubscribed} accent="gray" />
        <StatBox label="Welcome Sent" value={leadStats.welcomeSent} accent="cyan" />
        <StatBox label="Day-3 Sent" value={leadStats.day3Sent} accent="cyan" />
        <StatBox label="Day-7 Sent" value={leadStats.day7Sent} accent="cyan" />
        <StatBox label="Carts Pending" value={cartStats.pending} accent="orange" />
      </div>

      {/* ── Manual run buttons ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => runCron('sequences')}
          disabled={running !== null || (env != null && !envOK)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 text-sm font-semibold hover:bg-purple-500/20 disabled:opacity-40 transition-colors"
        >
          {running === 'sequences' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Run Welcome + Day-3/7 + Daily Blast
        </button>
        <button
          onClick={() => runCron('reminders')}
          disabled={running !== null || (env != null && !envOK)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500/10 text-orange-300 border border-orange-500/30 text-sm font-semibold hover:bg-orange-500/20 disabled:opacity-40 transition-colors"
        >
          {running === 'reminders' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          Run Abandoned-Cart Reminders
        </button>
      </div>

      {/* ── Run result banner ─────────────────────────────────────── */}
      {runResult && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl border text-sm flex items-start gap-3 ${
            runResult.data.ok
              ? 'border-green-500/30 bg-green-500/[0.06] text-green-400'
              : 'border-red-500/40 bg-red-500/10 text-red-300'
          }`}
        >
          {runResult.data.ok ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold mb-1">
              {runResult.data.ok ? 'Run completed' : 'Run failed'} — {runResult.which}
            </p>
            <pre className="text-xs font-mono whitespace-pre-wrap break-words opacity-80">
              {JSON.stringify(runResult.data.result || runResult.data.error || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* ── Recent leads ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
          Recent Leads
        </h2>
        {recentLeads.length === 0 ? (
          <p className="text-sm text-gray-600 py-8 text-center border border-white/8 rounded-xl">
            No leads captured yet. The exit-intent popup feeds this list.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/7 bg-white/[0.02]"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    lead.convertedAt
                      ? 'bg-green-400'
                      : lead.unsubscribedAt
                      ? 'bg-gray-500'
                      : 'bg-purple-400'
                  }`}
                />
                <span className="text-sm text-white font-mono flex-1 truncate">{lead.email}</span>
                <div className="flex gap-1 shrink-0">
                  {(['welcome', 'day3', 'day7'] as const).map((tag) => (
                    <span
                      key={tag}
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        lead.emailsSent?.includes(tag)
                          ? 'bg-cyan-500/15 text-cyan-300'
                          : 'bg-white/5 text-gray-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-gray-600 font-mono shrink-0 hidden md:inline">
                  {lead.capturedAt
                    ? lead.capturedAt.toDate().toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent = 'cyan',
}: {
  label: string;
  value: number;
  accent?: 'cyan' | 'purple' | 'green' | 'gray' | 'orange';
}) {
  const colors = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-300',
    green: 'text-green-400',
    gray: 'text-gray-500',
    orange: 'text-orange-300',
  } as const;
  return (
    <div className="flex flex-col py-4 px-4 rounded-xl border border-white/7 bg-white/[0.02]">
      <span className={`text-2xl font-extrabold tracking-tight ${colors[accent]}`}>{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mt-1">
        {label}
      </span>
    </div>
  );
}
