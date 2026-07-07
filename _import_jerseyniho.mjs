// _import_jerseyniho.mjs — rebuild the Jerseys tab around the jerseyniho catalogue.
// Final composition per user instruction (2026-07-07):
//   header + stussy rows + firebase-image rows (kept as-is) + ALL jerseyniho
//   products mapped into our league/type system; everything else removed
//   (old sj- supplier rows, drip rows).
// Their own categorization is preserved verbatim in the tags column so the
// later naming/refinement pass loses nothing.
// Images: images.weserv.nl proxy over jerseyniho URLs (temporary until the
// Firebase billing account is re-enabled, then swap to our Storage).
// Run from foot-jersey/:  node _import_jerseyniho.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

function loadEnv(file) {
  const txt = fs.readFileSync(file, "utf8");
  const env = {};
  const re = /^([A-Z0-9_]+)=("(?:[^"\\]|\\.)*"|.*)$/gm;
  let m;
  while ((m = re.exec(txt))) {
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/\\n/g, "\n");
    env[m[1]] = v;
  }
  return env;
}
const env = loadEnv(".env.local");
const auth = new google.auth.GoogleAuth({
  credentials: { client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key: env.GOOGLE_PRIVATE_KEY },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });
const SID = env.GOOGLE_SHEETS_SPREADSHEET_ID;
const DRY = process.argv.includes("--dry");

const BASE = path.resolve("../catalog-tools/catalog-jerseyniho");
const products = JSON.parse(fs.readFileSync(path.join(BASE, "products.json"), "utf8"));

// ── their categories → our league slugs ─────────────────────────
const ENGLAND = ["ליגה אנגלית", "מנצ'סטר יונייטד", "ארסנל", "ליברפול", "צ'לסי", "מנצ'סטר סיטי", "טוטנהאם", "אסטון וילה"];
const SPAIN = ["ליגה ספרדית", "ריאל מדריד", "ברצלונה", "אתלטיקו מדריד"];
const ITALY = ["ליגה איטלקית", "מילאן", "אינטר", "יובנטוס", "נאפולי"];
const GERMANY = ["ליגה גרמנית", "באיירן מינכן", "דורטמונד"];
const FRANCE = ["ליגה צרפתית", "פריז סן ז'רמן"];
const NATIONAL = ["נבחרות", "ארגנטינה", "ברזיל", "פורטוגל", "צרפת", "ספרד", "אנגליה", "הולנד", "גרמניה", "איטליה", "מונדיאל 2026", "יורו 24", "קופה אמריקה"];
const REST = ["שאר העולם", "בנפיקה", "בוקה ג'וניורס", "ליגיונרים"];

// ── their categories → our types ────────────────────────────────
const OTHER_PRODUCTS = new Set([
  "מכנסיים", "אקססוריז", "צעיפים", "כדורים", "חורף", "קפוצ׳ונים", "מעילים",
  "אימוניות (בוגרים וילדים)", "חורף ילדים", "NBA", "JORDAN", "גופיות כדורסל - דני אבדיה", "בעלי חיים",
]);
const KIDS = new Set(["חליפות כדורגל לילדים", "רטרו ילדים", "תינוקות"]);
const RETRO = new Set(["חולצות כדורגל רטרו", "חולצת עבר", "רטרו ילדים"]);
const SKIP = new Set(["מיסטרי בוקס", "מיסטרי בוקס ישן"]); // site has its own built-in mystery boxes

const SEASON_BY_CAT = new Map(Object.entries({
  "עונת 26/27": "2026/27",
  "עונת 25/26": "2025/26",
  "עונת 24/25": "2024/25",
  "עונת 23/24": "2023/24",
}));

const weserv = (src) =>
  "https://images.weserv.nl/?url=" + encodeURIComponent(src.replace(/^https?:\/\//, "")) + "&output=webp&q=85";

function classify(p) {
  const cats = p.cats || [];
  const name = (p.name || "").replace(/\s+/g, " ").trim();
  if (cats.some((c) => SKIP.has(c))) return null;
  if (!p.images || !p.images.length) return null;

  // league — country/national first, then club/league categories override
  let league = "rest_of_world";
  if (cats.some((c) => NATIONAL.includes(c))) league = "national_teams";
  if (cats.some((c) => REST.includes(c))) league = "rest_of_world";
  if (cats.some((c) => ENGLAND.includes(c))) league = "england";
  if (cats.some((c) => SPAIN.includes(c))) league = "spain";
  if (cats.some((c) => ITALY.includes(c))) league = "italy";
  if (cats.some((c) => GERMANY.includes(c))) league = "germany";
  if (cats.some((c) => FRANCE.includes(c))) league = "france";
  // club name in the product title beats their categories (their women's RM/Barca
  // shirts are filed under ארגנטינה, which would land them in national_teams)
  if (/ריאל מדריד|ברצלונה|אתלטיקו מדריד/.test(name)) league = "spain";
  else if (/מנצ'סטר|ארסנל|ליברפול|צ'לסי|טוטנהאם|ניוקאסל|אסטון וילה|ווסטהאם|אברטון/.test(name)) league = "england";
  else if (/מילאן|אינטר|יובנטוס|נאפולי|רומא|פיורנטינה/.test(name)) league = "italy";
  else if (/באיירן|דורטמונד|לברקוזן|לייפציג/.test(name)) league = "germany";
  else if (/פריז סן|מארסיי|ליון|מונאקו|ליל/.test(name)) league = "france";
  else if (/נבחרת/.test(name)) league = "national_teams";

  // type — most specific wins: other_products > kids > retro > world_cup > regular
  let type = "regular";
  if (cats.includes("מונדיאל 2026")) type = "world_cup";
  if (cats.some((c) => RETRO.has(c))) type = "retro";
  if (cats.some((c) => KIDS.has(c))) type = "kids";
  if (cats.some((c) => OTHER_PRODUCTS.has(c))) type = "other_products";

  // season — explicit season category, else year in the name, world cup default
  let season = "";
  for (const c of cats) if (SEASON_BY_CAT.has(c)) season = SEASON_BY_CAT.get(c);
  if (!season) {
    let m;
    if ((m = name.match(/\b(\d{2})\/(\d{2})\b/))) season = `20${m[1]}/${m[2]}`;
    else if ((m = name.match(/\b(19\d\d|20\d\d)\b/))) season = m[1];
    else if (type === "world_cup") season = "2026";
  }

  // tags — carry over THEIR full categorization verbatim + our filter tags
  const tags = [...cats];
  if (cats.includes("חולצות משחק ארוכות") || /ארוכ/.test(name)) tags.push("ארוך");
  if (type === "world_cup" || cats.includes("מונדיאל 2026")) tags.push("מונדיאל");
  if (type === "retro") tags.push("רטרו");
  const uniqTags = [...new Set(tags)].filter((t) => t && !SKIP.has(t));

  return [`jn-${p.id}`, name, league, season, type, uniqTags.join("|"), weserv(p.images[0])];
}

const newRows = [];
for (const p of products) {
  const r = classify(p);
  if (r) newRows.push(r);
}
const byLeague = {}, byType = {};
for (const r of newRows) {
  byLeague[r[2]] = (byLeague[r[2]] || 0) + 1;
  byType[r[4]] = (byType[r[4]] || 0) + 1;
}
console.log("jerseyniho rows:", newRows.length);
console.log("by league:", JSON.stringify(byLeague));
console.log("by type:", JSON.stringify(byType));
console.log("samples:", JSON.stringify(newRows.slice(0, 3), null, 1));

// ── current sheet: keep stussy + firebase rows ──────────────────
const all = await sheets.spreadsheets.values.get({ spreadsheetId: SID, range: "Jerseys!A:J" });
const rows = all.data.values || [];
const header = rows[0];
const keep = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i] || [];
  const id = r[0] || "", type = (r[4] || "").trim(), tags = r[5] || "", img = r[6] || "";
  if (id.startsWith("sj-") || id.startsWith("jn-")) continue; // old supplier import / rerun
  if (type === "drip") continue; // removed per instruction
  if (type === "stussy" || /stussy/i.test(tags)) { keep.push(r); continue; }
  if (/firebasestorage/.test(img)) { keep.push(r); continue; }
  // anything else is removed
}
console.log(`keeping ${keep.length} existing rows (stussy + firebase)`);
if (DRY) process.exit(0);

// ── backup current tab, then rewrite ────────────────────────────
const meta = await sheets.spreadsheets.get({ spreadsheetId: SID });
const backupTitle = "Jerseys_backup_2026-07-07";
if (!meta.data.sheets.some((s) => s.properties.title === backupTitle)) {
  const src = meta.data.sheets.find((s) => s.properties.title === "Jerseys");
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SID,
    requestBody: { requests: [{ duplicateSheet: { sourceSheetId: src.properties.sheetId, newSheetName: backupTitle } }] },
  });
  console.log("backup tab created:", backupTitle);
} else {
  console.log("backup tab already exists:", backupTitle);
}

const finalRows = [header, ...keep, ...newRows];
await sheets.spreadsheets.values.clear({ spreadsheetId: SID, range: "Jerseys!A:J" });
const CHUNK = 2000;
for (let i = 0; i < finalRows.length; i += CHUNK) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SID,
    range: i === 0 ? "Jerseys!A1" : `Jerseys!A${i + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: finalRows.slice(i, i + CHUNK) },
  });
  console.log(`  wrote ${Math.min(i + CHUNK, finalRows.length)}/${finalRows.length}`);
}
const after = await sheets.spreadsheets.values.get({ spreadsheetId: SID, range: "Jerseys!A:A" });
console.log("Jerseys tab now:", (after.data.values || []).length - 1, "data rows");
