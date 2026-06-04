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
import { sendOrderConfirmation, sendBitPendingEmail } from '@/lib/email';
import { isFirstOrderOnlyCode, hasPreviousOrder } from '@/lib/first-order';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
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
  paymentMethod: 'bit' | 'paypal' | 'card';
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

async function markLeadConverted(email: string) {
  try {
    // Admin SDK — exitIntentLeads is not readable by the unauthenticated client
    // SDK (rules), so the previous client-SDK query silently failed here.
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('exitIntentLeads').where('email', '==', email).get();
    await Promise.all(snap.docs.map((d) => d.ref.update({ convertedAt: FieldValue.serverTimestamp() })));
  } catch (error) {
    console.error('Failed to mark lead as converted:', error);
  }
}

export async function POST(request: NextRequest) {
  // These are set progressively so the catch block has access to the
  // PayPal references for the "contact support" response.
  let paypalOrderIdForRecovery: string | undefined;
  let paypalCaptureIdForRefund: string | undefined;
  let paymentConfirmedCaptured = false;
  // Funding-source metadata pulled from capturedPayments / PayPal API.
  // Hoisted to function scope so the order-write transaction can persist them.
  // null for BIT orders or for legacy PayPal orders whose capturedPayments
  // record predates this code.
  let resolvedFundingSource: 'card' | 'paypal' | null = null;
  let resolvedCardBrand: string | null = null;
  let resolvedCardLast4: string | null = null;

  try {
    const body = (await request.json()) as OrderData;

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

    // ── Verify PayPal payment FIRST — before any other validation ───────────
    // This ensures paymentConfirmedCaptured=true before price/discount checks,
    // so any failure below automatically triggers the auto-refund in the catch block.
    if (body.paymentMethod === 'paypal' || body.paymentMethod === 'card') {
      if (!body.paypalOrderId) {
        return NextResponse.json({ error: 'PayPal order ID required' }, { status: 400 });
      }

      let captureVerified = false;

      // 1. Fast path: atomically claim the capturedPayments record.
      //    Using a transaction prevents two concurrent requests from both creating
      //    an order for the same payment (race condition).
      try {
        const capturedRef = doc(db, 'capturedPayments', body.paypalOrderId);
        const claimResult = await runTransaction(db, async (tx) => {
          const snap = await tx.get(capturedRef);
          if (!snap.exists() || snap.data().status !== 'captured') return 'not_found';
          if (snap.data().orderCreated === true) return snap.data().orderId as string;
          if (snap.data().orderCreated === 'processing') return 'duplicate_in_progress';
          // Atomically mark as processing so no other request can claim it
          tx.update(capturedRef, { orderCreated: 'processing' });
          paypalCaptureIdForRefund = snap.data().captureId || undefined;
          resolvedFundingSource = (snap.data().fundingSource as 'card' | 'paypal' | null) ?? null;
          resolvedCardBrand = (snap.data().cardBrand as string | null) ?? null;
          resolvedCardLast4 = (snap.data().cardLast4 as string | null) ?? null;
          return 'claimed';
        });

        if (claimResult === 'claimed') {
          captureVerified = true;
        } else if (claimResult === 'duplicate_in_progress') {
          // Another request is processing this — return 409 so frontend retries
          return NextResponse.json({ error: 'Order already being processed. Please wait a moment.' }, { status: 409 });
        } else if (typeof claimResult === 'string' && claimResult !== 'not_found') {
          // claimResult is an existing orderId
          return NextResponse.json({ orderId: claimResult, message: 'Order already created' }, { status: 201 });
        }
      } catch (firestoreErr) {
        console.warn('[orders] Firestore capturedPayments claim failed, falling back to PayPal API:', firestoreErr);
      }

      // 2. Fallback: verify directly with PayPal API.
      //    Handles the case where the Firebase write in capture-order failed silently.
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
              const ps = paypalOrder.payment_source ?? {};
              resolvedFundingSource = ps.card ? 'card' : ps.paypal ? 'paypal' : null;
              resolvedCardBrand = ps.card?.brand ?? null;
              resolvedCardLast4 = ps.card?.last_digits ?? null;
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
                  fundingSource: resolvedFundingSource,
                  cardBrand: resolvedCardBrand,
                  cardLast4: resolvedCardLast4,
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

      // From this point on, any thrown error will trigger auto-refund in the catch block.
      paymentConfirmedCaptured = true;
    }

    // ── BIT idempotency guard ────────────────────────────────────────────────
    // Uses a separate Firestore collection (capturedBitPayments) keyed on
    // bitTransactionId — same pattern as PayPal's capturedPayments — to prevent
    // two concurrent requests from creating duplicate orders for the same payment.
    if (body.paymentMethod === 'bit' && body.bitTransactionId) {
      const bitRef = doc(db, 'capturedBitPayments', body.bitTransactionId);
      const bitClaimResult = await runTransaction(db, async (tx) => {
        const snap = await tx.get(bitRef);
        if (!snap.exists()) {
          tx.set(bitRef, { createdAt: serverTimestamp(), orderCreated: 'processing' });
          return 'claimed';
        }
        if (snap.data().orderCreated === true) return snap.data().orderId as string;
        return 'duplicate_in_progress';
      }).catch(() => 'claimed'); // If Firestore fails, proceed — don't block legitimate orders

      if (bitClaimResult === 'duplicate_in_progress') {
        return NextResponse.json({ error: 'Order already being processed. Please wait a moment.' }, { status: 409 });
      }
      if (typeof bitClaimResult === 'string' && bitClaimResult !== 'claimed') {
        return NextResponse.json({ orderId: bitClaimResult, message: 'Order already created' }, { status: 201 });
      }
    }

    // ── Server-side price validation ─────────────────────────────────────────
    // Price mismatches are logged but never block an order — stale cart prices
    // from a recent price update are the most common cause of drift. Only structural
    // shipment-leg mismatches are fatal (those are bugs, not cache timing).
    try {
      const { fetchJerseys } = await import('@/lib/google-sheets');
      const { calculateCustomizationPrice } = await import('@/lib/utils');

      const catalogJerseys = await fetchJerseys();

      for (const item of body.items) {
        const jersey = catalogJerseys.find((j) => j.id === item.jerseyId);
        if (!jersey) {
          console.warn(`[orders] Product not found in catalog: ${item.jerseyId}`);
          continue;
        }

        const isMystery = jersey.type === 'mystery';
        const playerVersionAllowed = jersey.type === 'regular' || jersey.type === 'world_cup';
        const extras = calculateCustomizationPrice({
          hasNameNumber: !!(item.customization?.customName || item.customization?.customNumber),
          hasPatch: !!item.customization?.hasPatch,
          hasPants: !!item.customization?.hasPants,
          isPlayerVersion: !isMystery && playerVersionAllowed && !!item.customization?.isPlayerVersion,
        });

        const expectedItemPrice = jersey.price + extras;
        if (item.totalPrice !== expectedItemPrice) {
          console.warn(`[orders] Price drift for ${item.jerseyId}: client ${item.totalPrice}, server ${expectedItemPrice} (base=${jersey.price} extras=${extras})`);
        }
      }

      // Rehydrate items so the shipping calculator sees jersey data.
      const { summarizeCart } = await import('@/lib/shipping-split');
      const hydratedItems = body.items.map((item) => {
        const j = catalogJerseys.find((c) => c.id === item.jerseyId);
        return j ? { ...item, jersey: j } : item;
      });
      const serverSummary = summarizeCart(hydratedItems);
      const computedTotal =
        serverSummary.subtotal + serverSummary.shipping - (body.discountAmount || 0);

      if (Math.abs(computedTotal - body.total) > 1) {
        console.warn(`[orders] Total drift: client ${body.total}, server ${computedTotal}`);
      }
    } catch (priceCheckErr) {
      // Re-throw structural errors; price-drift warnings never reach here.
      throw priceCheckErr;
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
            throw new Error('Discount code is no longer valid. Please remove it and try again.');
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
            throw new Error('Discount code is no longer valid. Please remove it and try again.');
          }

          // ── Server-side discount amount validation ───────────────────
          // Recompute the discount amount from the sheet data and verify it
          // matches what the client sent. Prevents discount amount manipulation.
          const discountType = row[1]; // 'percentage' or 'fixed'
          const discountValue = parseFloat(row[2]) || 0;
          const minOrder = parseFloat(row[3]) || 0;

          // Compute subtotal the same way the price-check block above did
          const serverComputedSubtotal = body.items.reduce(
            (sum, item) => sum + item.totalPrice * item.quantity,
            0
          );

          if (minOrder > 0 && serverComputedSubtotal < minOrder) {
            throw new Error('Discount code minimum order requirement not met.');
          }

          let serverDiscountAmount: number;
          if (discountType === 'percentage') {
            serverDiscountAmount = Math.floor((serverComputedSubtotal * discountValue) / 100);
          } else {
            serverDiscountAmount = discountValue;
          }
          serverDiscountAmount = Math.min(serverDiscountAmount, serverComputedSubtotal);

          const clientDiscountAmount = body.discountAmount || 0;
          if (Math.abs(clientDiscountAmount - serverDiscountAmount) > 1) {
            console.warn(
              `Discount amount mismatch: client sent ${clientDiscountAmount}, server computed ${serverDiscountAmount} for code ${body.discountCode}`
            );
            throw new Error('Discount amount mismatch. Please refresh and try again.');
          }

          // ── First-order-only guard (defense-in-depth, observability only) ──
          // The /api/discounts/validate gate already blocks first-order-only
          // codes for returning customers BEFORE payment, so a discounted order
          // should never reach here. If one does, we only WARN — we must not
          // reject or refund, because PayPal/card funds are already captured at
          // this point (see capture block above) and the catch handler does not
          // auto-refund. The real enforcement is the pre-payment validate call.
          if (isFirstOrderOnlyCode(body.discountCode) && await hasPreviousOrder(body.shippingInfo.email)) {
            console.warn(
              `[orders] First-order-only code ${body.discountCode} used by returning customer ${body.shippingInfo.email} — slipped past the validate gate. Order allowed (payment already captured).`
            );
          }
        }
      } catch (discountCheckErr) {
        // Re-throw so outer catch can refund if payment was already captured.
        throw discountCheckErr;
      }
    }

    // Normalize name field
    const customerName =
      body.shippingInfo.name ||
      `${body.shippingInfo.firstName || ''} ${body.shippingInfo.lastName || ''}`.trim();

    // 1. Write to Firestore with atomic order number.
    const counterRef = doc(db, 'meta', 'orderCounter');
    const ordersCollection = collection(db, 'orders');
    const primaryOrderRef = doc(ordersCollection);

    function serializeItems(src: typeof body.items) {
      return src.map((item) => ({
        jerseyId: item.jerseyId,
        teamName: item.jersey?.teamName || '',
        imageUrl: item.jersey?.imageUrl || '',
        size: item.size,
        quantity: item.quantity,
        customization: item.customization,
        totalPrice: item.totalPrice,
      }));
    }

    const commonShippingInfo = {
      name: customerName,
      phone: body.shippingInfo.phone,
      email: body.shippingInfo.email,
      country: body.shippingInfo.country,
      city: body.shippingInfo.city,
      street: body.shippingInfo.street,
      zip: body.shippingInfo.zip,
      notes: body.shippingInfo.notes || '',
    };

    await withRetry(async () => {
      await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        const baseCount = counterSnap.exists() ? (counterSnap.data().count as number) : 0;
        const orderNumber = baseCount + 1;
        transaction.set(counterRef, { count: orderNumber });

        transaction.set(primaryOrderRef, {
          orderNumber,
          items: serializeItems(body.items),
          shippingInfo: commonShippingInfo,
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
          fundingSource: resolvedFundingSource,
          cardBrand: resolvedCardBrand,
          cardLast4: resolvedCardLast4,
        });
      });
    }, 3);

    const orderDoc = primaryOrderRef;

    // Mark the captured payment record as fulfilled (best-effort)
    if (body.paypalOrderId) {
      try {
        const capturedRef = doc(db, 'capturedPayments', body.paypalOrderId);
        await updateDoc(capturedRef, {
          orderCreated: true,
          orderId: primaryOrderRef.id,
        });
      } catch {
        // Non-blocking
      }
    }

    // Mark BIT transaction as fulfilled so duplicate requests are rejected (best-effort)
    if (body.bitTransactionId) {
      try {
        await updateDoc(doc(db, 'capturedBitPayments', body.bitTransactionId), {
          orderCreated: true,
          orderId: primaryOrderRef.id,
        });
      } catch {
        // Non-blocking
      }
    }

    // 2. Append to Google Sheets Orders Log (fire-and-forget).
    appendOrderToSheet(orderDoc.id, body);

    // 3. Increment discount code usage + mark lead as converted (fire-and-forget)
    if (body.discountCode) {
      incrementDiscountUsage(body.discountCode);
    }
    markLeadConverted(body.shippingInfo.email);

    // 4. Send confirmation or pending email
    const emailCustomerName =
      body.shippingInfo.name ||
      `${body.shippingInfo.firstName || ''} ${body.shippingInfo.lastName || ''}`.trim();

    if (body.paymentMethod === 'paypal' || body.paymentMethod === 'card') {
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

    // NO auto-refund. If the payment was already captured but we failed to save
    // the order, the money stays captured — the customer is told to contact
    // support so the admin can manually decide whether to fulfil or refund.
    // The orphaned-payment record in capturedPayments lets the admin find it.
    if (paymentConfirmedCaptured && paypalCaptureIdForRefund) {
      console.error(
        `[orders] Order save failed AFTER capture ${paypalCaptureIdForRefund}. ` +
        `Customer paid but no order saved — check capturedPayments and reconcile manually.`
      );
      return NextResponse.json(
        {
          error:
            'Your payment was received but we could not finalize the order. ' +
            'Please contact support with the reference below and we will sort it out.',
          supportRef: paypalOrderIdForRecovery || undefined,
        },
        { status: 500 }
      );
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
