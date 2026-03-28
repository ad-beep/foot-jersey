import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { google } from 'googleapis';
import { sendOrderConfirmation, sendBitPendingEmail } from '@/lib/email';
import type { CartItem } from '@/types';

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

    // One row per line item, with order-level fields repeated on each row
    const itemRows = body.items.map((item) => {
      const unitPrice = item.totalPrice;
      const lineTotal = item.totalPrice * item.quantity;
      return [
        orderId,                                  // Order ID
        orderDate,                                // Order Date
        customerName,                             // Customer Name
        body.shippingInfo.email,                  // Customer Email
        body.shippingInfo.phone,                  // Customer Phone
        body.shippingInfo.street || '',           // Shipping Address
        body.shippingInfo.city || '',             // City
        body.shippingInfo.zip || '',              // Postal Code
        body.shippingInfo.country || '',          // Country
        item.jerseyId,                            // Jersey ID
        item.jersey?.teamName || '',              // Jersey Name
        item.size,                                // Size
        item.customization?.customName || '',     // Customization Name
        item.customization?.customNumber || '',   // Customization Number
        item.quantity,                            // Quantity
        unitPrice,                                // Unit Price (₪)
        lineTotal,                                // Line Total (₪)
        body.shipping ?? 0,                       // Shipping Cost (₪)
        body.discountAmount || 0,                 // Discount (₪)
        body.total,                               // Order Total (₪)
        body.paymentMethod,                       // Payment Method
        body.paymentStatus,                       // Payment Status
        paymentId,                                // Payment ID
        orderStatus,                              // Order Status
        '',                                       // Tracking Number
        body.shippingInfo.notes || '',            // Notes
      ];
    });

    // Blank separator row between orders
    const blankRow = Array(26).fill('');

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Orders!A:Z',
      valueInputOption: 'RAW',
      requestBody: { values: [...itemRows, blankRow] },
    });
  } catch (error) {
    // Log but don't fail the order — Firestore is the source of truth
    console.error('Failed to append order to Google Sheets:', error);
  }
}

async function incrementDiscountUsage(code: string) {
  try {
    const auth = getSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'DiscountCodes!A:I',
    });

    const rows = res.data.values;
    if (!rows || rows.length < 2) return;

    const rowIndex = rows.findIndex(
      (r, i) => i > 0 && r[0]?.toUpperCase().trim() === code.toUpperCase().trim()
    );
    if (rowIndex === -1) return;

    const currentUses = parseInt(rows[rowIndex][5]) || 0;
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: `DiscountCodes!F${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[String(currentUses + 1)]] },
    });
  } catch (error) {
    console.error('Failed to increment discount usage:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: OrderData = await request.json();

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

    // Normalize name field
    const customerName =
      body.shippingInfo.name ||
      `${body.shippingInfo.firstName || ''} ${body.shippingInfo.lastName || ''}`.trim();

    // 1. Write to Firestore
    const ordersCollection = collection(db, 'orders');
    const orderDoc = await addDoc(ordersCollection, {
      items: body.items.map((item) => ({
        jerseyId: item.jerseyId,
        teamName: item.jersey?.teamName || '',
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
      paymentStatus: body.paymentStatus,
      paypalOrderId: body.paypalOrderId || null,
      bitTransactionId: body.bitTransactionId || null,
      bitSenderDetails: body.bitSenderDetails || null,
      discountCode: body.discountCode || null,
      discountAmount: body.discountAmount || 0,
      subtotal: body.subtotal,
      total: body.total,
      currency: body.currency,
      createdAt: serverTimestamp(),
      status: body.paymentMethod === 'bit' ? 'pending_bit_approval' : 'pending',
    });

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

    if (body.paymentMethod === 'paypal' && body.paymentStatus === 'completed') {
      // Instant confirmation for PayPal orders
      sendOrderConfirmation({
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
      }).catch((e) => console.error('Email send error:', e));
    } else if (body.paymentMethod === 'bit') {
      // BIT: send "waiting for approval" email immediately
      sendBitPendingEmail({
        to: body.shippingInfo.email,
        customerName: emailCustomerName,
        orderId: orderDoc.id,
        total: body.total,
      }).catch((e) => console.error('Email send error:', e));
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
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
