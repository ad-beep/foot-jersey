import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

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
    if (!sessionId || typeof sessionId !== 'string' || !email) {
      return NextResponse.json({ error: 'Missing sessionId or email' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection('abandonedCarts').doc(sessionId);
    const snap = await ref.get();

    // Cap stored items so a crafted request can't bloat the document.
    const safeItems = Array.isArray(items) ? items.slice(0, 50) : [];

    const data: Record<string, unknown> = {
      email,
      items: safeItems,
      locale: locale || 'en',
      updatedAt: FieldValue.serverTimestamp(),
      reminderSent: false,
    };

    // Only set createdAt on first write
    if (!snap.exists) {
      data.createdAt = FieldValue.serverTimestamp();
    }

    await ref.set(data, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('abandonedCart save error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit({ key: `abandoned-del:${ip}`, windowMs: 60_000, max: 30 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    }

    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }
    await getAdminDb().collection('abandonedCarts').doc(sessionId).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('abandonedCart delete error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
