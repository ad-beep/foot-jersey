import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { requireAdmin } from '@/lib/admin-auth';

// Returns a snapshot of the marketing/email subsystem so the admin can verify
// that things are flowing. Lightweight — runs whenever the admin opens the page.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const leadsSnap = await getDocs(collection(db, 'exitIntentLeads'));
    const leads = leadsSnap.docs.map((d) => d.data() as Record<string, unknown>);

    const totalLeads = leads.length;
    const unsubscribed = leads.filter((l) => !!l.unsubscribedAt).length;
    const converted = leads.filter((l) => !!l.convertedAt).length;
    const active = leads.filter((l) => !l.unsubscribedAt && !l.convertedAt).length;
    const welcomeSent = leads.filter((l) => Array.isArray(l.emailsSent) && (l.emailsSent as string[]).includes('welcome')).length;
    const day3Sent = leads.filter((l) => Array.isArray(l.emailsSent) && (l.emailsSent as string[]).includes('day3')).length;
    const day7Sent = leads.filter((l) => Array.isArray(l.emailsSent) && (l.emailsSent as string[]).includes('day7')).length;

    // Abandoned carts — show counts of pending vs reminded
    let abandonedPending = 0;
    let abandonedReminded = 0;
    try {
      const cartsSnap = await getDocs(collection(db, 'abandonedCarts'));
      cartsSnap.forEach((d) => {
        const data = d.data();
        if (data.reminderSent === true) abandonedReminded += 1;
        else abandonedPending += 1;
      });
    } catch {
      // Collection might not exist yet
    }

    // Recent leads for a quick visual sanity check
    const recentSnap = await getDocs(query(
      collection(db, 'exitIntentLeads'),
      orderBy('capturedAt', 'desc'),
      limit(8),
    )).catch(() => null);

    const recentLeads = recentSnap
      ? recentSnap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = data.capturedAt as { toDate?: () => Date } | undefined;
          return {
            email: String(data.email || '—'),
            emailsSent: (data.emailsSent as string[]) ?? [],
            converted: !!data.convertedAt,
            unsubscribed: !!data.unsubscribedAt,
            capturedAt: ts?.toDate?.()?.toISOString() ?? null,
          };
        })
      : [];

    const env = {
      gmailUser: !!process.env.GMAIL_USER,
      gmailPass: !!process.env.GMAIL_APP_PASSWORD,
      cronSecret: !!process.env.CRON_SECRET,
    };

    return NextResponse.json({
      leads: { total: totalLeads, active, unsubscribed, converted, welcomeSent, day3Sent, day7Sent },
      abandonedCarts: { pending: abandonedPending, reminded: abandonedReminded },
      recentLeads,
      env,
    });
  } catch (err) {
    console.error('[marketing/status] error:', err);
    return NextResponse.json({ error: 'Failed to load status' }, { status: 500 });
  }
}
