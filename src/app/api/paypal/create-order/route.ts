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

// Map common country names → ISO 3166-1 alpha-2 codes for PayPal
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  israel: 'IL', 'ישראל': 'IL',
  'united states': 'US', usa: 'US',
  'united kingdom': 'GB', uk: 'GB', england: 'GB',
  germany: 'DE', 'גרמניה': 'DE',
  france: 'FR', 'צרפת': 'FR',
  spain: 'ES', 'ספרד': 'ES',
  italy: 'IT', 'איטליה': 'IT',
  netherlands: 'NL', 'הולנד': 'NL',
  canada: 'CA', 'קנדה': 'CA',
  australia: 'AU', 'אוסטרליה': 'AU',
  brazil: 'BR', 'ברזיל': 'BR',
  argentina: 'AR', 'ארגנטינה': 'AR',
};

function resolveCountryCode(countryInput: string | undefined): string {
  if (!countryInput) return 'IL';
  const cleaned = countryInput.trim();
  if (/^[A-Z]{2}$/.test(cleaned)) return cleaned; // already a 2-letter code
  return COUNTRY_NAME_TO_CODE[cleaned.toLowerCase()] ?? 'IL';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, returnUrl, cancelUrl, shippingAddress, preferCard } = body;

    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Sanity-check: must be a positive number within a reasonable cart range.
    // Minimum ₪1 (single item discount edge case), maximum ₪50,000 (bulk order cap).
    if (
      !parsedAmount ||
      typeof parsedAmount !== 'number' ||
      isNaN(parsedAmount) ||
      parsedAmount <= 0 ||
      parsedAmount > 50000
    ) {
      return NextResponse.json(
        { error: 'Invalid amount provided' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    const purchaseUnit = {
      amount: {
        currency_code: 'ILS',
        value: parsedAmount.toFixed(2),
      },
      ...(shippingAddress && {
        shipping: {
          type: 'SHIPPING',
          name: {
            full_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
          },
          address: {
            address_line_1: shippingAddress.street || '',
            admin_area_2: shippingAddress.city || '',
            postal_code: shippingAddress.zip || '',
            country_code: resolveCountryCode(shippingAddress.country),
          },
        },
      }),
    };

    const finalReturnUrl = returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/cart?payment=success`;
    const finalCancelUrl = cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/cart?payment=cancelled`;
    const shippingPreference = shippingAddress ? 'SET_PROVIDED_ADDRESS' : 'NO_SHIPPING';

    // `preferCard` lands the buyer directly on PayPal's hosted card-entry form
    // (guest checkout) instead of the PayPal login wall. This is the supported
    // way to accept cards for this IL merchant account. It uses
    // payment_source.paypal.experience_context, which must NOT be combined with
    // application_context — so the two flows are built separately.
    const orderRequestBody = preferCard
      ? {
          intent: 'CAPTURE',
          purchase_units: [purchaseUnit],
          payment_source: {
            paypal: {
              experience_context: {
                landing_page: 'GUEST_CHECKOUT',
                user_action: 'PAY_NOW',
                shipping_preference: shippingPreference,
                return_url: finalReturnUrl,
                cancel_url: finalCancelUrl,
              },
            },
          },
        }
      : {
          intent: 'CAPTURE',
          purchase_units: [purchaseUnit],
          application_context: {
            return_url: finalReturnUrl,
            cancel_url: finalCancelUrl,
            shipping_preference: shippingPreference,
            user_action: 'PAY_NOW',
          },
        };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderRequestBody),
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
    const approveUrl = order.links?.find((l: { rel: string; href: string }) => l.rel === 'approve')?.href ?? null;

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      approveUrl,
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}
