/**
 * sync-catalog.mjs
 * Fetches all products from sporthubkit.com, compares with the Google Sheets
 * catalog, and appends missing jerseys using YOUR price structure.
 *
 * Usage:
 *   node scripts/sync-catalog.mjs          <- dry run (prints diff only)
 *   node scripts/sync-catalog.mjs --write  <- actually writes to Sheets
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = !process.argv.includes('--write');

// ─── Env ───────────────────────────────────────────────────────
function readEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
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

// ─── Fetch all SportHubKit products (paginated) ───────────────
async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`https://sporthubkit.com/products.json?limit=250&page=${page}`);
    const json = await res.json();
    if (!json.products?.length) break;
    all.push(...json.products);
    if (json.products.length < 250) break;
  }
  return all;
}

// ─── Normalise image URL (strip Shopify CDN version param) ────
const imgBase = (url) => (url || '').split('?')[0].trim();

// ─── Tag helpers ──────────────────────────────────────────────
const hasTag = (tags, t) => tags.includes(t);
const KIDS_TAGS = ['ילדים', 'ילדים-יורו', 'ילדים-רטרו', 'ריאל-ילדים'];
const isKids   = (tags, title) => KIDS_TAGS.some(t => hasTag(tags, t)) || title.includes('סט ילדים');

// ─── Type mapping ────────────────────────────────────────────
function getType(tags, title) {
  if (isKids(tags, title)) return 'kids';
  if (hasTag(tags, 'רטרו'))    return 'retro';
  if (hasTag(tags, 'מיוחדות') || title.includes('מיוחד')) return 'special';
  if (hasTag(tags, 'מונדיאל') || title.includes('מונדיאל')) return 'world_cup';
  return 'regular';
}

// ─── League mapping ──────────────────────────────────────────
function getLeague(tags) {
  if (hasTag(tags,'ברצלונה') || hasTag(tags,'ריאל מדריד') || hasTag(tags,'בטיס')) return 'spain';
  if (hasTag(tags,'באירן מינכן')) return 'germany';
  if (hasTag(tags,'פריס'))         return 'france';   // PSG
  // Everything else with national identity
  if (hasTag(tags,'גרמניה') || hasTag(tags,'ספרד') || hasTag(tags,'צרפת') ||
      hasTag(tags,'אנגליה') || hasTag(tags,'ארגנטינה') || hasTag(tags,'פורטוגל') ||
      hasTag(tags,'יפן')    || hasTag(tags,'קולומביה'))                         return 'national_teams';
  return 'rest_of_world';
}

// ─── English name lookup ──────────────────────────────────────
const EN = {
  'ברצלונה':     'Barcelona',
  'ריאל מדריד':  'Real Madrid',
  'ריאל בטיס':   'Real Betis',
  'בטיס':        'Real Betis',
  'פריס':        'PSG',
  'באירן מינכן': 'Bayern Munich',
  'גרמניה':      'Germany',
  'ספרד':        'Spain',
  'צרפת':        'France',
  'אנגליה':      'England',
  'יפן':         'Japan',
  'ארגנטינה':    'Argentina',
  'קולומביה':    'Colombia',
  'פורטוגל':     'Portugal',
  'ארה"ב':       'USA',
  'מילאן':       'AC Milan',
  'ארסנל':       'Arsenal',
  'פיורנטינה':   'Fiorentina',
  'יונייטד':     'Manchester United',
  'ברזיל':       'Brazil',
  'אינטר':       'Inter Milan',
};

function getEnName(tags, title = '') {
  // Tags are authoritative
  for (const [he, en] of Object.entries(EN)) {
    if (hasTag(tags, he)) return en;
  }
  // Fall back to title scan (catches ארה"ב and teams not in tags)
  for (const [he, en] of Object.entries(EN)) {
    if (title.includes(he)) return en;
  }
  return '';
}

// ─── Season extraction ────────────────────────────────────────
function extractSeason(title) {
  // "2025/26" or "2026-27"
  let m = title.match(/20(\d{2})[\/\-](\d{2})/);
  if (m) return `${m[1]}/${m[2]}`;
  // Short form "14/15" or "98/99"
  m = title.match(/\b(\d{2})\/(\d{2})\b/);
  if (m) return `${m[1]}/${m[2]}`;
  // Single year "2026"
  m = title.match(/\b(20\d{2})\b/);
  if (m) {
    const y = parseInt(m[1].slice(2));
    return `${String(y - 1).padStart(2,'0')}/${String(y).padStart(2,'0')}`;
  }
  // Retro single year "1994"
  m = title.match(/\b(1\d{3})\b/);
  if (m) {
    const y = m[1];
    const prev = String(parseInt(y) - 1).slice(2);
    return `${prev}/${y.slice(2)}`;
  }
  return '25/26';
}

// ─── Team name for catalog ────────────────────────────────────
function buildTeamName(tags, title, enName, type, season) {
  const dir = title.includes('חוץ') ? 'Away' : 'Home';
  const base = enName || title;

  if (type === 'retro') {
    const year = title.match(/\b(1\d{3}|20\d{2})\b/)?.[1] || season;
    return `${base} Retro ${dir} ${year}`;
  }
  if (type === 'kids') {
    const year = title.match(/\b(20\d{2})\b/)?.[1] || '';
    if (hasTag(tags,'רטרו')) return `${base} Retro ${dir} Kids`;
    if (hasTag(tags,'מונדיאל')) return `${base} ${dir} 2026 Kids`;
    return `${base} ${dir}${year ? ' '+year : ''} Kids`;
  }
  if (type === 'world_cup') return `${base} ${dir} 2026`;
  if (type === 'special') {
    const yearM = title.match(/20\d{2}/);
    const year = yearM ? yearM[0] : '';
    // strip common Hebrew words and all remaining Hebrew chars, leaving only year/latin
    const variant = title
      .replace(/נבחרת\s+|חולצת\s+|כדורגל\s+|מיוחדת?\s*/gi, '')
      .replace(/20\d{2}/g, '')
      .replace(/[א-תװ-״יִ-פֿ]+/g, '')
      .replace(/[-\s]+/g, ' ').trim();
    const suffix = variant || year;
    return `${base} Special${suffix ? ' ' + suffix : ''}`.trim();
  }
  return `${base} ${dir} ${season}`;
}

// ─── Prices (your structure) ──────────────────────────────────
const PRICE = { regular:100, retro:110, kids:100, special:100, world_cup:100 };

// ─── Sizes ────────────────────────────────────────────────────
function getSizes(type) {
  return type === 'kids' ? '16,18,20,22,24,26,28' : 'S,M,L,XL,XXL';
}

// ─── Generate ID from image filename ─────────────────────────
function genId(imageUrl) {
  const fname = imgBase(imageUrl).split('/').pop() || '';
  return fname.replace(/\.[^.]+$/, '').toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 64);
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  const env = readEnv();

  // Auth
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;

  // Fetch current catalog
  console.log('📋 Fetching Google Sheets catalog…');
  const sheetRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Jerseys!A:J',
  });
  const sheetRows = sheetRes.data.values || [];
  const headers = sheetRows[0] || [];
  const dataRows = sheetRows.slice(1);

  const imgCol = headers.findIndex(h => h.toLowerCase().includes('image'));
  const idCol  = headers.findIndex(h => h.toLowerCase() === 'id');

  const existingImgBases = new Set(
    dataRows.map(r => imgBase(r[imgCol] || ''))
  );
  const existingIds = new Set(dataRows.map(r => r[idCol] || ''));

  console.log(`   Current rows: ${dataRows.length}`);

  // Fetch SportHubKit
  console.log('🌐 Fetching sporthubkit.com catalog (all pages)…');
  const products = await fetchAllProducts();
  console.log(`   SportHubKit products: ${products.length}`);

  // Identify missing
  const toAdd = [];
  const skipped = [];

  for (const p of products) {
    const imgUrl = p.images?.[0]?.src || '';
    if (!imgUrl) { skipped.push(`NO IMAGE: ${p.title}`); continue; }

    const base = imgBase(imgUrl);
    if (existingImgBases.has(base)) { skipped.push(`EXISTS: ${p.title}`); continue; }

    const tags    = p.tags || [];
    const title   = p.title || '';
    const type    = getType(tags, title);
    const league  = getLeague(tags);
    const season  = extractSeason(title);
    const enName  = getEnName(tags, title);
    const teamName = buildTeamName(tags, title, enName, type, season);
    const price   = PRICE[type] || 100;
    const sizes   = getSizes(type);

    // Build tags string (en: prefix for English name, Hebrew name tag)
    const myTags = [];
    if (enName) myTags.push(`en:${enName}`);

    // Ensure ID is unique
    let id = genId(imgUrl);
    let suffix = 0;
    while (existingIds.has(id)) { id = `${genId(imgUrl)}-${++suffix}`; }
    existingIds.add(id);

    const row = [
      id,
      teamName,
      league,
      season,
      type,
      myTags.join('|'),
      imgUrl,
      sizes,
      String(price),
      new Date().toISOString().slice(0, 10),
    ];

    toAdd.push({ row, title, type, league, enName, teamName });
  }

  // Report
  console.log(`\n✅ Already in catalog: ${skipped.filter(s=>s.startsWith('EXISTS')).length}`);
  console.log(`⏭  No image (skipped): ${skipped.filter(s=>s.startsWith('NO')).length}`);
  console.log(`\n🆕 Missing (to add): ${toAdd.length}`);

  if (toAdd.length === 0) {
    console.log('Nothing new to add — catalog is up to date!');
    return;
  }

  // Group by category for readability
  const byType = {};
  for (const item of toAdd) {
    (byType[item.type] = byType[item.type] || []).push(item);
  }
  for (const [type, items] of Object.entries(byType)) {
    console.log(`\n  [${type}] — ${items.length} new:`);
    for (const item of items) {
      console.log(`    + ${item.teamName}  (${item.league})`);
      console.log(`      orig: "${item.title}"`);
    }
  }

  if (DRY_RUN) {
    console.log('\n\n⚠️  DRY RUN — nothing written.');
    console.log('    Re-run with --write to commit these to Google Sheets.');
    return;
  }

  // Write to Sheets
  console.log('\n📝 Writing to Google Sheets…');
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Jerseys!A:J',
    valueInputOption: 'RAW',
    requestBody: { values: toAdd.map(i => i.row) },
  });

  console.log(`\n✅ Done! Added ${toAdd.length} jerseys to your catalog.`);
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
