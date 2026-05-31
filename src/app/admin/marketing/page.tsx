'use client';

import { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';

interface MarketingStatus {
  leads: {
    total: number;
    active: number;
    unsubscribed: number;
    converted: number;
    welcomeSent: number;
    day3Sent: number;
    day7Sent: number;
  };
  abandonedCarts: { pending: number; reminded: number };
  recentLeads: Array<{
    email: string;
    emailsSent: string[];
    converted: boolean;
    unsubscribed: boolean;
    capturedAt: string | null;
  }>;
  env: { gmailUser: boolean; gmailPass: boolean; cronSecret: boolean };
}

interface RunResult {
  ok: boolean;
  status: number;
  result?: Record<string, unknown>;
  error?: string;
}

export default function MarketingPage() {
  const [status, setStatus] = useState<MarketingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<'sequences' | 'reminders' | null>(null);
  const [runResult, setRunResult] = useState<{ which: string; data: RunResult } | null>(null);

  const fetchStatus = useCallback(async () => {
    const idToken = await getAuth().currentUser?.getIdToken().catch(() => null);
    if (!idToken) return;
    try {
      const res = await fetch('/api/admin/marketing/status', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch marketing status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

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
      // Refresh status after a successful run
      fetchStatus();
    } catch (err) {
      setRunResult({
        which,
        data: { ok: false, status: 0, error: err instanceof Error ? err.message : 'Unknown error' },
      });
    } finally {
      setRunning(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C8A24B' }} />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-6 text-gray-500">
        <p>Could not load marketing status.</p>
        <button
          onClick={fetchStatus}
          className="mt-4 text-sm text-cyan-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const envOK = status.env.gmailUser && status.env.gmailPass && status.env.cronSecret;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Mail className="w-5 h-5" style={{ color: '#C8A24B' }} />
          Email Marketing
        </h1>
        <button
          onClick={fetchStatus}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white border border-white/8 rounded-lg px-3 py-1.5 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Verify the email system is sending welcome emails, abandoned-cart reminders, and marketing
        blasts. Use the buttons below to fire each job manually.
      </p>

      {/* ── Env status banner ─────────────────────────────────────── */}
      {!envOK && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold mb-1">Email system not fully configured</p>
            <p className="text-xs text-red-300/80">
              The following Vercel env vars are missing — add them at <span className="font-mono">vercel.com → Project → Settings → Environment Variables</span>, then redeploy:
            </p>
            <ul className="text-xs text-red-300/80 mt-2 space-y-0.5 font-mono">
              {!status.env.gmailUser && <li>• GMAIL_USER (the Gmail address to send from)</li>}
              {!status.env.gmailPass && <li>• GMAIL_APP_PASSWORD (Gmail app-password, not your login password)</li>}
              {!status.env.cronSecret && <li>• CRON_SECRET (any random string — protects the cron endpoints)</li>}
            </ul>
          </div>
        </div>
      )}
      {envOK && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-green-500/30 bg-green-500/[0.06] text-green-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>All required env vars are set — Gmail + cron secret configured.</span>
        </div>
      )}

      {/* ── Lead Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox label="Total Leads" value={status.leads.total} />
        <StatBox label="Active" value={status.leads.active} accent="purple" />
        <StatBox label="Converted" value={status.leads.converted} accent="green" />
        <StatBox label="Unsubscribed" value={status.leads.unsubscribed} accent="gray" />
        <StatBox label="Welcome Sent" value={status.leads.welcomeSent} accent="cyan" />
        <StatBox label="Day-3 Sent" value={status.leads.day3Sent} accent="cyan" />
        <StatBox label="Day-7 Sent" value={status.leads.day7Sent} accent="cyan" />
        <StatBox label="Carts Pending" value={status.abandonedCarts.pending} accent="orange" />
      </div>

      {/* ── Manual run buttons ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => runCron('sequences')}
          disabled={running !== null || !envOK}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 text-sm font-semibold hover:bg-purple-500/20 disabled:opacity-40 transition-colors"
        >
          {running === 'sequences' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Run Welcome + Day-3/7 + Daily Blast
        </button>
        <button
          onClick={() => runCron('reminders')}
          disabled={running !== null || !envOK}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500/10 text-orange-300 border border-orange-500/30 text-sm font-semibold hover:bg-orange-500/20 disabled:opacity-40 transition-colors"
        >
          {running === 'reminders' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
          Run Abandoned-Cart Reminders
        </button>
      </div>

      {/* ── Result banner from last manual run ────────────────────── */}
      {runResult && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl border text-sm flex items-start gap-3 ${
            runResult.data.ok
              ? 'border-green-500/30 bg-green-500/[0.06] text-green-400'
              : 'border-red-500/40 bg-red-500/10 text-red-300'
          }`}
        >
          {runResult.data.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
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
        {status.recentLeads.length === 0 ? (
          <p className="text-sm text-gray-600 py-8 text-center border border-white/8 rounded-xl">
            No leads captured yet. The exit-intent popup feeds this list.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {status.recentLeads.map((lead, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/7 bg-white/[0.02]"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    lead.converted
                      ? 'bg-green-400'
                      : lead.unsubscribed
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
                        lead.emailsSent.includes(tag)
                          ? 'bg-cyan-500/15 text-cyan-300'
                          : 'bg-white/5 text-gray-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-gray-600 font-mono shrink-0 hidden md:inline">
                  {lead.capturedAt ? new Date(lead.capturedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
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
