import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// firebase-admin requires the Node runtime (not edge).
export const runtime = 'nodejs';

interface TrackedOrder {
  id: string;
  orderNumber: number;
  status: string;
  createdAt: number | null;
  total: number;
  currency: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  items: Array<{ teamName: string; size: string; quantity: number }>;
}

export async function POST(request: NextRequest) {
  try {
    // Throttle lookups so the endpoint can't be used to brute-force order/email pairs.
    const ip = getClientIp(request);
    const limited = rateLimit({ key: `track:${ip}`, windowMs: 60_000, max: 20 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } },
      );
    }

    const { orderNumber, email } = await request.json();

    const parsedNumber = Number(orderNumber);
    if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
      return NextResponse.json({ error: 'Invalid order number' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Admin SDK — the `orders` collection is admin-only under Firestore rules, so
    // the client SDK can't read it. The email match below is the access check.
    const db = getAdminDb();
    const snap = await db
      .collection('orders')
      .where('orderNumber', '==', parsedNumber)
      .limit(2)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const matched = snap.docs.find(
      (d) => (d.data().shippingInfo?.email || '').toLowerCase() === normalizedEmail
    );
    if (!matched) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const data = matched.data();
    const order: TrackedOrder = {
      id: matched.id,
      orderNumber: data.orderNumber,
      status: data.status,
      createdAt: data.createdAt?.toMillis?.() ?? null,
      total: data.total,
      currency: data.currency,
      trackingNumber: data.trackingNumber,
      trackingCarrier: data.trackingCarrier,
      items: (data.items || []).map((i: { teamName: string; size: string; quantity: number }) => ({
        teamName: i.teamName,
        size: i.size,
        quantity: i.quantity,
      })),
    };

    return NextResponse.json({ order });
  } catch (err) {
    console.error('[orders/track] error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
