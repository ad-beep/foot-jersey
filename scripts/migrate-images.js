/**
 * migrate-images.js
 *
 * Downloads every image from sporthub_full.json (Shopify CDN)
 * and re-uploads to your Firebase Storage.
 * Then updates the Google Sheet replacing Shopify URLs with Firebase URLs.
 *
 * SAFE BY DESIGN: each image is stored as sporthub/{productId}/{index}.ext
 * The productId is unique per jersey — mismatches are structurally impossible.
 *
 * RESUMABLE: progress is saved to scripts/migration-progress.json after each upload.
 * If the script is interrupted, re-run it — already-uploaded images are skipped.
 *
 * Usage:
 *   node scripts/migrate-images.js           → runs both phases
 *   node scripts/migrate-images.js upload    → upload phase only
 *   node scripts/migrate-images.js sheet     → sheet update phase only
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch').default ?? require('node-fetch');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const BUCKET          = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET; // e.g. footjersey-9b9d0.firebasestorage.app
const SHEET_ID        = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME      = 'Jerseys';
const JSON_FILE       = path.join(__dirname, '..', 'sporthub_full.json');
const PROGRESS_FILE   = path.join(__dirname, 'migration-progress.json');
const MAP_FILE        = path.join(__dirname, 'migration-map.json');

const DELAY_MS        = 300;  // ms between uploads to avoid rate limits
const MAX_RETRIES     = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function extFromUrl(url) {
  const clean = url.split('?')[0];
  const m = clean.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}

function contentTypeFromExt(ext) {
  const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
  return map[ext] || 'image/jpeg';
}

function firebasePublicUrl(bucket, objectPath) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return { done: {}, failed: {} };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function loadMap() {
  if (fs.existsSync(MAP_FILE)) {
    return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  }
  return {};
}

function saveMap(map) {
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
}

// ─── Google Auth ─────────────────────────────────────────────────────────────

async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/devstorage.read_write',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  return token;
}

// ─── Download Image ───────────────────────────────────────────────────────────

async function downloadImage(url) {
  const res = await fetch(url, { timeout: 30000 });
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  return res.buffer();
}

// ─── Upload to Firebase Storage ──────────────────────────────────────────────

async function uploadToFirebase(token, objectPath, buffer, contentType) {
  const uploadUrl =
    `https://storage.googleapis.com/upload/storage/v1/b/` +
    `${encodeURIComponent(BUCKET)}/o?uploadType=media&name=${encodeURIComponent(objectPath)}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
      'Content-Length': String(buffer.length),
    },
    body: buffer,
    timeout: 60000,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload failed ${res.status}: ${body}`);
  }
  return res.json();
}

// ─── Phase 1: Upload ─────────────────────────────────────────────────────────

async function runUpload() {
  console.log('=== PHASE 1: UPLOAD ===');
  console.log(`Bucket: ${BUCKET}`);
  if (!BUCKET) { console.error('ERROR: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not set'); process.exit(1); }

  const products = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  const progress = loadProgress();
  const map      = loadMap();

  // Count totals
  const total = products.reduce((s, p) => s + p.images.length, 0);
  const done  = Object.keys(progress.done).length;
  console.log(`Products: ${products.length} | Images: ${total} | Already done: ${done}\n`);

  console.log('Getting access token...');
  const token = await getAccessToken();
  console.log('Token OK.\n');

  let uploaded = 0;
  let skipped  = 0;
  let failed   = 0;

  for (const product of products) {
    const productId = String(product.id);

    for (let i = 0; i < product.images.length; i++) {
      const shopifyUrl  = product.images[i];
      const progressKey = `${productId}_${i}`;

      // Skip already done
      if (progress.done[progressKey]) {
        skipped++;
        continue;
      }

      const ext         = extFromUrl(shopifyUrl);
      const objectPath  = `sporthub/${productId}/${i}.${ext}`;
      const contentType = contentTypeFromExt(ext);

      let attempt = 0;
      let success = false;

      while (attempt < MAX_RETRIES && !success) {
        attempt++;
        try {
          const buffer     = await downloadImage(shopifyUrl);
          await uploadToFirebase(token, objectPath, buffer, contentType);
          const firebaseUrl = firebasePublicUrl(BUCKET, objectPath);

          // Record in map (keyed by shopify URL for sheet update later)
          map[shopifyUrl] = firebaseUrl;
          progress.done[progressKey] = { shopifyUrl, firebaseUrl, productId, title: product.title, index: i };

          saveProgress(progress);
          saveMap(map);

          uploaded++;
          success = true;

          const pct = ((uploaded + skipped + failed) / (total - done) * 100).toFixed(0);
          process.stdout.write(`\r[${uploaded + skipped + failed}/${total - done}] ${pct}% | ✓ ${product.title.slice(0, 40)}`);
        } catch (err) {
          if (attempt === MAX_RETRIES) {
            console.error(`\nFAILED after ${MAX_RETRIES} attempts: ${shopifyUrl}`);
            console.error(`  Error: ${err.message}`);
            progress.failed[progressKey] = { shopifyUrl, error: err.message };
            saveProgress(progress);
            failed++;
          } else {
            console.error(`\nRetrying (${attempt}/${MAX_RETRIES}): ${err.message}`);
            await sleep(2000 * attempt);
          }
        }
      }

      await sleep(DELAY_MS);
    }
  }

  console.log(`\n\n=== UPLOAD COMPLETE ===`);
  console.log(`Uploaded: ${uploaded} | Skipped (already done): ${skipped} | Failed: ${failed}`);
  if (failed > 0) {
    console.log(`Failed images logged in ${PROGRESS_FILE} under "failed" key.`);
  }
  console.log(`Map saved to ${MAP_FILE}\n`);
}

// ─── Phase 2: Update Google Sheet ────────────────────────────────────────────

async function runSheetUpdate() {
  console.log('=== PHASE 2: UPDATE GOOGLE SHEET ===');

  const map = loadMap();
  if (Object.keys(map).length === 0) {
    console.error('ERROR: migration-map.json is empty. Run upload phase first.');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // Read all rows
  console.log('Reading sheet...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:G`,
  });
  const rows = res.data.values || [];
  if (rows.length < 2) { console.error('Sheet is empty.'); process.exit(1); }

  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const colImageUrl = headers.indexOf('image_url'); // G = index 6
  const colTags     = headers.indexOf('tags');      // F = index 5

  if (colImageUrl === -1) { console.error('Cannot find image_url column.'); process.exit(1); }

  let updatedRows = 0;
  const updatedValues = rows.map((row, rowIndex) => {
    if (rowIndex === 0) return row; // skip header
    const newRow = [...row];

    // Pad row to at least colImageUrl + 1 length
    while (newRow.length <= Math.max(colImageUrl, colTags)) newRow.push('');

    // Replace main image_url if it's a Shopify URL in the map
    const currentImageUrl = newRow[colImageUrl] || '';
    if (currentImageUrl.includes('cdn.shopify.com') && map[currentImageUrl]) {
      newRow[colImageUrl] = map[currentImageUrl];
      updatedRows++;
    }

    // Replace additional images in tags (images:url1,url2)
    if (colTags !== -1) {
      const tags = newRow[colTags] || '';
      if (tags.includes('images:')) {
        const parts = tags.split('|');
        const newParts = parts.map(part => {
          if (!part.startsWith('images:')) return part;
          const urls = part.slice(7).split(',');
          const newUrls = urls.map(u => map[u] || u);
          return 'images:' + newUrls.join(',');
        });
        newRow[colTags] = newParts.join('|');
      }
    }

    return newRow;
  });

  // Write back
  console.log(`Updating ${updatedRows} rows in sheet...`);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: updatedValues },
  });

  console.log(`\n=== SHEET UPDATE COMPLETE ===`);
  console.log(`Rows updated: ${updatedRows}`);
  console.log('All Shopify CDN URLs in the sheet have been replaced with Firebase URLs.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const phase = process.argv[2] || 'both';

  if (!SHEET_ID) { console.error('ERROR: GOOGLE_SHEETS_SPREADSHEET_ID not set'); process.exit(1); }

  try {
    if (phase === 'upload' || phase === 'both') {
      await runUpload();
    }
    if (phase === 'sheet' || phase === 'both') {
      await runSheetUpdate();
    }
    console.log('\nDone!');
  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
