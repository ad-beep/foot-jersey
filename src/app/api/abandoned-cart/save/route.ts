import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Cap at 30 saves/minute per IP. The cart auto-saves while the customer
    // types — a legit shopper hits this maybe 5 times. 30 leaves headroom
    // for the chatty `onBlur` re-saves, but blocks bots draining Firebase.
    const ip = getClientIp(request);
    const limit = rateLimit({ key: `abandoned:${ip}`, windowMs: 60_000, max: 30 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    }

    const { sessionId, email, items, locale } = await request.json();
    if (!sessionId || !email) {
      return NextResponse.json({ error: 'Missing sessionId or email' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const ref = doc(db, 'abandonedCarts', sessionId);
    const snap = await getDoc(ref);

    const data: Record<string, unknown> = {
      email,
      items: Array.isArray(items) ? items : [],
      locale: locale || 'en',
      updatedAt: serverTimestamp(),
      reminderSent: false,
    };

    // Only set createdAt on first write
    if (!snap.exists()) {
      data.createdAt = serverTimestamp();
    }

    await setDoc(ref, data, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('abandonedCart save error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    await deleteDoc(doc(db, 'abandonedCarts', sessionId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('abandonedCart delete error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
