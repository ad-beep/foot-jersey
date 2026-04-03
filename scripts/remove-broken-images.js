/**
 * remove-broken-images.js
 *
 * Reads the live Google Sheets catalogue, tests every Shopify CDN image URL,
 * removes any row whose primary image returns 404/error, then writes the
 * cleaned data back to the sheet.
 *
 * Run: node scripts/remove-broken-images.js
 */

const { google } = require('googleapis');
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const CLIENT_EMAIL   = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY    = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SHEET_NAME     = 'Jerseys';

// ── HTTP HEAD check ─────────────────────────────────────────────────────────
function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const req = https.request(url, { method: 'HEAD', timeout: 6000 }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function checkBatch(rows, imageColIndex) {
  // Only test Shopify CDN URLs — other URLs (Firebase, local) are left as-is
  const results = await Promise.all(
    rows.map(async (row) => {
      const url = String(row[imageColIndex] || '');
      if (!url.includes('cdn.shopify.com')) return true; // keep non-Shopify rows
      if (!url.startsWith('http')) return true;          // keep relative/empty
      return checkUrl(url);
    })
  );
  return results;
}

async function main() {
  console.log('=== Remove Broken Images from Catalogue ===\n');

  // Authenticate
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // Read current sheet
  console.log('Reading Google Sheets...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:K`,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) {
    console.log('Sheet is empty or has only headers.');
    return;
  }

  const header = rows[0];
  const dataRows = rows.slice(1);
  console.log(`  ${dataRows.length} product rows found.\n`);

  // Find image_url column index
  const imageColIndex = header.findIndex(
    (h) => h?.toString().trim().toLowerCase() === 'image_url'
  );
  if (imageColIndex === -1) {
    console.error('Could not find image_url column in sheet header.');
    process.exit(1);
  }
  console.log(`  image_url is column ${String.fromCharCode(65 + imageColIndex)} (index ${imageColIndex})\n`);

  // Test all Shopify CDN URLs in batches of 20
  console.log('Testing Shopify CDN image URLs (this takes ~2 minutes)...');
  const keep = [];
  let removed = 0;
  const BATCH = 20;

  for (let i = 0; i < dataRows.length; i += BATCH) {
    const batch = dataRows.slice(i, i + BATCH);
    const ok = await checkBatch(batch, imageColIndex);
    batch.forEach((row, j) => {
      if (ok[j]) {
        keep.push(row);
      } else {
        const teamName = row[1] || row[0] || '?';
        console.log(`  ✗ Removing: ${teamName} (${row[imageColIndex]})`);
        removed++;
      }
    });
    process.stdout.write(`\r  Progress: ${Math.min(i + BATCH, dataRows.length)}/${dataRows.length}`);
  }
  console.log('\n');

  if (removed === 0) {
    console.log('No broken images found — sheet is clean.');
    return;
  }

  console.log(`Removing ${removed} products with broken images.`);
  console.log(`Keeping ${keep.length} products.\n`);

  // Clear and rewrite
  console.log('Clearing sheet...');
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:K`,
  });

  console.log('Writing cleaned data back...');
  const updated = await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [header, ...keep] },
  });

  console.log(`\nDone! ${updated.data.updatedRows} rows written.`);
  console.log(`Removed ${removed} products with broken Shopify CDN images.`);
  console.log('\nThe catalogue cache will refresh automatically within 60 seconds.');
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
