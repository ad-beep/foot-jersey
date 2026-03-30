import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { invalidateJerseysCache } from '@/lib/google-sheets';
import { SHEET_NAME } from '@/lib/constants';
import crypto from 'crypto';

// ─── Strict Header Map ──────────────────────────────────────
// A = id
// B = team_name
// C = league
// D = season
// E = type
// F = tags
// G = image_url
const HEADER_LENGTH = 7; // A through G

// ─── Helpers ────────────────────────────────────────────────

/** Generate a sheet-safe ID: sh-<6 hex chars> */
function generateId(): string {
  return 'sh-' + crypto.randomBytes(3).toString('hex');
}

/** Strip Hebrew characters and non-ASCII from a URL/filename to prevent column drift */
function slugifyUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only sanitize the pathname portion
    parsed.pathname = parsed.pathname
      .split('/')
      .map((segment) =>
        segment.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '-')
      )
      .join('/');
    return parsed.toString();
  } catch {
    // Not a valid URL — strip Hebrew/non-ASCII from the raw string
    return url.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '-');
  }
}


function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// ─── POST Handler ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      team_name,
      league,
      season,
      type,
      image_url,
      tags,
    } = body;

    if (!team_name || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: team_name, image_url' },
        { status: 400 }
      );
    }

    const id = generateId();
    const safeImageUrl = slugifyUrl(image_url);

    // Build a single, clean row matching HEADER_LENGTH exactly (A–G)
    const row: string[] = [
      id,                                    // A: id
      (team_name as string).trim(),          // B: team_name
      (league as string) || '',              // C: league
      (season as string) || '',              // D: season
      (type as string) || 'regular',         // E: type
      (tags as string) || '',                // F: tags
      safeImageUrl,                          // G: image_url
    ];

    // Safety: ensure row length matches header exactly
    while (row.length < HEADER_LENGTH) row.push('');
    if (row.length > HEADER_LENGTH) row.length = HEADER_LENGTH;

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:J`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    // Bust the cache so the new product shows up
    invalidateJerseysCache();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Admin POST /products error:', error);
    return NextResponse.json(
      { error: 'Failed to add product' },
      { status: 500 }
    );
  }
}
