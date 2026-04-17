import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { sendAbandonedCartEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));

    const q = query(
      collection(db, 'abandonedCarts'),
      where('reminderSent', '==', false),
      where('updatedAt', '<', oneHourAgo),
    );

    const snap = await getDocs(q);
    let sent = 0;
    const errors: string[] = [];

    // Process up to 10 per invocation to stay within edge function timeout
    for (const cartDoc of snap.docs.slice(0, 10)) {
      const cart = cartDoc.data();
      if (!cart.email) continue;

      try {
        await sendAbandonedCartEmail({
          to: cart.email,
          items: cart.items ?? [],
          locale: cart.locale ?? 'en',
        });
        await updateDoc(doc(db, 'abandonedCarts', cartDoc.id), {
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
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
