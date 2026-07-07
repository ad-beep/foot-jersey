// _cleanup_fb_women.mjs — per user 2026-07-07:
//  1) remove the 84 firebase-image rows (402-broken while GCP billing is closed;
//     user will handle later — all preserved in Jerseys_backup_2026-07-07)
//  2) remove women's jerseys (נשים in name or in the jerseyniho category tags)
import fs from "node:fs";
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

const all = await sheets.spreadsheets.values.get({ spreadsheetId: SID, range: "Jerseys!A:J" });
const rows = all.data.values || [];
const keep = [rows[0]];
let fb = 0, women = 0;
for (let i = 1; i < rows.length; i++) {
  const r = rows[i] || [];
  if (!r.length) continue;
  const name = r[1] || "", tags = (r[5] || "").split("|"), img = r[6] || "";
  if (/firebasestorage/.test(img)) { fb++; continue; }
  if (/נשים/.test(name) || tags.includes("נשים")) { women++; continue; }
  keep.push(r);
}
console.log(`removing ${fb} firebase rows + ${women} women's rows, keeping ${keep.length - 1}`);

await sheets.spreadsheets.values.clear({ spreadsheetId: SID, range: "Jerseys!A:J" });
await sheets.spreadsheets.values.update({
  spreadsheetId: SID,
  range: "Jerseys!A1",
  valueInputOption: "RAW",
  requestBody: { values: keep },
});
const after = await sheets.spreadsheets.values.get({ spreadsheetId: SID, range: "Jerseys!A:A" });
console.log("Jerseys tab now:", (after.data.values || []).length - 1, "data rows");
