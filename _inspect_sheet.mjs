// _inspect_sheet.mjs — quick composition report of the Jerseys tab
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
console.log("HEADER:", JSON.stringify(rows[0]));

let sj = 0, stussy = 0, fb = 0, drip = 0, other = 0;
const samples = { stussy: null, fb: null, drip: null, other: [] };
for (let i = 1; i < rows.length; i++) {
  const r = rows[i] || [];
  const id = r[0] || "", type = (r[4] || "").trim(), tags = r[5] || "", img = r[6] || "";
  if (id.startsWith("sj-")) sj++;
  else if (type === "stussy" || /stussy/i.test(tags)) { stussy++; samples.stussy = samples.stussy || r; }
  else if (type === "drip") { drip++; samples.drip = samples.drip || r; }
  else if (/firebasestorage/.test(img)) { fb++; samples.fb = samples.fb || r; }
  else { other++; if (samples.other.length < 6) samples.other.push(r); }
}
console.log({ sj, stussy, fb, drip, other, total: rows.length - 1 });
console.log("stussy sample:", JSON.stringify(samples.stussy));
console.log("fb sample:", JSON.stringify(samples.fb));
console.log("drip sample:", JSON.stringify(samples.drip));
console.log("other samples:", JSON.stringify(samples.other, null, 1));
