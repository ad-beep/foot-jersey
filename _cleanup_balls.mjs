// _cleanup_balls.mjs — per user 2026-07-07: remove balls (כדורים) from the catalogue.
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
let balls = 0;
for (let i = 1; i < rows.length; i++) {
  const r = rows[i] || [];
  if (!r.length) continue;
  const name = r[1] || "", tags = (r[5] || "").split("|");
  if (tags.includes("כדורים") || /^כדור\b/.test(name)) { balls++; continue; }
  keep.push(r);
}
console.log(`removing ${balls} balls, keeping ${keep.length - 1}`);

await sheets.spreadsheets.values.clear({ spreadsheetId: SID, range: "Jerseys!A:J" });
await sheets.spreadsheets.values.update({
  spreadsheetId: SID,
  range: "Jerseys!A1",
  valueInputOption: "RAW",
  requestBody: { values: keep },
});
const after = await sheets.spreadsheets.values.get({ spreadsheetId: SID, range: "Jerseys!A:A" });
console.log("Jerseys tab now:", (after.data.values || []).length - 1, "data rows");
