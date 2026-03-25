import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_API_BASE = 'https://api.sandbox.paypal.com';

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
    const { amount, returnUrl, cancelUrl } = body;

    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (!parsedAmount || typeof parsedAmount !== 'number' || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount provided' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'ILS',
              value: parsedAmount.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/cart?payment=success`,
          cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/cart?payment=cancelled`,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal error:', error);
      return NextResponse.json(
        { error: 'Failed to create PayPal order' },
        { status: response.status }
      );
    }

    const order = await response.json();

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}
