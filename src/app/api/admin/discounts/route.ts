import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_TAB = 'DiscountCodes';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

export interface DiscountRow {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order: number;
  max_uses: number;
  current_uses: number;
  expiry_date: string;
  is_active: string;
  created_at: string;
}

// ─── GET: List all discount codes ────────────────────────
export async function GET() {
  try {
    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_TAB}!A:I`,
    });

    const rows = res.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h: string, i: number) => {
        obj[h] = row[i] || '';
      });
      return obj;
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /admin/discounts error:', error);
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

// ─── POST: Create a new discount code ────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, type, value, min_order, max_uses, expiry_date, is_active } = body;

    if (!code || !type || !value) {
      return NextResponse.json({ error: 'code, type, and value are required' }, { status: 400 });
    }

    const sheets = getSheets();
    const row = [
      code.toUpperCase().trim(),
      type,
      String(value),
      String(min_order || 0),
      String(max_uses || 0),
      '0', // current_uses
      expiry_date || '',
      is_active === false ? 'false' : 'true',
      new Date().toISOString(),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_TAB}!A:I`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    return NextResponse.json({ success: true, code: row[0] });
  } catch (error) {
    console.error('POST /admin/discounts error:', error);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}

// ─── PUT: Update a discount code ─────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, type, value, min_order, max_uses, expiry_date, is_active } = body;

    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }

    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_TAB}!A:I`,
    });

    const rows = res.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    const rowIndex = rows.findIndex((r, i) => i > 0 && r[0]?.toUpperCase() === code.toUpperCase());
    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    const existing = rows[rowIndex];
    const updated = [
      existing[0], // code stays the same
      type ?? existing[1],
      value !== undefined ? String(value) : existing[2],
      min_order !== undefined ? String(min_order) : existing[3],
      max_uses !== undefined ? String(max_uses) : existing[4],
      existing[5], // current_uses unchanged
      expiry_date !== undefined ? expiry_date : existing[6],
      is_active !== undefined ? String(is_active) : existing[7],
      existing[8], // created_at unchanged
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_TAB}!A${rowIndex + 1}:I${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [updated] },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /admin/discounts error:', error);
    return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 });
  }
}

// ─── DELETE: Remove a discount code ──────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }

    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_TAB}!A:I`,
    });

    const rows = res.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    const rowIndex = rows.findIndex((r, i) => i > 0 && r[0]?.toUpperCase() === code.toUpperCase());
    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    // Clear the row (Google Sheets doesn't natively delete rows via values API)
    const empty = Array(9).fill('');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_TAB}!A${rowIndex + 1}:I${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [empty] },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /admin/discounts error:', error);
    return NextResponse.json({ error: 'Failed to delete discount' }, { status: 500 });
  }
}
