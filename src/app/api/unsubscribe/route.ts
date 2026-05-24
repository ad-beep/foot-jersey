import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { SITE_URL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t') ?? '';

  let email = '';
  try {
    email = Buffer.from(token, 'base64url').toString('utf8');
    if (!email || !email.includes('@')) throw new Error('invalid');
  } catch {
    return new NextResponse(errorPage('Invalid unsubscribe link.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    const snap = await getDocs(query(collection(db, 'exitIntentLeads'), where('email', '==', email)));
    await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { unsubscribedAt: Timestamp.now() })));
  } catch (err) {
    console.error('[unsubscribe] db error:', err);
  }

  return new NextResponse(successPage(), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

function successPage() {
  return page(
    '✓',
    "You've been unsubscribed",
    "You won't receive marketing emails from FootJersey anymore. Order confirmations and shipping updates are unaffected.",
  );
}

function errorPage(msg: string) {
  return page('✕', 'Something went wrong', msg);
}

function page(icon: string, heading: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${heading} — FootJersey</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0a0a0a;color:#e5e5e5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
         display:flex;align-items:center;justify-content:center;min-height:100vh}
    .box{background:#141414;border:1px solid #1f1f1f;border-radius:16px;padding:48px 40px;text-align:center;max-width:420px;width:90%}
    .icon{font-size:40px;margin-bottom:20px}
    h1{color:#fff;font-size:20px;margin-bottom:10px}
    p{color:#666;font-size:14px;line-height:1.6}
    a{color:#C8A24B;text-decoration:none;display:inline-block;margin-top:20px;font-size:14px}
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">${icon}</div>
    <h1>${heading}</h1>
    <p>${body}</p>
    <a href="${SITE_URL}">← Back to FootJersey</a>
  </div>
</body>
</html>`;
}
