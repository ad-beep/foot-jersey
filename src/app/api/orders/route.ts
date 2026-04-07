import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  increment,
  setDoc,
} from 'firebase/firestore';
import { google } from 'googleapis';
import { sendOrderConfirmation, sendBitPendingEmail, sendOrderFailedRefundEmail } from '@/lib/email';
import type { CartItem } from '@/types';

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

async function issuePayPalRefund(captureId: string): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken();
    const res = await fetch(`${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Retry helper with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await fn(); } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastErr;
}

interface ShippingInfo {
  firstName?: string;
  lastName?: string;
  name?: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  street: string;
  zip: string;
  notes: string;
  billingCountry?: string;
  billingCity?: string;
  billingStreet?: string;
  billingZip?: string;
}

interface BitSenderDetails {
  senderName: string;
  senderPhone: string;
  amountPaid: string;
}

interface OrderData {
  items: CartItem[];
  shippingInfo: ShippingInfo;
  paymentMethod: 'bit' | 'paypal';
  paymentStatus: 'pending' | 'completed' | 'failed';
  total: number;
  subtotal: number;
  shipping?: number;
  currency: string;
  paypalOrderId?: string;
  bitTransactionId?: string;
  bitSenderDetails?: BitSenderDetails;
  discountCode?: string;
  discountAmount?: number;
}

// ─── Google Sheets auth (reuse same service account) ────
function getSheetsAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function appendOrderToSheet(orderId: string, body: OrderData) {
  try {
    const auth = getSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const customerName =
      body.shippingInfo.name ||
      `${body.shippingInfo.firstName || ''} ${body.shippingInfo.lastName || ''}`.trim();

    const orderDate = new Date().toISOString();
    const paymentId = body.paypalOrderId || body.bitTransactionId || '';
    const orderStatus = body.paymentMethod === 'bit' ? 'pending_bit_approval' : 'pending';

    // One row per line item, with order-level fields repeated on each row.
    // Empty optional fields write 'false' so nothing is ever silently blank.
    const itemRows = body.items.map((item) => {
      const unitPrice = item.totalPrice;
      const lineTotal = item.totalPrice * item.quantity;
      return [
        orderId,                                              // A  Order ID
        orderDate,                                            // B  Order Date
        customerName,                                         // C  Customer Name
        body.shippingInfo.email,                              // D  Customer Email
        body.shippingInfo.phone,                              // E  Customer Phone
        body.shippingInfo.street,                             // F  Shipping Address
        body.shippingInfo.city,                               // G  City
        body.shippingInfo.zip,                                // H  Postal Code
        body.shippingInfo.country,                            // I  Country
        item.jerseyId,                                        // J  Jersey ID
        item.jersey?.teamName      || 'false',               // K  Jersey Name
        item.size,                                            // L  Size
        item.customization?.customName   || 'false',         // M  Customization Name
        item.customization?.customNumber || 'false',         // N  Customization Number
        item.customization?.isPlayerVersion ? true : false,  // O  Player Version
        unitPrice,                                            // P  Unit Price (₪)
        lineTotal,                                            // Q  Line Total (₪)
        body.shipping ?? 0,                                   // R  Shipping Cost (₪)
        body.discountAmount || 0,                             // S  Discount (₪)
        body.total,                                           // T  Order Total (₪)
        body.paymentMethod,                                   // U  Payment Method
        body.paymentStatus,                                   // V  Payment Status
        paymentId || 'false',                                 // W  Payment ID
        orderStatus,                                          // X  Order Status
        false,                                                // Y  Tracking Number
        body.shippingInfo.notes || 'false',                  // Z  Notes
        item.customization?.patchText  || 'false',           // AA Patch
        item.customization?.hasPants ? true : false,         // AB Pants
      ];
    });

    // Blank separator row between orders (28 columns)
    const blankRow = Array(28).fill('');

    await withRetry(() => sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Orders!A:AB',
      valueInputOption: 'RAW',
      requestBody: { values: [...itemRows, blankRow] },
    }));
  } catch (error) {
    console.error('Failed to append order to Google Sheets after retries:', error);
    // Flag the order in Firestore so it can be manually synced later
    try {
      await updateDoc(doc(db, 'orders', orderId), { sheetsWriteFailed: true });
    } catch {
      // Best-effort flag — don't block
    }
  }
}

async function incrementDiscountUsage(code: string) {
  try {
    const normalizedCode = code.toUpperCase().trim();
    const usageRef = doc(db, 'discountUsage', normalizedCode);
    await setDoc(usageRef, { count: increment(1) }, { merge: true });
  } catch (error) {
    console.error('Failed to increment discount usage:', error);
  }
}

export async function POST(request: NextRequest) {
  let paypalOrderIdForRecovery: string | undefined;
  let paypalCaptureIdForRefund: string | undefined;
  let paymentConfirmedCaptured = false;
  let body: OrderData | undefined;
  try {
    body = (await request.json()) as OrderData;

    paypalOrderIdForRecovery = body.paypalOrderId;

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!body.shippingInfo || !body.paymentMethod || !body.total) {
      return NextResponse.json(
        { error: 'Missing required order information' },
        { status: 400 }
      );
    }

    // ── Server-side price validation ─────────────────────────────────────────
    try {
      const { fetchJerseys } = await import('@/lib/google-sheets');
      const { calculateCustomizationPrice } = await import('@/lib/utils');
      const { PRICES, SHIPPING_POLICY } = await import('@/lib/constants');

      const catalogJerseys = await fetchJerseys();

      for (const item of body.items) {
        const jersey = catalogJerseys.find((j) => j.id === item.jerseyId);
        if (!jersey) {
          return NextResponse.json(
            { error: `Product not found: ${item.jerseyId}` },
            { status: 400 }
          );
        }

        const extras = calculateCustomizationPrice({
          hasNameNumber: !!(item.customization?.customName || item.customization?.customNumber),
          hasPatch: !!item.customization?.hasPatch,
          hasPants: !!item.customization?.hasPants,
          isPlayerVersion: !!item.customization?.isPlayerVersion,
        });

        const expectedItemPrice = jersey.price + extras;

        if (item.totalPrice !== expectedItemPrice) {
          console.warn(
            `Price mismatch for ${item.jerseyId}: client sent ${item.totalPrice}, expected ${expectedItemPrice}`
          );
          return NextResponse.json(
            { error: 'Price mismatch. Please refresh and try again.' },
            { status: 400 }
          );
        }
      }

      // Recompute order total
      const computedSubtotal = body.items.reduce(
        (sum, item) => sum + item.totalPrice * item.quantity,
        0
      );
      const totalItemCount = body.items.reduce((sum, item) => sum + item.quantity, 0);
      const freeShipping = totalItemCount >= SHIPPING_POLICY.freeShippingMinItems;
      const computedShipping = freeShipping ? 0 : PRICES.shippingFlat;
      const computedTotal =
        computedSubtotal + computedShipping - (body.discountAmount || 0);

      if (Math.abs(computedTotal - body.total) > 1) {
        console.warn(
          `Total mismatch: client sent ${body.total}, server computed ${computedTotal}`
        );
        return NextResponse.json(
          { error: 'Order total mismatch. Please refresh and try again.' },
          { status: 400 }
        );
      }
    } catch (priceCheckErr) {
      console.error('Price validation unavailable:', priceCheckErr);
      return NextResponse.json(
        { error: 'Could not validate order prices. Please try again in a moment.' },
        { status: 503 }
      );
    }

    // ── Re-validate discount code at order time ──────────────────────────────
    if (body.discountCode) {
      try {
        const auth = getSheetsAuth();
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        if (spreadsheetId) {
          const discountRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'DiscountCodes!A:I',
          });
          const rows = discountRes.data.values;
          const normalizedCode = body.discountCode.toUpperCase().trim();
          const rowIndex = rows
            ? rows.findIndex((r, i) => i > 0 && r[0]?.toUpperCase().trim() === normalizedCode)
            : -1;

          if (rowIndex === -1) {
            return NextResponse.json(
              { error: 'Discount code is no longer valid. Please remove it and try again.' },
              { status: 400 }
            );
          }

          const row = rows![rowIndex];
          const maxUses = parseInt(row[4]) || 0;
          const sheetsUses = parseInt(row[5]) || 0;
          const expiryDate = row[6];
          const isActive = row[7]?.toLowerCase() !== 'false';

          let firestoreUses = 0;
          try {
            const usageSnap = await getDoc(doc(db, 'discountUsage', normalizedCode));
            if (usageSnap.exists()) firestoreUses = (usageSnap.data().count as number) || 0;
          } catch { /* fall back to Sheets count */ }
          const currentUses = Math.max(sheetsUses, firestoreUses);

          const codeInvalid =
            !isActive ||
            (expiryDate && new Date(expiryDate) < new Date()) ||
            (maxUses > 0 && currentUses >= maxUses);

          if (codeInvalid) {
            return NextResponse.json(
              { error: 'Discount code is no longer valid. Please remove it and try again.' },
              { status: 400 }
            );
          }
        }
      } catch (discountCheckErr) {
        console.error('Discount re-validation unavailable:', discountCheckErr);
        return NextResponse.json(
          { error: 'Could not validate discount code. Please try again in a moment.' },
          { status: 503 }
        );
      }
    }

    // ── Verify PayPal payment was actually captured server-side ─────────────
    if (body.paymentMethod === 'paypal') {
      if (!body.paypalOrderId) {
        return NextResponse.json({ error: 'PayPal order ID required' }, { status: 400 });
      }

      let captureVerified = false;

      // 1. Fast path: check Firestore record written by capture-order route
      try {
        const capturedRef = doc(db, 'capturedPayments', body.paypalOrderId);
        const capturedSnap = await getDoc(capturedRef);
        if (capturedSnap.exists() && capturedSnap.data().status === 'captured') {
          captureVerified = true;
          paypalCaptureIdForRefund = capturedSnap.data().captureId || undefined;
          // Idempotency: if order already created for this capture, return existing ID
          if (capturedSnap.data().orderCreated === true) {
            const existingOrderId = capturedSnap.data().orderId as string;
            return NextResponse.json({ orderId: existingOrderId, message: 'Order already created' }, { status: 201 });
          }
        }
      } catch (firestoreErr) {
        console.warn('[orders] Firestore capturedPayments lookup failed, falling back to PayPal API:', firestoreErr);
      }

      // 2. Fallback: verify directly with PayPal API.
      //    This handles the case where the Firebase write in capture-order failed silently.
      if (!captureVerified) {
        try {
          const accessToken = await getPayPalAccessToken();
          const paypalRes = await fetch(
            `${PAYPAL_API_BASE}/v2/checkout/orders/${body.paypalOrderId}`,
            { method: 'GET', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
          );
          if (paypalRes.ok) {
            const paypalOrder = await paypalRes.json();
            if (paypalOrder.status === 'COMPLETED') {
              captureVerified = true;
              const captureId: string | undefined = paypalOrder.purchase_units?.[0]?.payments?.captures?.[0]?.id;
              paypalCaptureIdForRefund = captureId;
              // Recreate the missing Firestore record so orphaned-payment checks work
              try {
                const capturedAmount = parseFloat(
                  paypalOrder.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? '0'
                );
                await setDoc(doc(db, 'capturedPayments', body.paypalOrderId!), {
                  paypalOrderId: body.paypalOrderId,
                  payerId: paypalOrder.payer?.email_address || '',
                  capturedAt: serverTimestamp(),
                  status: 'captured',
                  capturedAmount,
                  captureId: captureId || null,
                  orderCreated: false,
                  recoveredViaPayPalApi: true,
                });
              } catch (writeErr) {
                console.error('[orders] Failed to recreate capturedPayments record:', writeErr);
              }
            }
          }
        } catch (paypalApiErr) {
          console.error('[orders] PayPal API fallback verification failed:', paypalApiErr);
        }
      }

      if (!captureVerified) {
        return NextResponse.json(
          { error: 'Payment not verified. Please contact support if funds were deducted.' },
          { status: 400 }
        );
      }

      paymentConfirmedCaptured = true;
    }

    // Normalize name field
    const customerName =
      body.shippingInfo.name ||
      `${body.shippingInfo.firstName || ''} ${body.shippingInfo.lastName || ''}`.trim();

    // 1. Write to Firestore with atomic order number
    const counterRef = doc(db, 'meta', 'orderCounter');
    const ordersCollection = collection(db, 'orders');
    const newOrderRef = doc(ordersCollection);

    await withRetry(async () => {
      await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        const orderNumber = counterSnap.exists()
          ? (counterSnap.data().count as number) + 1
          : 1;
        transaction.set(counterRef, { count: orderNumber });
        transaction.set(newOrderRef, {
          orderNumber,
          items: body.items.map((item) => ({
            jerseyId: item.jerseyId,
            teamName: item.jersey?.teamName || '',
            imageUrl: item.jersey?.imageUrl || '',
            size: item.size,
            quantity: item.quantity,
            customization: item.customization,
            totalPrice: item.totalPrice,
          })),
          shippingInfo: {
            name: customerName,
            phone: body.shippingInfo.phone,
            email: body.shippingInfo.email,
            country: body.shippingInfo.country,
            city: body.shippingInfo.city,
            street: body.shippingInfo.street,
            zip: body.shippingInfo.zip,
            notes: body.shippingInfo.notes || '',
          },
          paymentMethod: body.paymentMethod,
          paymentStatus: body.paymentMethod === 'paypal' ? 'completed' : body.paymentStatus,
          paypalOrderId: body.paypalOrderId || null,
          bitTransactionId: body.bitTransactionId || null,
          bitSenderDetails: body.bitSenderDetails || null,
          discountCode: body.discountCode || null,
          discountAmount: body.discountAmount || 0,
          subtotal: body.subtotal,
          shipping: body.shipping ?? 0,
          total: body.total,
          currency: body.currency,
          createdAt: serverTimestamp(),
          status: body.paymentMethod === 'bit' ? 'pending_bit_approval' : 'pending',
        });
      });
    }, 3);

    const orderDoc = newOrderRef;

    // Mark the captured payment record as fulfilled (best-effort)
    if (body.paypalOrderId) {
      try {
        const capturedRef = doc(db, 'capturedPayments', body.paypalOrderId);
        await updateDoc(capturedRef, { orderCreated: true, orderId: newOrderRef.id });
      } catch {
        // Non-blocking
      }
    }

    // 2. Append to Google Sheets Orders Log (fire-and-forget)
    appendOrderToSheet(orderDoc.id, body);

    // 3. Increment discount code usage (fire-and-forget)
    if (body.discountCode) {
      incrementDiscountUsage(body.discountCode);
    }

    // 4. Send confirmation or pending email
    const emailCustomerName =
      body.shippingInfo.name ||
      `${body.shippingInfo.firstName || ''} ${body.shippingInfo.lastName || ''}`.trim();

    if (body.paymentMethod === 'paypal') {
      // Instant confirmation for PayPal orders
      await sendOrderConfirmation({
        to: body.shippingInfo.email,
        customerName: emailCustomerName,
        orderId: orderDoc.id,
        items: body.items.map((item) => ({
          teamName: item.jersey?.teamName || item.jerseyId || '',
          size: item.size,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          customization: item.customization,
        })),
        total: body.total,
        subtotal: body.subtotal,
        shipping: body.shipping ?? 0,
        discountAmount: body.discountAmount,
        discountCode: body.discountCode,
        shippingAddress: {
          street: body.shippingInfo.street,
          city: body.shippingInfo.city,
          zip: body.shippingInfo.zip,
          country: body.shippingInfo.country,
        },
        paymentMethod: body.paymentMethod,
      }).catch(async (e) => {
        console.error('Email send error:', e);
        try {
          await updateDoc(doc(db, 'orders', orderDoc.id), { emailSendFailed: true });
        } catch { /* best-effort */ }
      });
    } else if (body.paymentMethod === 'bit') {
      // BIT: send "waiting for approval" email immediately
      await sendBitPendingEmail({
        to: body.shippingInfo.email,
        customerName: emailCustomerName,
        orderId: orderDoc.id,
        total: body.total,
      }).catch(async (e) => {
        console.error('Email send error:', e);
        try {
          await updateDoc(doc(db, 'orders', orderDoc.id), { emailSendFailed: true });
        } catch { /* best-effort */ }
      });
    }

    return NextResponse.json(
      {
        orderId: orderDoc.id,
        message: 'Order created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);

    // Auto-refund: if we confirmed the payment was captured but order creation failed,
    // automatically refund the customer so no money is taken without an order.
    if (paymentConfirmedCaptured && paypalCaptureIdForRefund) {
      console.log(`[orders] Order creation failed after capture — attempting auto-refund of capture ${paypalCaptureIdForRefund}`);
      const refunded = await issuePayPalRefund(paypalCaptureIdForRefund);
      if (refunded) {
        console.log(`[orders] Auto-refund succeeded for capture ${paypalCaptureIdForRefund}`);
        try {
          await updateDoc(doc(db, 'capturedPayments', paypalOrderIdForRecovery!), { status: 'refunded' });
        } catch { /* best-effort */ }
        // Notify the customer immediately so they know what happened
        if (body?.shippingInfo?.email) {
          const name =
            body.shippingInfo.name ||
            `${body.shippingInfo.firstName || ''} ${body.shippingInfo.lastName || ''}`.trim() ||
            'Customer';
          sendOrderFailedRefundEmail({
            to: body.shippingInfo.email,
            customerName: name,
            paypalOrderId: paypalOrderIdForRecovery!,
            amount: body.total,
          }).catch((emailErr) => console.error('[orders] Failed to send refund notification email:', emailErr));
        }
        return NextResponse.json(
          { error: 'Order processing failed. Your payment has been automatically refunded. Please try again in a few minutes.' },
          { status: 500 }
        );
      } else {
        console.error(`[orders] Auto-refund FAILED for capture ${paypalCaptureIdForRefund} — manual intervention required`);
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create order. If you were charged, please contact support with your order reference.',
        supportRef: paypalOrderIdForRecovery || undefined,
      },
      { status: 500 }
    );
  }
}
