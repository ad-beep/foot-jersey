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

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 });
    }

    const sheets = google.sheets({ version: 'v4', auth: getAuth() });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
      range: `${SHEET_TAB}!A:I`,
    });

    const rows = res.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json({ valid: false, error: 'Invalid code' });
    }

    // Find the code row (columns: code, type, value, min_order, max_uses, current_uses, expiry_date, is_active, created_at)
    const rowIndex = rows.findIndex(
      (r, i) => i > 0 && r[0]?.toUpperCase().trim() === code.toUpperCase().trim()
    );

    if (rowIndex === -1) {
      return NextResponse.json({ valid: false, error: 'Invalid code' });
    }

    const row = rows[rowIndex];
    const type = row[1]; // 'percentage' or 'fixed'
    const value = parseFloat(row[2]) || 0;
    const minOrder = parseFloat(row[3]) || 0;
    const maxUses = parseInt(row[4]) || 0;
    const currentUses = parseInt(row[5]) || 0;
    const expiryDate = row[6];
    const isActive = row[7]?.toLowerCase() !== 'false';

    // Validation checks
    if (!isActive) {
      return NextResponse.json({ valid: false, error: 'Code is inactive' });
    }

    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry < new Date()) {
        return NextResponse.json({ valid: false, error: 'Code expired' });
      }
    }

    if (maxUses > 0 && currentUses >= maxUses) {
      return NextResponse.json({ valid: false, error: 'Code usage limit reached' });
    }

    if (minOrder > 0 && (subtotal || 0) < minOrder) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order ₪${minOrder} required`,
      });
    }

    // Calculate discount amount
    let discountAmount: number;
    if (type === 'percentage') {
      discountAmount = Math.floor(((subtotal || 0) * value) / 100);
    } else {
      discountAmount = value;
    }

    // Don't let discount exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal || 0);

    return NextResponse.json({
      valid: true,
      code: row[0],
      type,
      value,
      discountAmount,
    });
  } catch (error) {
    console.error('Validate discount error:', error);
    return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 });
  }
}
