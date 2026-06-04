import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// firebase-admin requires the Node runtime.
export const runtime = 'nodejs';

// GET /api/orders/[id]
// Returns a single order by its Firestore document ID. The order is read with
// the Admin SDK because `orders` is admin-only under Firestore rules. The doc ID
// is a 20-char unguessable Firestore ID handed to the customer in the
// order-confirmation URL, so possession of the ID is the access check (the same
// model the confirmation page already relied on).
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  if (!id || typeof id !== 'string' || id.length < 6) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
  }

  try {
    const snap = await getAdminDb().collection('orders').doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const data = snap.data()!;
    // Serialize the createdAt Timestamp to millis so the client can format it.
    const createdAt = data.createdAt?.toMillis?.() ?? null;
    return NextResponse.json({ order: { id: snap.id, ...data, createdAt } });
  } catch (err) {
    console.error('[orders/[id]] error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
