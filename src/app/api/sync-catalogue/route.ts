import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
const SHEET_NAME = 'Jerseys';

export async function GET() {
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  try {
    log('=== FootJersey Catalogue Sync (SportHub) ===');
    log('');

    // 1. Read XLSX
    const candidates = [
      path.join(process.cwd(), 'FootJersey_Catalogue.xlsx'),
      path.join(process.cwd(), '..', 'FootJersey_Catalogue.xlsx'),
    ];
    const xlsxPath = candidates.find((p) => fs.existsSync(p)) || candidates[0];
    log(`Reading XLSX: ${xlsxPath}`);

    if (!fs.existsSync(xlsxPath)) {
      log('ERROR: XLSX file not found!');
      return NextResponse.json({ success: false, logs }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(xlsxPath);
    log(`  File size: ${fileBuffer.length} bytes`);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[SHEET_NAME];
    if (!sheet) {
      log(`ERROR: Sheet "${SHEET_NAME}" not found!`);
      return NextResponse.json({ success: false, logs }, { status: 400 });
    }

    const data: string[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
    });
    log(`  ${data.length} rows (including header)`);
    log('');

    // All images are direct Shopify CDN URLs - no resolution needed!
    log('All images are direct Shopify CDN URLs - no resolution needed.');
    log('');

    // 2. Auth & upload to Google Sheets
    log('Authenticating with Google Sheets...');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 3. Clear existing data
    log('Clearing existing sheet data...');
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`,
    });

    // 4. Upload
    log('Uploading to Google Sheets...');
    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: data.map((row) => row.map((cell) => String(cell))),
      },
    });

    const updatedRows = result.data.updatedRows || 0;
    log(`  Updated ${updatedRows} rows!`);
    log('');
    log(`Done! ${data.length - 1} jerseys synced. Refresh the website to see changes.`);

    return NextResponse.json({ success: true, rows: updatedRows, logs });
  } catch (error: any) {
    log(`ERROR: ${error.message}`);
    return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
  }
}
