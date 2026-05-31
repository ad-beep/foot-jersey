import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { sendMarketingWelcomeEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Stay generous — a real burst from 100k TikTok views can fire ~5/sec. But
// block bots that hammer the endpoint thousands of times from one IP.
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit({ key: `exit-intent:${ip}`, windowMs: 60_000, max: 5 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    }

    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Always save the lead first. The discount code is already in localStorage
    // on the client, so the user gets value even if the welcome email never goes.
    const docRef = await addDoc(collection(db, 'exitIntentLeads'), {
      email,
      capturedAt: serverTimestamp(),
      source: 'exit_intent',
      discountCode: 'STAY10',
      emailsSent: [],
    });

    // Fire-and-forget the welcome email. Under a 100k-view spike, Gmail SMTP
    // will rate-limit aggressively — awaiting here would block the popup and
    // make it feel broken. If the email fails or never starts (cold-start
    // termination), the next /api/marketing/send-sequences cron run picks up
    // any lead missing "welcome" in emailsSent.
    sendMarketingWelcomeEmail({ to: email, discountCode: 'STAY10' })
      .then(() => updateDoc(docRef, { emailsSent: ['welcome'] }))
      .catch((err) => console.error('[exit-intent] welcome email failed (cron will retry):', err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('exit-intent capture error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
