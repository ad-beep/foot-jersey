import { NextRequest, NextResponse } from 'next/server';
import { sendAbandonedCartEmail } from '@/lib/email';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// firebase-admin requires the Node runtime; give the SMTP batch room past the
// ~15s default (60s is the Hobby max).
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const oneHourAgoMs = Date.now() - 60 * 60 * 1000;

    // Single-field query only (auto-indexed). The previous version added a
    // second where('updatedAt','<',…), which made it a COMPOUND query that
    // required a composite index that didn't exist (failed-precondition → 500).
    // We instead apply the "older than 1 hour" window in code below.
    const snap = await db.collection('abandonedCarts').where('reminderSent', '==', false).get();

    const due = snap.docs.filter((d) => {
      const u = d.data().updatedAt;
      const ms = u?.toMillis?.() ?? (u?.seconds ?? 0) * 1000;
      return ms > 0 && ms < oneHourAgoMs;
    });

    let sent = 0;
    const errors: string[] = [];

    // Process up to 10 per invocation to stay within the function timeout.
    for (const cartDoc of due.slice(0, 10)) {
      const cart = cartDoc.data();
      if (!cart.email) continue;

      try {
        await sendAbandonedCartEmail({
          to: cart.email,
          items: cart.items ?? [],
          locale: cart.locale ?? 'en',
        });
        await cartDoc.ref.update({
          reminderSent: true,
          reminderSentAt: Timestamp.now(),
        });
        sent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${cart.email}: ${msg}`);
        console.error(`Failed to process abandoned cart ${cartDoc.id}:`, err);
      }
    }

    return NextResponse.json({ ok: true, sent, errors: errors.length > 0 ? errors : undefined });
  } catch (err) {
    console.error('send-reminders error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
