/**
 * hide-broken-images.mjs  (STOPGAP — reversible)
 *
 * Sport Hub deleted ~73% of our copied images (cdn.shopify.com 404s). The app
 * (src/lib/google-sheets.ts) already hides any row with an empty image_url, so
 * the cleanest, reversible way to hide broken products is to BLANK the image_url
 * cell for rows whose image no longer loads. No row deletion, no app deploy.
 *
 * Safety: before writing, the entire Jerseys tab is duplicated to a dated backup
 * tab. To undo, copy the image_url column back from the backup.
 *
 * Firebase-hosted images and still-alive Shopify images are left untouched.
 *
 * Usage:
 *   node scripts/hide-broken-images.mjs           <- DRY RUN (counts only, no writes)
 *   node scripts/hide-broken-images.mjs --write    <- backup + blank dead image_urls
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes('--write');
const SHEET = 'Jerseys';

function readEnv() {
  const content = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[m[1].trim()] = v;
  }
  return env;
}

const colLetter = (i) => String.fromCharCode(65 + i); // 0->A (only valid for A..Z; our sheet is A:J)
const isFirebase = (u) => u.includes('firebasestorage.googleapis.com');

const env = readEnv();
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;

console.log(WRITE ? '=== HIDE BROKEN (WRITE MODE) ===' : '=== HIDE BROKEN (DRY RUN — no writes) ===');

const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET}!A:J` });
const rows = res.data.values || [];
const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
const imgIdx = headers.findIndex((h) => h.includes('image'));
if (imgIdx === -1) { console.error('No image column'); process.exit(1); }
console.log(`image_url is column ${colLetter(imgIdx)} (index ${imgIdx}) | data rows: ${rows.length - 1}`);

// Status-check every main image
const data = rows.slice(1);
let i = 0;
const status = new Array(data.length).fill(null);
async function worker() {
  while (i < data.length) {
    const k = i++;
    const u = data[k][imgIdx] || '';
    if (!u) { status[k] = 'empty'; continue; }
    if (isFirebase(u)) { status[k] = 'firebase'; continue; }
    try {
      const r = await fetch(u, { method: 'GET' });
      if (r.body && r.body.cancel) r.body.cancel();
      status[k] = r.status === 200 ? 'ok' : 'dead';
    } catch { status[k] = 'dead'; }
  }
}
console.log('Checking every main image…');
await Promise.all(Array.from({ length: 12 }, worker));

// Build new image_url column: blank the dead/empty-broken ones, keep the rest
const headerVal = rows[0][imgIdx] ?? 'image_url';
let toHide = 0, kept = 0, alreadyEmpty = 0;
const newCol = [[headerVal]];
data.forEach((row, k) => {
  const cur = row[imgIdx] || '';
  if (status[k] === 'dead') { newCol.push(['']); toHide++; }
  else if (status[k] === 'empty') { newCol.push(['']); alreadyEmpty++; }
  else { newCol.push([cur]); kept++; }
});

const counts = status.reduce((a, s) => ((a[s] = (a[s] || 0) + 1), a), {});
console.log('\nstatus tally:', JSON.stringify(counts));
console.log(`\nWILL HIDE (blank image_url): ${toHide}`);
console.log(`WILL KEEP (working/firebase): ${kept}`);
console.log(`already empty: ${alreadyEmpty}`);

if (!WRITE) {
  console.log('\n⚠️  DRY RUN — nothing written. Re-run with --write to back up + hide.');
  process.exit(0);
}

// 1. Back up the whole tab
const meta = await sheets.spreadsheets.get({ spreadsheetId });
const src = meta.data.sheets.find((s) => s.properties.title === SHEET);
const backupTitle = `Jerseys_backup_${new Date().toISOString().slice(0, 10)}`;
console.log(`\nBacking up '${SHEET}' → '${backupTitle}'…`);
await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: { requests: [{ duplicateSheet: { sourceSheetId: src.properties.sheetId, newSheetName: backupTitle } }] },
});

// 2. Write the blanked image_url column back
const col = colLetter(imgIdx);
console.log(`Writing image_url column (${col}) with ${toHide} blanks…`);
await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: `${SHEET}!${col}1:${col}${newCol.length}`,
  valueInputOption: 'RAW',
  requestBody: { values: newCol },
});
console.log(`\n✅ Done. Hid ${toHide} broken products; ${kept} remain visible.`);
console.log(`   Backup tab: ${backupTitle}. Store updates within ~35 min (cache+ISR).`);
