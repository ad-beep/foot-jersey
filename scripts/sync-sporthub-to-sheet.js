/**
 * sync-sporthub-to-sheet.js
 *
 * Adds products from sporthub_full.json that are NOT already in Google Sheets.
 * Matches by team_name (title) — skips anything already present so you never
 * get duplicates. Safe to re-run at any time.
 *
 * Run: node scripts/sync-sporthub-to-sheet.js
 */

const { google } = require('googleapis');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const CLIENT_EMAIL   = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY    = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SHEET_NAME     = 'Jerseys';

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateId() {
  return 'sh-' + crypto.randomBytes(8).toString('hex');
}

function extractSeason(title) {
  const m = title.match(/\d{4}\/\d{2}/) || title.match(/\d{4}/);
  return m ? m[0] : '';
}

function deriveLeague(tags) {
  const t = tags.map(s => s.toLowerCase());
  if (t.includes('נבחרות') || t.some(s => ['ברזיל','ארגנטינה','צרפת-נבחרת','ספרד-נבחרת','גרמניה-נבחרת'].includes(s))) {
    // Check for club leagues first before defaulting to national teams
  }
  if (t.includes('נבחרות')) return 'national_teams';
  if (t.includes('אנגליה')) return 'england';
  if (t.includes('ספרד'))   return 'spain';
  if (t.includes('איטליה')) return 'italy';
  if (t.includes('גרמניה')) return 'germany';
  if (t.includes('צרפת'))   return 'france';
  return 'rest_of_world';
}

function deriveType(tags, title) {
  const t = tags.map(s => s.toLowerCase());
  const ttl = title.toLowerCase();
  if (t.includes('מונדיאל')) return 'world_cup';
  if (t.includes('ילדים'))   return 'kids';
  if (t.includes('רטרו'))    return 'retro';
  if (t.includes('מיוחדות') || t.includes('מיוחד') || ttl.includes('מיוחד')) return 'special';
  if (t.includes('דריפ') || t.includes('drip'))   return 'drip';
  if (t.includes('סטוסי') || t.includes('stussy')) return 'stussy';
  return 'regular';
}

function derivePrice(variants) {
  const prices = (variants || [])
    .map(v => parseFloat(v.price))
    .filter(p => !isNaN(p));
  return prices.length > 0 ? String(Math.min(...prices)) : '';
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Sync Sporthub → Google Sheets ===\n');

  // Load new sporthub JSON
  const sporthub = require('../sporthub_full.json');
  const newProducts = Array.isArray(sporthub) ? sporthub : Object.values(sporthub);
  console.log(`Loaded ${newProducts.length} products from sporthub_full.json`);

  // Authenticate
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // Read current sheet
  console.log('Reading current Google Sheet...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:J`,
  });

  const rows = res.data.values || [];
  const header = rows[0] || [];
  const dataRows = rows.slice(1);

  // Build set of existing team_names (normalised for matching)
  const normalize = s => (s || '').trim().replace(/\s+/g, ' ');
  const existingNames = new Set(dataRows.map(r => normalize(r[1] || '')));

  console.log(`  Sheet has ${dataRows.length} existing products.\n`);

  // Determine which new products to add
  const toAdd = [];
  for (const p of newProducts) {
    const title = normalize(p.title || '');
    if (!title) continue;
    if (existingNames.has(title)) continue; // already in sheet

    const imageUrl = (p.images || [])[0] || '';
    if (!imageUrl) continue; // no image — skip

    const tags   = Array.isArray(p.tags) ? p.tags : (p.tags || '').split(',').map(s => s.trim()).filter(Boolean);
    const league = deriveLeague(tags);
    const season = extractSeason(title);
    const type   = deriveType(tags, title);
    const price  = derivePrice(p.variants);

    toAdd.push([
      generateId(),               // A: id
      title,                      // B: team_name
      league,                     // C: league
      season,                     // D: season
      type,                       // E: type
      tags.join('|'),             // F: tags
      imageUrl,                   // G: image_url
      'S,M,L,XL,XXL',            // H: available_sizes (default)
      price,                      // I: price
      new Date().toISOString().slice(0, 10), // J: date_added
    ]);
  }

  if (toAdd.length === 0) {
    console.log('Nothing to add — sheet is already up to date.');
    return;
  }

  console.log(`Adding ${toAdd.length} missing products to the sheet...`);
  toAdd.slice(0, 5).forEach(r => console.log('  +', r[1], `(${r[2]}, ${r[4]})`));
  if (toAdd.length > 5) console.log(`  ... and ${toAdd.length - 5} more`);
  console.log('');

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:J`,
    valueInputOption: 'RAW',
    requestBody: { values: toAdd },
  });

  console.log(`Done! ${toAdd.length} products added.`);
  console.log('Cache will refresh automatically within 60 seconds.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
