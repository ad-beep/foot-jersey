import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_API_BASE = 'https://api.paypal.com';

async function getPayPalAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Defense-in-depth: check current order status before attempting capture.
    // If the order is already COMPLETED, return success without re-capturing.
    const statusResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (statusResponse.ok) {
      const existingOrder = await statusResponse.json();
      if (existingOrder.status === 'COMPLETED') {
        console.warn(`PayPal order ${orderId} already captured — returning existing result`);
        return NextResponse.json({
          orderId: existingOrder.id,
          status: existingOrder.status,
          payerId: existingOrder.payer?.email_address || '',
        });
      }
    }

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal capture error:', error);
      return NextResponse.json(
        { error: 'Failed to capture PayPal order' },
        { status: response.status }
      );
    }

    const order = await response.json();

    // Write a recovery record so we can trace the payment if order creation fails
    if (order.status === 'COMPLETED') {
      try {
        const { db } = await import('@/lib/firebase');
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const capturedAmount = parseFloat(
          order.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? '0'
        );
        await setDoc(doc(db, 'capturedPayments', order.id), {
          paypalOrderId: order.id,
          payerId: order.payer?.email_address || '',
          capturedAt: serverTimestamp(),
          status: 'captured',
          capturedAmount,
          orderCreated: false,
        });
      } catch (e) {
        // Non-blocking — best effort
        console.error('[capture-order] Failed to write recovery record:', e);
      }
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      payerId: order.payer?.email_address || '',
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to capture PayPal order' },
      { status: 500 }
    );
  }
}
