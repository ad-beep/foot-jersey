import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

const REVIEWS = 'productReviews';
const ORDERS = 'orders';

export async function GET(request: NextRequest) {
  try {
    const jerseyId = request.nextUrl.searchParams.get('jerseyId');
    if (!jerseyId) {
      return NextResponse.json({ error: 'Missing jerseyId' }, { status: 400 });
    }
    const snap = await getDocs(
      query(
        collection(db, REVIEWS),
        where('jerseyId', '==', jerseyId),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
    );
    const reviews = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        jerseyId: data.jerseyId,
        rating: data.rating,
        text: data.text,
        customerName: data.customerName,
        city: data.city ?? '',
        orderNumber: data.orderNumber ?? null,
        verified: data.verified === true,
        createdAt: data.createdAt?.toMillis?.() ?? null,
      };
    });
    const ratingSum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
    const ratingAvg = reviews.length ? ratingSum / reviews.length : null;
    return NextResponse.json({ reviews, count: reviews.length, ratingAvg });
  } catch (err) {
    console.error('[reviews] GET error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, email, jerseyId, rating, text, city } = body;

    const parsedOrder = Number(orderNumber);
    if (!Number.isInteger(parsedOrder) || parsedOrder <= 0) {
      return NextResponse.json({ error: 'Invalid order number' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (!jerseyId || typeof jerseyId !== 'string') {
      return NextResponse.json({ error: 'Missing jerseyId' }, { status: 400 });
    }
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }
    if (!text || typeof text !== 'string' || text.trim().length < 10 || text.length > 1000) {
      return NextResponse.json({ error: 'Review must be 10-1000 characters' }, { status: 400 });
    }

    // Verify order exists, matches email, and contains this jerseyId.
    const ordersRef = collection(db, ORDERS);
    const orderSnap = await getDocs(
      query(ordersRef, where('orderNumber', '==', parsedOrder), limit(2))
    );
    if (orderSnap.empty) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const matched = orderSnap.docs.find(
      (d) => (d.data().shippingInfo?.email || '').toLowerCase() === normalizedEmail
    );
    if (!matched) {
      return NextResponse.json({ error: 'Order not found for that email' }, { status: 404 });
    }
    const orderData = matched.data();
    const itemMatch = (orderData.items || []).some((i: { jerseyId?: string }) => i.jerseyId === jerseyId);
    if (!itemMatch) {
      return NextResponse.json({ error: 'This jersey is not in that order' }, { status: 400 });
    }

    // Prevent duplicate review (same jerseyId + orderId).
    const dupSnap = await getDocs(
      query(
        collection(db, REVIEWS),
        where('orderId', '==', matched.id),
        where('jerseyId', '==', jerseyId),
        limit(1)
      )
    );
    if (!dupSnap.empty) {
      return NextResponse.json({ error: 'You already reviewed this jersey for this order.' }, { status: 409 });
    }

    const customerName = orderData.shippingInfo?.name || 'Verified buyer';
    const customerCity = typeof city === 'string' && city.trim() ? city.trim().slice(0, 60) : (orderData.shippingInfo?.city || '');

    await addDoc(collection(db, REVIEWS), {
      jerseyId,
      orderId: matched.id,
      orderNumber: parsedOrder,
      customerName,
      customerEmail: normalizedEmail,
      city: customerCity,
      rating: parsedRating,
      text: text.trim(),
      verified: true,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[reviews] POST error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
