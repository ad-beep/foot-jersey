// _cleanup_bad_covers.mjs — remove imported sj- rows whose cover image failed
// visual QA (close-ups, back views, NBA/basketball, backpacks, training sets).
// Bad ids come from catalog-tools/catalog-sjy/qa/bad_ids.json (built while
// reviewing the 60 contact sheets).
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

const badIds = new Set(
  JSON.parse(fs.readFileSync(path.resolve("../catalog-tools/catalog-sjy/qa/bad_ids.json"), "utf8"))
    .map((id) => "sj-" + id)
);
console.log("bad ids loaded:", badIds.size);

const res = await sheets.spreadsheets.values.get({ spreadsheetId: SID, range: "Jerseys!A:J" });
const rows = res.data.values || [];
const header = rows[0];

const keep = [header];
let removed = 0;
for (let i = 1; i < rows.length; i++) {
  const r = rows[i] || [];
  if (!r.length) continue;
  if (badIds.has(r[0] || "")) { removed++; continue; }
  keep.push(r);
}
console.log(`removing ${removed} rows, keeping ${keep.length - 1} rows`);

await sheets.spreadsheets.values.clear({ spreadsheetId: SID, range: "Jerseys!A:J" });
await sheets.spreadsheets.values.update({
  spreadsheetId: SID,
  range: "Jerseys!A1",
  valueInputOption: "RAW",
  requestBody: { values: keep },
});
const after = await sheets.spreadsheets.values.get({ spreadsheetId: SID, range: "Jerseys!A:A" });
console.log("Jerseys tab now:", (after.data.values || []).length - 1, "data rows");
