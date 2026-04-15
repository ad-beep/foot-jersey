import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendBitApprovedEmail } from '@/lib/email';
import { requireAdmin } from '@/lib/admin-auth';
import { writeAuditLog } from '@/lib/audit-log';

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

    // Idempotency: already approved — return success without re-sending email
    if (order?.status === 'processing') {
      return NextResponse.json({ success: true, message: 'Order already approved' });
    }

    // Mark as processing + payment completed
    await updateDoc(orderRef, {
      status: 'processing',
      paymentStatus: 'completed',
      approvedAt: new Date().toISOString(),
    });

    // Send approval email to customer — include full order details from Firestore
    const email = customerEmail || order?.shippingInfo?.email;
    writeAuditLog({ action: 'order.bit_approved', adminEmail: auth.email, details: { orderId, customerEmail: email } });
    if (email) {
      const customerName = order?.shippingInfo?.name || 'Customer';
      await sendBitApprovedEmail({
        to: email,
        customerName,
        orderId,
        total: order?.total ?? 0,
        subtotal: order?.subtotal,
        shipping: order?.shipping ?? 0,
        discountAmount: order?.discountAmount ?? 0,
        discountCode: order?.discountCode ?? undefined,
        items: Array.isArray(order?.items) ? order.items.map((item: Record<string, unknown>) => ({
          teamName: String(item.teamName || ''),
          size: String(item.size || ''),
          quantity: Number(item.quantity) || 1,
          totalPrice: Number(item.totalPrice) || 0,
          customization: item.customization as Record<string, unknown> | undefined,
        })) : undefined,
        shippingAddress: order?.shippingInfo ? {
          street: String(order.shippingInfo.street || ''),
          city: String(order.shippingInfo.city || ''),
          zip: String(order.shippingInfo.zip || ''),
          country: String(order.shippingInfo.country || ''),
        } : undefined,
      });
    }

    return NextResponse.json({ success: true, message: 'Order approved and email sent' });
  } catch (error) {
    console.error('Error approving BIT order:', error);
    return NextResponse.json({ error: 'Failed to approve order' }, { status: 500 });
  }
}
