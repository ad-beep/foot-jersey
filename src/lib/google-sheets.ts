import { google } from 'googleapis';
import type { SheetRow, Jersey } from '@/types';
import { mapSheetRowToJersey } from './utils';
import { SHEET_NAME, SHEET_RANGE } from './constants';
import { cache } from './cache';

// ─── Auth ────────────────────────────────────────────────────
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// ─── Fetch Raw Rows ──────────────────────────────────────────
async function fetchRawRows(): Promise<SheetRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${SHEET_NAME}!${SHEET_RANGE}`,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map((h: string) =>
    h.trim().toLowerCase().replace(/\s+/g, '_')
  );

  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header: string, i: number) => {
      obj[header] = row[i] || '';
    });
    return obj as unknown as SheetRow;
  });
}

// ─── Cached Fetch ────────────────────────────────────────────
// NOTE: This in-memory cache is per-serverless instance (each cold start gets its own Map).
// Because the Google Sheets SDK is used instead of raw fetch(), we cannot leverage Next.js's
// built-in fetch cache here. The trade-off is acceptable: warm instances share the cache, and
// cold starts simply re-fetch. Introducing Redis or another shared cache is out of scope.
const CACHE_KEY = 'google_sheets_jerseys';

export async function fetchJerseys(): Promise<Jersey[]> {
  const cached = cache.get<Jersey[]>(CACHE_KEY);
  if (cached) return cached;

  try {
    const rows = await fetchRawRows();
    const jerseys = rows
      .filter((row) => row.id && row.team_name && row.image_url)
      .map(mapSheetRowToJersey);

    cache.set(CACHE_KEY, jerseys);
    return jerseys;
  } catch (error) {
    console.error('Failed to fetch from Google Sheets:', error);
    // Return cached data even if expired in case of error
    const stale = cache.get<Jersey[]>(CACHE_KEY, true);
    if (stale) return stale;
    return [];
  }
}

// ─── Get Single Jersey ───────────────────────────────────────
export async function fetchJerseyById(id: string): Promise<Jersey | null> {
  const jerseys = await fetchJerseys();
  return jerseys.find((j) => j.id === id) ?? null;
}

// ─── Get Jerseys by League ───────────────────────────────────
export async function fetchJerseysByLeague(league: string): Promise<Jersey[]> {
  const jerseys = await fetchJerseys();
  return jerseys.filter((j) => j.league === league);
}

// ─── Get Jerseys by Category ────────────────────────────────
export async function fetchJerseysByCategory(category: string): Promise<Jersey[]> {
  const jerseys = await fetchJerseys();
  return jerseys.filter((j) => j.category === category);
}

// ─── Invalidate Cache ────────────────────────────────────────
export function invalidateJerseysCache(): void {
  cache.delete(CACHE_KEY);
}
