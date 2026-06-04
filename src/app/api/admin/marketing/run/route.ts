import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

// Proxies to the cron endpoints and AWAITS their full run. They now finish in
// well under 60s (pooled + parallel sends), so 60s here (the Hobby max) is
// plenty and keeps the whole thing free-plan-safe.
export const maxDuration = 60;

// Admin-triggered manual run of the marketing crons.
// Lets the user verify the system works without waiting 24h for the scheduler.
// Body: { which: 'sequences' | 'reminders' }
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { which } = await request.json();
    if (which !== 'sequences' && which !== 'reminders') {
      return NextResponse.json({ error: 'which must be sequences or reminders' }, { status: 400 });
    }

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET is not configured. Add it in Vercel project settings.' },
        { status: 500 },
      );
    }

    const url = new URL(request.url);
    const base = `${url.protocol}//${url.host}`;
    const path =
      which === 'sequences'
        ? '/api/marketing/send-sequences'
        : '/api/abandoned-cart/send-reminders';

    const res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    const result = await res.json().catch(() => ({}));

    return NextResponse.json({ ok: res.ok, status: res.status, result });
  } catch (err) {
    console.error('[marketing/run] error:', err);
    return NextResponse.json({ error: 'Failed to trigger cron' }, { status: 500 });
  }
}
