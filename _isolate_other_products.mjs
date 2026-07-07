// _isolate_other_products.mjs — per user 2026-07-07: coats/tracksuits (all
// type=other_products rows) must appear ONLY in the Other Products section.
// Blanks their league + season so league pages and season collections skip them;
// the other-products section filters by type and keeps showing them.
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
let changed = 0;
const sampleNames = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i] || [];
  if ((r[4] || "").trim() === "other_products") {
    if ((r[2] || "") !== "" || (r[3] || "") !== "") {
      r[2] = ""; // league
      r[3] = ""; // season
      changed++;
      if (sampleNames.length < 6) sampleNames.push(r[1]);
    }
  }
}
console.log(`blanked league+season on ${changed} other_products rows`);
console.log("samples:", sampleNames);

await sheets.spreadsheets.values.update({
  spreadsheetId: SID,
  range: "Jerseys!A1",
  valueInputOption: "RAW",
  requestBody: { values: rows },
});
console.log("sheet updated");
