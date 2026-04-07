import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

const PAYPAL_API_BASE = 'https://api.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('PayPal credentials not configured');
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Failed to get PayPal access token');
  return (await res.json()).access_token;
}

// GET /api/admin/paypal-lookup?orderId=XXX
// Returns payer name, email, and amount for a given PayPal order ID.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const orderId = request.nextUrl.searchParams.get('orderId');
  if (!orderId) {
    return NextResponse.json({ error: 'orderId query param is required' }, { status: 400 });
  }

  try {
    const accessToken = await getPayPalAccessToken();
    const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'PayPal order not found', status: res.status }, { status: 404 });
    }

    const order = await res.json();
    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      payerEmail: order.payer?.email_address || null,
      payerName: `${order.payer?.name?.given_name || ''} ${order.payer?.name?.surname || ''}`.trim() || null,
      amount: capture?.amount?.value || order.purchase_units?.[0]?.amount?.value || null,
      currency: capture?.amount?.currency_code || order.purchase_units?.[0]?.amount?.currency_code || null,
      captureId: capture?.id || null,
      capturedAt: capture?.create_time || null,
    });
  } catch (error) {
    console.error('[paypal-lookup] Error:', error);
    return NextResponse.json({ error: 'Failed to look up PayPal order' }, { status: 500 });
  }
}
