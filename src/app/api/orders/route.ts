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

interface ShipmentLegInput {
  source: 'local' | 'international';
  itemJerseyIds: string[]; // ids of items that belong to this leg (order preserved)
  itemCount: number;
  subtotal: number;
  shipping: number;
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
  shipmentLegs?: ShipmentLegInput[]; // present only when cart mixes local + international
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
  // These are set progressively so the catch block can refund/notify without body in scope.
  let paypalOrderIdForRecovery: string | undefined;
  let paypalCaptureIdForRefund: string | undefined;
  let paymentConfirmedCaptured = false;
  let catchEmail: string | undefined;
  let catchName: string | undefined;
  let catchTotal: number | undefined;

  try {
    const body = (await request.json()) as OrderData;

    paypalOrderIdForRecovery = body.paypalOrderId;
    catchEmail = body.shippingInfo?.email;
    catchTotal = body.total;

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
    if (body.paymentMethod === 'paypal') {
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

      // From this point on, any thrown error will trigger auto-refund in the catch block.
      paymentConfirmedCaptured = true;
    }

    // ── Server-side price validation ─────────────────────────────────────────
    try {
      const { fetchJerseys } = await import('@/lib/google-sheets');
      const { calculateCustomizationPrice } = await import('@/lib/utils');
      const { MYSTERY_BOX_OPTIONS } = await import('@/lib/constants');

      const catalogJerseys = await fetchJerseys();

      for (const item of body.items) {
        // Mystery boxes are priced from constants, not Google Sheets
        const mysteryBox = MYSTERY_BOX_OPTIONS.find((m) => m.slug === item.jerseyId);
        if (mysteryBox) {
          const extras = calculateCustomizationPrice({
            hasNameNumber: !!(item.customization?.customName || item.customization?.customNumber),
            hasPatch: !!item.customization?.hasPatch,
            hasPants: !!item.customization?.hasPants,
            isPlayerVersion: !!item.customization?.isPlayerVersion,
          });
          const expectedItemPrice = mysteryBox.price + extras;
          if (item.totalPrice !== expectedItemPrice) {
            console.warn(`Mystery box price mismatch for ${item.jerseyId}: client ${item.totalPrice}, expected ${expectedItemPrice}`);
            throw new Error('Price mismatch. Please refresh and try again.');
          }
          continue;
        }

        const jersey = catalogJerseys.find((j) => j.id === item.jerseyId);
        if (!jersey) {
          throw new Error(`Product not found: ${item.jerseyId}`);
        }

        // Player Version is only allowed for regular and world_cup jerseys — enforce server-side
        const playerVersionAllowed = jersey.type === 'regular' || jersey.type === 'world_cup';
        const extras = calculateCustomizationPrice({
          hasNameNumber: !!(item.customization?.customName || item.customization?.customNumber),
          hasPatch: !!item.customization?.hasPatch,
          hasPants: !!item.customization?.hasPants,
          isPlayerVersion: playerVersionAllowed && !!item.customization?.isPlayerVersion,
        });

        const expectedItemPrice = jersey.price + extras;

        if (item.totalPrice !== expectedItemPrice) {
          console.warn(`Price mismatch for ${item.jerseyId}: client ${item.totalPrice}, expected ${expectedItemPrice}`);
          throw new Error('Price mismatch. Please refresh and try again.');
        }
      }

      // Recompute order total — per-leg when the cart mixes local + international,
      // otherwise single-leg (existing behaviour).
      const { splitCart } = await import('@/lib/shipping-split');
      // Rehydrate each cart item with its canonical jersey record so the splitter
      // can see jersey.type (it uses that to decide local vs. international).
      const hydratedItems = body.items.map((item) => {
        if (MYSTERY_BOX_OPTIONS.find((m) => m.slug === item.jerseyId)) return item;
        const j = catalogJerseys.find((c) => c.id === item.jerseyId);
        return j ? { ...item, jersey: j } : item;
      });
      const serverSplit = splitCart(hydratedItems);
      const computedSubtotal = serverSplit.subtotal;
      const computedShipping = serverSplit.shipping;
      const computedTotal =
        computedSubtotal + computedShipping - (body.discountAmount || 0);

      // If the client declared legs, verify each leg's subtotal + shipping + count
      // match what the server computed. Never trust client-declared shipping totals.
      if (body.shipmentLegs && body.shipmentLegs.length > 0) {
        if (!serverSplit.hasSplit || body.shipmentLegs.length !== serverSplit.legs.length) {
          throw new Error('Shipment split mismatch. Please refresh and try again.');
        }
        for (const clientLeg of body.shipmentLegs) {
          const serverLeg = serverSplit.legs.find((l) => l.source === clientLeg.source);
          if (!serverLeg) throw new Error(`Unknown shipment source: ${clientLeg.source}`);
          if (
            Math.abs(serverLeg.subtotal - clientLeg.subtotal) > 1 ||
            serverLeg.shipping !== clientLeg.shipping ||
            serverLeg.itemCount !== clientLeg.itemCount
          ) {
            console.warn(
              `Leg mismatch (${clientLeg.source}): client=${JSON.stringify(clientLeg)} server=${JSON.stringify({ subtotal: serverLeg.subtotal, shipping: serverLeg.shipping, itemCount: serverLeg.itemCount })}`
            );
            throw new Error('Shipment totals mismatch. Please refresh and try again.');
          }
        }
      }

      if (Math.abs(computedTotal - body.total) > 1) {
        console.warn(
          `Total mismatch: client sent ${body.total}, server computed ${computedTotal}`
        );
        throw new Error('Order total mismatch. Please refresh and try again.');
      }
    } catch (priceCheckErr) {
      // Re-throw so the outer catch block can issue a refund if payment was captured.
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
    catchName = customerName;

    // 1. Write to Firestore with atomic order number.
    // ── Mixed shipment: write TWO linked orders sharing an orderGroupId ─────
    // Each leg has its own items / subtotal / shipping / status / tracking so
    // admin can fulfil them independently. Payment is shared (one capture).
    // Discount is applied to the first (primary) leg to keep the sum exact;
    // the second leg carries a reference to the same discountCode but amount=0.
    const counterRef = doc(db, 'meta', 'orderCounter');
    const ordersCollection = collection(db, 'orders');

    // Rehydrate items once (same logic as price-check) so saved order rows
    // contain canonical teamName/imageUrl even if the client-side jersey was stale.
    const { splitCart: splitCartForSave, sourceForItem: sourceForItemForSave } = await import('@/lib/shipping-split');
    const catalogJerseysForSave = body.shipmentLegs && body.shipmentLegs.length > 0
      ? await (async () => {
          const { fetchJerseys } = await import('@/lib/google-sheets');
          return fetchJerseys();
        })()
      : null;
    const hydratedItemsForSave = catalogJerseysForSave
      ? body.items.map((item) => {
          const j = catalogJerseysForSave.find((c) => c.id === item.jerseyId);
          return j ? { ...item, jersey: j } : item;
        })
      : body.items;

    const isSplit = !!(body.shipmentLegs && body.shipmentLegs.length > 1);
    const orderGroupId = isSplit ? `grp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}` : null;
    const primaryOrderRef = doc(ordersCollection);
    const secondaryOrderRef = isSplit ? doc(ordersCollection) : null;

    // Compute per-leg splits so each order doc carries only its own items.
    const legSplit = isSplit ? splitCartForSave(hydratedItemsForSave) : null;

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
        const primaryNumber = baseCount + 1;
        const secondaryNumber = isSplit ? baseCount + 2 : null;
        transaction.set(counterRef, { count: secondaryNumber ?? primaryNumber });

        if (!isSplit) {
          transaction.set(primaryOrderRef, {
            orderNumber: primaryNumber,
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
          });
          return;
        }

        // isSplit = true from here ↓
        const legs = legSplit!.legs;
        // Order legs so 'local' (second-hand, Israel) is always the primary order.
        const localLeg = legs.find((l) => l.source === 'local')!;
        const intlLeg = legs.find((l) => l.source === 'international')!;
        const primaryLegItems = localLeg.items;
        const secondaryLegItems = intlLeg.items;

        // Apply discount proportionally — simplest: apply entirely to primary leg
        // (our discount codes are order-level, not per-item, and this keeps the
        // sum exact). Capped so primary total never goes negative.
        const fullDiscount = body.discountAmount || 0;
        const primarySubtotal = localLeg.subtotal;
        const primaryShipping = localLeg.shipping;
        const appliedToPrimary = Math.min(fullDiscount, primarySubtotal + primaryShipping);
        const remainingDiscount = fullDiscount - appliedToPrimary;

        const primaryTotal = primarySubtotal + primaryShipping - appliedToPrimary;
        const secondaryTotal = intlLeg.subtotal + intlLeg.shipping - remainingDiscount;

        transaction.set(primaryOrderRef, {
          orderNumber: primaryNumber,
          orderGroupId,
          shipmentSource: 'local',
          siblingOrderId: secondaryOrderRef!.id,
          siblingOrderNumber: secondaryNumber,
          items: serializeItems(primaryLegItems),
          shippingInfo: commonShippingInfo,
          paymentMethod: body.paymentMethod,
          paymentStatus: body.paymentMethod === 'paypal' ? 'completed' : body.paymentStatus,
          paypalOrderId: body.paypalOrderId || null,
          bitTransactionId: body.bitTransactionId || null,
          bitSenderDetails: body.bitSenderDetails || null,
          discountCode: body.discountCode || null,
          discountAmount: appliedToPrimary,
          subtotal: primarySubtotal,
          shipping: primaryShipping,
          total: primaryTotal,
          currency: body.currency,
          createdAt: serverTimestamp(),
          status: body.paymentMethod === 'bit' ? 'pending_bit_approval' : 'pending',
        });

        transaction.set(secondaryOrderRef!, {
          orderNumber: secondaryNumber,
          orderGroupId,
          shipmentSource: 'international',
          siblingOrderId: primaryOrderRef.id,
          siblingOrderNumber: primaryNumber,
          items: serializeItems(secondaryLegItems),
          shippingInfo: commonShippingInfo,
          paymentMethod: body.paymentMethod,
          paymentStatus: body.paymentMethod === 'paypal' ? 'completed' : body.paymentStatus,
          paypalOrderId: body.paypalOrderId || null,
          bitTransactionId: body.bitTransactionId || null,
          bitSenderDetails: body.bitSenderDetails || null,
          discountCode: body.discountCode || null,
          discountAmount: remainingDiscount,
          subtotal: intlLeg.subtotal,
          shipping: intlLeg.shipping,
          total: secondaryTotal,
          currency: body.currency,
          createdAt: serverTimestamp(),
          status: body.paymentMethod === 'bit' ? 'pending_bit_approval' : 'pending',
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
          ...(isSplit && secondaryOrderRef ? { orderIds: [primaryOrderRef.id, secondaryOrderRef.id] } : {}),
        });
      } catch {
        // Non-blocking
      }
    }

    // Suppress unused-var lint when not using the helper outside the txn
    void sourceForItemForSave;

    // 2. Append to Google Sheets Orders Log (fire-and-forget).
    // On split orders we still write a single row-group with the primary order id
    // so the sheet stays a flat log; the split metadata is preserved in Firestore.
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
        ...(isSplit && secondaryOrderRef
          ? { orderGroupId, siblingOrderId: secondaryOrderRef.id, orderIds: [primaryOrderRef.id, secondaryOrderRef.id] }
          : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);

    // Auto-refund: if we confirmed the payment was captured but order creation failed,
    // automatically refund the customer so no money is taken without an order.
    if (paymentConfirmedCaptured && paypalCaptureIdForRefund) {
      console.log(`[orders] Order creation failed after capture — attempting auto-refund of capture ${paypalCaptureIdForRefund}`);
      const refunded = await withRetry(() => issuePayPalRefund(paypalCaptureIdForRefund!), 3).catch(() => false);
      if (refunded) {
        console.log(`[orders] Auto-refund succeeded for capture ${paypalCaptureIdForRefund}`);
        try {
          // Reset orderCreated so orphaned-payment check can detect it; mark as refunded
          await updateDoc(doc(db, 'capturedPayments', paypalOrderIdForRecovery!), {
            status: 'refunded',
            orderCreated: false,
          });
        } catch { /* best-effort */ }
        // Notify the customer immediately so they know what happened
        if (catchEmail) {
          sendOrderFailedRefundEmail({
            to: catchEmail,
            customerName: catchName || 'Customer',
            paypalOrderId: paypalOrderIdForRecovery!,
            amount: catchTotal || 0,
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
