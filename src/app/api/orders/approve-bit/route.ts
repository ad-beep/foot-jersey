import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendBitApprovedEmail } from '@/lib/email';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { orderId, customerEmail } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Fetch the order to get full details
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderSnap.data();

    // Mark as processing + payment completed
    await updateDoc(orderRef, {
      status: 'processing',
      paymentStatus: 'completed',
      approvedAt: new Date().toISOString(),
    });

    // Send approval email to customer
    const email = customerEmail || order?.shippingInfo?.email;
    if (email) {
      const customerName = order?.shippingInfo?.name || 'Customer';
      await sendBitApprovedEmail({
        to: email,
        customerName,
        orderId,
        total: order?.total ?? 0,
      });
    }

    return NextResponse.json({ success: true, message: 'Order approved and email sent' });
  } catch (error) {
    console.error('Error approving BIT order:', error);
    return NextResponse.json({ error: 'Failed to approve order' }, { status: 500 });
  }
}
