/**
 * FootJersey Catalogue Sync
 * 1. Reads the XLSX catalogue
 * 2. Resolves all Yupoo album URLs to direct image URLs (picks front-view)
 * 3. Uploads everything to Google Sheets
 *
 * Run: npm run sync
 */
const { google } = require('googleapis');
const XLSX = require('xlsx');
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SHEET_NAME = 'Jerseys';
const XLSX_PATH = path.join(__dirname, '..', '..', 'FootJersey_Catalogue.xlsx');

// ─── Yupoo Image Resolver ────────────────────────────────────

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchPage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function extractAlbumImages(html) {
  // Extract ALL image URLs from album page
  const bigPattern = /data-src="(https:\/\/photo\.yupoo\.com\/zherming029\/([a-f0-9]+)\/big\.jpg)"/g;
  const medPattern = /src="(https:\/\/photo\.yupoo\.com\/zherming029\/([a-f0-9]+)\/medium\.jpg)"/g;
  const smallPattern = /src="(https:\/\/photo\.yupoo\.com\/zherming029\/([a-f0-9]+)\/small\.jpg)"/g;

  const hashToUrl = new Map();
  const orderedHashes = [];

  // Collect all - prefer big > medium > small
  for (const [pattern] of [[smallPattern], [medPattern], [bigPattern]]) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (!hashToUrl.has(match[2])) {
        orderedHashes.push(match[2]);
      }
      hashToUrl.set(match[2], match[1]);
    }
  }

  // De-duplicate maintaining order
  const seen = new Set();
  const unique = orderedHashes.filter(h => {
    if (seen.has(h)) return false;
    seen.add(h);
    return true;
  });

  return unique.map(h => hashToUrl.get(h)).filter(Boolean);
}

function pickFrontImage(images) {
  if (!images || images.length === 0) return null;
  // If 2+ images, 2nd one is usually the front (1st is often back/cover)
  if (images.length >= 2) return images[1];
  return images[0];
}

async function resolveYupooImage(albumUrl) {
  try {
    const html = await fetchPage(albumUrl);
    const images = extractAlbumImages(html);
    return pickFrontImage(images);
  } catch {
    return null;
  }
}

// Process in batches to avoid overwhelming Yupoo
async function batchResolve(entries, batchSize = 10) {
  const results = new Map();
  const total = entries.length;
  let resolved = 0;
  let success = 0;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    const promises = batch.map(async ({ rowIdx, albumUrl }) => {
      const imageUrl = await resolveYupooImage(albumUrl);
      if (imageUrl) success++;
      resolved++;
      results.set(rowIdx, imageUrl);
    });

    await Promise.all(promises);

    // Progress update every batch
    process.stdout.write(`\r  Progress: ${resolved}/${total} (${success} resolved)`);

    // Small delay between batches to be polite
    if (i + batchSize < entries.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(''); // newline after progress
  return results;
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('=== FootJersey Catalogue Sync ===\n');

  // 1. Read XLSX
  console.log(`Reading: ${XLSX_PATH}`);
  const workbook = XLSX.readFile(XLSX_PATH);
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    console.error(`Sheet "${SHEET_NAME}" not found!`);
    process.exit(1);
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  console.log(`  ${data.length} rows (including header)\n`);

  // 2. Find Yupoo album URLs that need resolving
  // Column G (index 6) is image_url
  const IMAGE_COL = 6;
  const yupooEntries = [];

  for (let i = 1; i < data.length; i++) {
    const imageUrl = String(data[i][IMAGE_COL] || '');
    if (imageUrl.includes('yupoo.com/albums/')) {
      yupooEntries.push({ rowIdx: i, albumUrl: imageUrl });
    }
  }

  const directCount = data.length - 1 - yupooEntries.length;
  console.log(`Images: ${directCount} already direct, ${yupooEntries.length} Yupoo albums to resolve\n`);

  // 3. Resolve Yupoo images
  if (yupooEntries.length > 0) {
    console.log('Resolving Yupoo album images (this takes 2-3 minutes)...');
    const resolved = await batchResolve(yupooEntries, 10);

    let updated = 0;
    let failed = 0;
    for (const [rowIdx, imageUrl] of resolved) {
      if (imageUrl) {
        data[rowIdx][IMAGE_COL] = imageUrl;
        updated++;
      } else {
        failed++;
      }
    }

    console.log(`  ${updated} images resolved to direct URLs`);
    if (failed > 0) {
      console.log(`  ${failed} could not be resolved (will show placeholder on site)`);
    }
    console.log('');
  }

  // 4. Authenticate with Google Sheets
  console.log('Authenticating with Google...');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: CLIENT_EMAIL,
      private_key: PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // 5. Clear existing data
  console.log('Clearing existing sheet data...');
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:K`,
  });

  // 6. Upload new data
  console.log('Uploading to Google Sheets...');
  const result = await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: data.map(row => row.map(cell => String(cell))),
    },
  });

  console.log(`  Updated ${result.data.updatedRows} rows!\n`);
  console.log(`Done! ${data.length - 1} jerseys synced to Google Sheets.`);
  console.log('Now restart the dev server: npm run dev');
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
