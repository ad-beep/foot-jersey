import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { google } from 'googleapis';
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

    const itemsSummary = body.items
      .map(
        (item) =>
          `${item.jersey?.teamName || item.jerseyId} (${item.size} ×${item.quantity})`
      )
      .join(' | ');

    const customizations = body.items
      .filter((item) => item.customization?.customName || item.customization?.isPlayerVersion)
      .map(
        (item) =>
          `${item.jersey?.teamName || item.jerseyId}: ${
            item.customization?.customName
              ? `#${item.customization.customNumber} ${item.customization.customName}`
              : ''
          }${item.customization?.isPlayerVersion ? ' [Player]' : ''}${
            item.customization?.hasPatch ? ' [Patch]' : ''
          }${item.customization?.hasPants ? ' [Pants]' : ''}`
      )
      .join(' | ');

    const row = [
      orderId,
      new Date().toISOString(),
      customerName,
      body.shippingInfo.email,
      body.shippingInfo.phone,
      `${body.shippingInfo.street}, ${body.shippingInfo.city}, ${body.shippingInfo.zip}, ${body.shippingInfo.country}`,
      body.paymentMethod,
      body.paypalOrderId || body.bitTransactionId || '',
      body.paymentStatus,
      itemsSummary,
      customizations,
      body.subtotal,
      body.shipping ?? 0,
      body.total,
      body.currency,
      'pending', // order status
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Orders Log!A:P',
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  } catch (error) {
    // Log but don't fail the order — Firestore is the source of truth
    console.error('Failed to append order to Google Sheets:', error);
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
      subtotal: body.subtotal,
      total: body.total,
      currency: body.currency,
      createdAt: serverTimestamp(),
      status: 'pending',
    });

    // 2. Append to Google Sheets Orders Log (fire-and-forget)
    appendOrderToSheet(orderDoc.id, body);

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
