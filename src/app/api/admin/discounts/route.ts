import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { requireAdmin } from '@/lib/admin-auth';
import { writeAuditLog } from '@/lib/audit-log';

const SHEET_TAB = 'DiscountCodes';

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      `Missing credentials: email=${!!email}, key=${!!rawKey}. ` +
      'Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local / Vercel.',
    );
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: rawKey.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) {
    throw new Error('Missing GOOGLE_SHEETS_SPREADSHEET_ID env var');
  }
  return id;
}

/** Extract a human-readable message from a Google API error */
function sheetsErrorDetail(error: unknown): string {
  if (error instanceof Error) {
    const any = error as any;
    const status = any.code ?? any.status ?? '';
    const details = any.errors ? JSON.stringify(any.errors) : '';
    return `${error.message}${status ? ` [status ${status}]` : ''}${details ? ` ${details}` : ''}`;
  }
  return String(error);
}

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
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const spreadsheetId = getSpreadsheetId();
    const sheets = getSheets();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
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
    const detail = sheetsErrorDetail(error);
    console.error('GET /admin/discounts error:', detail);

    // Surface actionable hint to the admin UI
    const hint = detail.includes('Unable to parse range')
      ? `Sheet tab "${SHEET_TAB}" not found — create it with headers: code, type, value, min_order, max_uses, current_uses, expiry_date, is_active, created_at`
      : detail.includes('403')
        ? 'Permission denied — share the spreadsheet with the service account email'
        : 'Failed to fetch discounts';

    return NextResponse.json({ error: hint }, { status: 500 });
  }
}

// ─── POST: Create a new discount code ────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();

    const { code, type, value, min_order, max_uses, expiry_date, is_active } = body;

    if (!code || !type || value === undefined || value === null || value === '') {
      return NextResponse.json({ error: 'code, type, and value are required' }, { status: 400 });
    }

    const spreadsheetId = getSpreadsheetId();
    const sheets = getSheets();

    // Column order must match the header row:
    // A:code  B:type  C:value  D:min_order  E:max_uses  F:current_uses  G:expiry_date  H:is_active  I:created_at
    const row = [
      code.toUpperCase().trim(),
      type,
      String(value),
      String(min_order || 0),
      String(max_uses || 0),
      '0', // current_uses starts at 0
      expiry_date || '',
      is_active === false ? 'false' : 'true',
      new Date().toISOString(),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_TAB}!A:I`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    writeAuditLog({ action: 'discount.created', adminEmail: auth.email, details: { code: row[0], type, value } });

    return NextResponse.json({ success: true, code: row[0] });
  } catch (error) {
    const detail = sheetsErrorDetail(error);
    console.error('POST /admin/discounts — SHEETS_API_ERROR:', detail);

    const hint = detail.includes('Unable to parse range')
      ? `Sheet tab "${SHEET_TAB}" not found — create it in your spreadsheet`
      : detail.includes('403')
        ? 'Permission denied — check service account access'
        : detail.includes('401')
          ? 'Auth failed — check GOOGLE_PRIVATE_KEY format (\\n handling)'
          : 'Failed to create discount';

    return NextResponse.json({ error: hint }, { status: 500 });
  }
}

// ─── PUT: Update a discount code ─────────────────────────
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();

    const { code, type, value, min_order, max_uses, expiry_date, is_active } = body;

    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }

    const spreadsheetId = getSpreadsheetId();
    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
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
      spreadsheetId,
      range: `${SHEET_TAB}!A${rowIndex + 1}:I${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [updated] },
    });

    writeAuditLog({ action: 'discount.updated', adminEmail: auth.email, details: { code } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const detail = sheetsErrorDetail(error);
    console.error('PUT /admin/discounts — SHEETS_API_ERROR:', detail);
    return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 });
  }
}

// ─── DELETE: Remove a discount code ──────────────────────
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }

    const spreadsheetId = getSpreadsheetId();
    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
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
      spreadsheetId,
      range: `${SHEET_TAB}!A${rowIndex + 1}:I${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [empty] },
    });

    writeAuditLog({ action: 'discount.deleted', adminEmail: auth.email, details: { code } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const detail = sheetsErrorDetail(error);
    console.error('DELETE /admin/discounts — SHEETS_API_ERROR:', detail);
    return NextResponse.json({ error: 'Failed to delete discount' }, { status: 500 });
  }
}
