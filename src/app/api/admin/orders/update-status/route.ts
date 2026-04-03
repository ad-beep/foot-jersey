import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { google } from 'googleapis';
import { sendBitApprovedEmail } from '@/lib/email';
import { requireAdmin } from '@/lib/admin-auth';
import { writeAuditLog } from '@/lib/audit-log';

function getSheetsAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function updateSheetStatus(orderId: string, status: string) {
  try {
    const auth = getSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

    // Find all rows where column A = orderId
    const colA = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Orders!A:A',
    });

    const rows = colA.data.values || [];
    const ranges: { range: string; values: string[][] }[] = [];

    rows.forEach((row, idx) => {
      if (idx === 0) return; // skip header row
      if (row[0] === orderId) {
        // Sheets is 1-indexed; header is row 1, so data starts at row 2
        ranges.push({ range: `Orders!X${idx + 1}`, values: [[status]] });
      }
    });

    if (ranges.length === 0) return;

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: ranges,
      },
    });
  } catch (err) {
    // Log but don't fail — Firestore is source of truth
    console.error('Failed to update sheet status:', err);
  }
}

const VALID_STATUSES = [
  'pending', 'pending_bit_approval', 'processing',
  'shipped', 'delivered', 'completed', 'bit_declined',
];

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { orderId, status, orderData } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await updateDoc(doc(db, 'orders', orderId), { status });

    writeAuditLog({ action: 'order.status_changed', adminEmail: auth.email, details: { orderId, status } });

    // Sync sheet — awaited so lambda stays alive until write completes
    await updateSheetStatus(orderId, status);

    // Send confirmation email when admin accepts a BIT payment
    if (status === 'processing' && orderData?.email) {
      await sendBitApprovedEmail({
        to: orderData.email,
        customerName: orderData.customerName || '',
        orderId,
        total: orderData.total,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        discountAmount: orderData.discountAmount,
        discountCode: orderData.discountCode,
        items: orderData.items,
        shippingAddress: orderData.shippingAddress,
      }).catch((e) => console.error('BIT approval email error:', e));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
