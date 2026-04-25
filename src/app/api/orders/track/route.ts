import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface TrackedOrder {
  id: string;
  orderNumber: number;
  status: string;
  createdAt: number | null;
  total: number;
  currency: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  shipmentSource?: 'local' | 'international';
  orderGroupId?: string;
  siblingOrderNumber?: number;
  items: Array<{ teamName: string; size: string; quantity: number }>;
}

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, email } = await request.json();

    const parsedNumber = Number(orderNumber);
    if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
      return NextResponse.json({ error: 'Invalid order number' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const ordersRef = collection(db, 'orders');
    const snap = await getDocs(
      query(ordersRef, where('orderNumber', '==', parsedNumber), limit(2))
    );

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
    const groupId: string | undefined = data.orderGroupId;

    const legs: TrackedOrder[] = [];
    legs.push({
      id: matched.id,
      orderNumber: data.orderNumber,
      status: data.status,
      createdAt: data.createdAt?.toMillis?.() ?? null,
      total: data.total,
      currency: data.currency,
      trackingNumber: data.trackingNumber,
      trackingCarrier: data.trackingCarrier,
      shipmentSource: data.shipmentSource,
      orderGroupId: data.orderGroupId,
      siblingOrderNumber: data.siblingOrderNumber,
      items: (data.items || []).map((i: { teamName: string; size: string; quantity: number }) => ({
        teamName: i.teamName,
        size: i.size,
        quantity: i.quantity,
      })),
    });

    if (groupId) {
      const siblingSnap = await getDocs(
        query(ordersRef, where('orderGroupId', '==', groupId), limit(5))
      );
      for (const sib of siblingSnap.docs) {
        if (sib.id === matched.id) continue;
        const sd = sib.data();
        legs.push({
          id: sib.id,
          orderNumber: sd.orderNumber,
          status: sd.status,
          createdAt: sd.createdAt?.toMillis?.() ?? null,
          total: sd.total,
          currency: sd.currency,
          trackingNumber: sd.trackingNumber,
          trackingCarrier: sd.trackingCarrier,
          shipmentSource: sd.shipmentSource,
          orderGroupId: sd.orderGroupId,
          siblingOrderNumber: sd.siblingOrderNumber,
          items: (sd.items || []).map((i: { teamName: string; size: string; quantity: number }) => ({
            teamName: i.teamName,
            size: i.size,
            quantity: i.quantity,
          })),
        });
      }
    }

    legs.sort((a, b) => a.orderNumber - b.orderNumber);

    return NextResponse.json({ legs });
  } catch (err) {
    console.error('[orders/track] error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
